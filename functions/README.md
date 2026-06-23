# Pages Functions — accounts, payments, storage tiers (scaffold)

> **Status: scaffold only.** None of this is wired into the app yet. These
> files exist so the architecture is in place before accounts/payments are
> built. The app today is 100% local (IndexedDB) and ships no account UI.

Cloudflare Pages serves everything under `/functions/*` as edge functions
(Workers). They're the thin server layer the app will use for the things that
*can't* be client-side: authentication, billing entitlements, and (for the
subscription tier) cloud-hosted storage.

## Storage tiers

| Tier    | How it's bought          | Where trade data lives         | Status   |
|---------|--------------------------|--------------------------------|----------|
| `local` | one-time payment         | IndexedDB (this browser only)  | shipped  |
| `cloud` | recurring subscription   | IndexedDB **+** server storage | planned  |

The client never branches on the tier when reading/writing data — it goes
through `Store` (`app/store.js`). A future `CloudStore` implementing the same
interface gets selected by `Entitlements.storeFor()` (`app/entitlements.js`),
so adding the cloud tier does not touch the rest of the app.

## Account provisioning flow (planned, à la gwtrade.app)

1. User pays on a Stripe Checkout / Payment Link.
2. Stripe fires a webhook to `POST /api/webhook`.
3. The webhook verifies the signature and provisions the account + entitlement
   (one-time -> `local`, subscription -> `cloud`), persisted in **D1** or **KV**.
4. The app calls `GET /api/me` to learn the signed-in user's tier and picks the
   matching `Store` implementation.

## Endpoints (stubs)

- `functions/api/checkout.js` — create a Stripe Checkout session. **Stub.**
- `functions/api/webhook.js`  — receive + verify Stripe webhooks, provision
  accounts/entitlements. **Stub.**
- `functions/api/me.js`       — return the current user's tier. **Stub** that
  returns `{ tier: "local" }` so `Entitlements.current()` has something to call.

## Environment variables (set in the Pages dashboard when implementing)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ONE_TIME`, `STRIPE_PRICE_SUBSCRIPTION`

## Bindings to add when implementing

- **D1** (`DB`) or **KV** (`ACCOUNTS`) for accounts + entitlements.
- **R2** for the subscription tier's stored trade blobs (optionally encrypted
  client-side to preserve the "your data stays yours" guarantee).
