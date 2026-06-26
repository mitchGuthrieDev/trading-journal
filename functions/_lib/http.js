/* Shared HTTP helper for Pages Functions — one consistent JSON response shape.
   Defaults to `no-store` (API responses are dynamic/uncacheable); pass extra
   headers to override (e.g. an endpoint that wants its own Cache-Control).
   Exports only a helper (no onRequest), so it is never served as a route. */

export function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}
