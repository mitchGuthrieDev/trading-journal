/**
 * POST /api/checkout — create a Stripe Checkout session.
 *
 * SCAFFOLD: not implemented. Sketch of the intended flow:
 *
 *   export async function onRequestPost({ request, env }) {
 *     const { plan } = await request.json(); // "one_time" | "subscription"
 *     const price = plan === 'subscription'
 *       ? env.STRIPE_PRICE_SUBSCRIPTION
 *       : env.STRIPE_PRICE_ONE_TIME;
 *     // call Stripe (REST via fetch — no SDK needed on Workers) to create a
 *     // Checkout Session for `price`, then return { url } to redirect to.
 *   }
 *
 * Needs env: STRIPE_SECRET_KEY, STRIPE_PRICE_ONE_TIME, STRIPE_PRICE_SUBSCRIPTION.
 */
export function onRequestPost() {
  return new Response(
    JSON.stringify({ error: 'not_implemented', message: 'Checkout is not wired up yet.' }),
    { status: 501, headers: { 'content-type': 'application/json' } }
  );
}
