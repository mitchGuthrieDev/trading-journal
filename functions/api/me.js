/**
 * GET /api/me — return the current user's storage tier.
 *
 * SCAFFOLD: there are no accounts yet, so this always reports the free/local
 * tier. When auth lands, resolve the session (cookie/JWT) and look up the
 * entitlement provisioned by the Stripe webhook (D1/KV), returning
 * { tier: "local" | "cloud", ... }.
 */
export function onRequestGet() {
  return new Response(
    JSON.stringify({ tier: 'local', cloudSync: false }),
    { headers: { 'content-type': 'application/json' } }
  );
}
