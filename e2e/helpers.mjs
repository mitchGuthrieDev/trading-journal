// Shared e2e helper: collect real JS errors (uncaught exceptions + console.error),
// ignoring the expected /api/* 404s on a static local server (the app fails those soft:
// loadFlags falls back to defaults, geo no-ops, the status pill goes neutral).
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|status of 40|net::ERR/.test(t)) return;
    errors.push('console.error: ' + t);
  });
  return errors;
}
