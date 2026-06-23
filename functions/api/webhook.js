/**
 * POST /api/webhook — receive Stripe webhooks and provision accounts.
 *
 * SCAFFOLD: not implemented. Sketch of the intended flow:
 *
 *   export async function onRequestPost({ request, env }) {
 *     const sig = request.headers.get('stripe-signature');
 *     const body = await request.text();
 *     // verify `sig` against env.STRIPE_WEBHOOK_SECRET (HMAC-SHA256 via WebCrypto)
 *     // on checkout.session.completed:
 *     //   - one-time   -> entitlement "local"
 *     //   - subscription -> entitlement "cloud"
 *     //   persist { email, tier } in D1/KV so /api/me can read it back.
 *   }
 *
 * Needs env: STRIPE_WEBHOOK_SECRET (+ a D1 or KV binding for accounts).
 */
export function onRequestPost() {
  return new Response(
    JSON.stringify({ error: 'not_implemented', message: 'Webhook handler is not wired up yet.' }),
    { status: 501, headers: { 'content-type': 'application/json' } }
  );
}
