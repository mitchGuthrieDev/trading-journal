/* Cloudflare Pages Function — GET /api/admin-key
   Issues a SHORT-LIVED signed admin token to an already-authenticated admin so the
   admin page can act without the raw ADMIN_KEY ever reaching the browser (S3).

   It only responds when the request arrived through Cloudflare Access — i.e. it
   carries the `Cf-Access-Jwt-Assertion` header Cloudflare injects on Access-protected
   hostnames. When ACCESS_TEAM_DOMAIN + ACCESS_AUD are configured, the assertion's
   signature is verified against the team JWKS before anything is issued (S4); when
   they're not set, it falls back to requiring the header's presence (the route is
   also behind Access + the _middleware gate). Off-Access it returns 401 and the
   admin page falls back to manual key entry. */

import { issueToken, verifyAccessJwt } from '../_lib/auth.js';
import { json } from '../_lib/http.js';

export async function onRequest(context) {
  const { request, env } = context;
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  let email = request.headers.get('Cf-Access-Authenticated-User-Email') || null;
  if (!assertion) return json({ error: 'not authenticated' }, 401);

  // S4: verify the Access JWT signature + audience when Access is configured.
  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const payload = await verifyAccessJwt(assertion, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
    if (!payload) return json({ error: 'invalid Access token' }, 401);
    email = payload.email || email;
  }

  const secret = env.TOKEN_SECRET || env.ADMIN_KEY;
  if (!secret) return json({ error: 'ADMIN_KEY not set' }, 500);

  // S3: hand back a short-lived signed token, never the raw key.
  const ttl = Number(env.ADMIN_TOKEN_TTL_SEC) || 7200; // 2h default
  const { token, exp } = await issueToken(secret, ttl);
  return json({ token, exp, email });
}
