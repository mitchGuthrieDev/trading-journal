/* Cloudflare Pages middleware — runs for every request.

   NOTE: the previous version also 404'd /admin off the admin subdomain, which broke
   admin access — that part is reverted. The admin panel is protected by Cloudflare
   Access + the ADMIN_KEY; the middleware no longer touches /admin.

   It now gates the STAGING app: /app/staging.html requires an admin credential.
   Browsers can't set arbitrary request headers on a navigation, so the admin
   "Launch staging" button sets a `bb_staging` cookie (sent as the Cookie request
   header) before opening the page; we also accept an `x-admin-key` header (for fetch)
   and a `?k=` query param. The credential is a short-lived signed token (S3); the raw
   ADMIN_KEY still works as a server-side fallback. If neither a TOKEN_SECRET nor an
   ADMIN_KEY is configured, staging is left open so nobody gets locked out. */

import { isAdminAuthorized } from './_lib/auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/app/staging.html' || path === '/app/staging') {
    const secret = env.TOKEN_SECRET || env.ADMIN_KEY;
    if (secret) {
      const hdr = request.headers.get('x-admin-key');
      const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)bb_staging=([^;]+)/);
      const cookieKey = m ? decodeURIComponent(m[1]) : null;
      const provided = hdr || cookieKey || url.searchParams.get('k');
      if (!(await isAdminAuthorized(request, env, provided))) {
        return new Response('Staging is restricted — open it from the admin panel.', {
          status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
  }

  return next();
}
