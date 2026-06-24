/* Cloudflare Pages Function — GET /api/geo
   Returns the visitor's coarse location from Cloudflare's edge metadata
   (request.cf) so the app can pre-select the US state for the tax estimate.
   No IP, no third-party service, nothing stored — just the country/region
   Cloudflare already resolved at the edge. Privacy-preserving and convenience
   only; the user can always change the selection. */

export async function onRequest(context) {
  const cf = (context.request && context.request.cf) || {};
  const body = JSON.stringify({
    country: cf.country || null,        // "US"
    region: cf.region || null,          // "Texas"
    regionCode: cf.regionCode || null   // "TX"
  });
  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
