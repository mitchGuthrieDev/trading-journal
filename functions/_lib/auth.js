/* Shared auth helpers for Pages Functions.

   S3 — short-lived signed admin tokens: the Access-authenticated /api/admin-key
   endpoint hands the browser an HMAC-SHA256 token (signed with a server secret)
   instead of the raw ADMIN_KEY, so the key never leaves the server. /api/status,
   /api/config, and the staging gate verify the token; the raw key stays accepted
   as a server-side fallback (handy for scripted calls), but is never sent to a browser.

   S4 — Cloudflare Access JWT verification: validate the Cf-Access-Jwt-Assertion
   signature against the team's JWKS (+ audience + issuer + expiry) before trusting it.

   This module only exports helpers (no onRequest), so it is never served as a route. */

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes){
  const b = new Uint8Array(bytes); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(str){
  const pad = '==='.slice((str.length + 3) % 4);
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(str){ return dec.decode(b64urlToBytes(str)); }

async function hmacKey(secret){
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/* Constant-time string compare that leaks neither contents nor length: HMAC both
   sides under a fresh random key (fixed 32-byte output) and compare the digests. */
async function timingSafeEqual(a, b){
  const k = await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const ma = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(String(a))));
  const mb = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(String(b))));
  let diff = ma.length ^ mb.length;
  for (let i = 0; i < ma.length; i++) diff |= ma[i] ^ mb[i];
  return diff === 0;
}

/* Issue an opaque token `base64url(payload).base64url(hmac)`. ttlSec = lifetime. */
export async function issueToken(secret, ttlSec){
  const exp = Date.now() + ttlSec * 1000;
  const payload = b64urlEncode(enc.encode(JSON.stringify({ exp })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return { token: payload + '.' + b64urlEncode(sig), exp };
}

/* Verify a token: HMAC valid (constant-time via subtle.verify) AND not expired. */
export async function verifyToken(secret, token){
  if (!secret || typeof token !== 'string' || token.indexOf('.') < 0) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64urlToBytes(sig), enc.encode(payload));
    if (!ok) return false;
    const data = JSON.parse(b64urlToString(payload));
    return typeof data.exp === 'number' && Date.now() < data.exp;
  } catch (_) { return false; }
}

/* True if the request is authorized: a valid admin token OR (server-side fallback)
   the raw ADMIN_KEY, carried in the x-admin-key header (or `provided` override). */
export async function isAdminAuthorized(request, env, provided){
  const val = provided != null ? provided : request.headers.get('x-admin-key');
  if (!val) return false;
  if (env.ADMIN_KEY && await timingSafeEqual(val, env.ADMIN_KEY)) return true;   // raw-key fallback (constant-time)
  const secret = env.TOKEN_SECRET || env.ADMIN_KEY;
  return secret ? verifyToken(secret, val) : false;
}

/* ---- S4: Cloudflare Access JWT verification ---- */
let JWKS_CACHE = { url: null, at: 0, keys: null };
const JWKS_TTL = 3600 * 1000;

async function getJwks(teamDomain){
  const url = teamDomain.replace(/\/+$/, '') + '/cdn-cgi/access/certs';
  if (JWKS_CACHE.url === url && JWKS_CACHE.keys && (Date.now() - JWKS_CACHE.at) < JWKS_TTL) return JWKS_CACHE.keys;
  const r = await fetch(url, { cf: { cacheTtl: 3600 } });
  if (!r.ok) throw new Error('JWKS fetch failed: ' + r.status);
  const j = await r.json();
  JWKS_CACHE = { url, at: Date.now(), keys: j.keys || [] };
  return JWKS_CACHE.keys;
}

/* Verify a Cloudflare Access JWT (RS256) against the team JWKS + audience + issuer
   + expiry. Returns the decoded payload on success, or null on any failure. */
export async function verifyAccessJwt(assertion, teamDomain, aud){
  try {
    if (!assertion || !teamDomain || !aud) return null;
    const parts = assertion.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(b64urlToString(parts[0]));
    const payload = JSON.parse(b64urlToString(parts[1]));
    if (header.alg !== 'RS256' || !header.kid) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) return null;
    if (payload.nbf && now < payload.nbf) return null;
    const iss = teamDomain.replace(/\/+$/, '');
    if (payload.iss && payload.iss.replace(/\/+$/, '') !== iss) return null;
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;

    const jwk = (await getJwks(teamDomain)).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
    return ok ? payload : null;
  } catch (_) { return null; }
}
