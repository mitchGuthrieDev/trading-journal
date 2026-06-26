/* Cloudflare Pages Function — /api/config
   Admin-managed configuration (feature flags + reference-data cache version),
   stored in the `STATUS_KV` namespace under the `config` key.

   GET  → returns the current config (no secrets). Public-readable so the app can
          consume flags later; today it's a scaffold.
   POST → admin only (x-admin-key must match the ADMIN_KEY secret). Body is a
          partial config to merge: { flags?: {...}, bumpRefData?: true }.

   Defaults: { flags: { showBetaAdapters:true, maintenanceBanner:false }, refDataVersion:null } */

import { isAdminAuthorized } from '../_lib/auth.js';
import { json, rateLimited } from '../_lib/http.js';

const KEY = 'config';
const DEFAULTS = {
  flags: { showBetaAdapters: true, maintenanceBanner: false },
  refDataVersion: null,
  // Live version per surface + the overall platform label. Admin-editable; the
  // apps display their own baked-in version, this is the source-of-truth record
  // used to coordinate staging -> prod promotions.
  versions: { main: 'v0.11', demo: 'v0.11', staging: 'v0.13', platform: 'Beta 1.0' }
};

async function read(kv) {
  if (!kv) return { ...DEFAULTS };
  try { const raw = await kv.get(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }; }
  catch (_) { return { ...DEFAULTS }; }
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.STATUS_KV;

  if (request.method === 'GET') return json(await read(kv));

  if (request.method === 'POST') {
    if (await rateLimited(env, 'config', request)) return json({ error: 'rate limited' }, 429);
    if (!(await isAdminAuthorized(request, env))) return json({ error: 'unauthorized' }, 401);
    if (!kv) return json({ error: 'STATUS_KV namespace is not bound' }, 500);
    let body; try { body = await request.json(); } catch (_) { return json({ error: 'invalid JSON body' }, 400); }
    const cur = await read(kv);
    if (body && body.flags && typeof body.flags === 'object') cur.flags = { ...cur.flags, ...body.flags };
    if (body && body.versions && typeof body.versions === 'object') cur.versions = { ...cur.versions, ...body.versions };
    if (body && body.bumpRefData) cur.refDataVersion = new Date().toISOString();
    cur.updatedAt = new Date().toISOString();
    await kv.put(KEY, JSON.stringify(cur));
    return json(cur);
  }

  return json({ error: 'method not allowed' }, 405);
}
