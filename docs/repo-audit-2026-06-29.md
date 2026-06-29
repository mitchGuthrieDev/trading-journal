# Repo audit — 2026-06-29 (R1, second full pass)

Recurring full-repo audit (backlog **R1**), read-only, accounting for the current
architecture after the Svelte/TypeScript reorg (ADR-001; A26 Vite, A30 `src/{lib,app,site}`,
A33 SPA cutover, A61 native TS, A69 site SSG, A78 TS functions). Four dimensions were
audited in parallel — **architecture & duplication**, **Svelte 5 / TS code quality**,
**security posture**, **build / CI / tooling / correctness**. Findings were then
adversarially verified against the source before filing; two high-severity claims did not
survive verification (below). New follow-ups are filed as **A98–A103**.

## Headline

The repo is in **strong shape**. Three of the four dimensions came back essentially clean:

- **Architecture & duplication — clean.** The pure-logic core (`src/lib/*`) is single-sourced
  and reused verbatim (A29); no re-implementations of `compute`/`costModel`/`sessionOf`/
  `isoWeek`/formatters were found. The `Store` seam (`context('bb:store')`) is enforced
  everywhere — no component touches IndexedDB/localStorage directly. `DemoStore` matches the
  full `StoreLike` interface (no signature drift). No live references to the deleted vanilla
  layer / retired build scripts. ADR-001 adoption is complete.
- **Security — clean (the product moat holds).** No trade-data egress: every client `fetch`
  is same-origin (`/data/*.json`, `/api/*`), and the `/api/*` endpoints never receive trade
  data. CSP is tight (`style-src 'self'`, `script-src 'self'`; no inline styles/scripts; dynamic
  styles via the CSSOM `styleProps` action). No `innerHTML`/`{@html}`; imports/screenshots are
  sanitized at the boundary (`SHOT_RE`, `importAll`). The Functions layer verifies Access JWTs,
  Stripe webhook signatures, and admin tokens (HMAC, constant-time, fail-closed). Deps are
  pinned + lockfile committed (A28).
- **Svelte 5 / TS quality — clean.** Runes-only throughout (no `export let` / `$:` /
  `createEventDispatcher` / store writables); `src/` is `any`-free; `tsc` + `svelte-check` pass.
  Findings here were refinements, not bugs.

The one dimension with a **genuinely actionable P2** is test coverage (build/correctness).

## Prioritized findings (filed)

| Sev | Finding | Filed |
| --- | --- | --- |
| **P2** | The two primary end-user deliverables — the performance curve (`curveseries.ts` `dailySeries()`) and the export report (`report.ts` `buildReport()`) — have **no node unit-test coverage**; only e2e proves they render, not that the math is right. Also: `costModel()` with `qty>1` and the `isoWeek` 52/53 boundary are untested. | **A98** |
| P3 | Deploy-contract lockstep (`_redirects`/`sitemap`/canonicals ↔ `dist/`) and `bump-version` path classification have no CI guard — a renamed served file or a new `src/` dir could drift silently. | **A99** |
| P3 | `App.svelte` reads `collapsedPanels`/`hiddenPanels`/workspace templates from `Store.local` with unchecked casts (only `panelOrder` has a `sanitizeOrder` guard) — corrupt localStorage could poison panel state. | **A100** |
| P3 | `JournalEditor` load `$effect` can let a slow `getJournal` for a previous day clobber the newly-selected day's fields (stale-async race). | **A101** |
| P3 | Readability sweep: drop type-restating JSDoc on `Props`; name the inline snippet/chart types (`StatCardModal`, `EquityCurve`); annotate `isoWeek` `Math.round`, `DemoStore.importAll` no-op, and `entitlements.ts` status. | **A102** |
| P3 | Only the TradingView adapter is verified; the other 9 are beta — validate each against a real export and drop the flag per adapter. | **A103** |

Findings about **`App.svelte` size / extracting workspace + filter-view logic into a
`.svelte.ts` rune module** and **prop-drilling depth** fold into the existing **A80** (deeper
Svelte 5 runes adoption) rather than duplicating it.

## Claims rejected on verification

Adversarial re-check of the higher-severity claims turned up two false positives — recorded
so a later pass doesn't re-file them:

- **"P1: fragile path concat in `bump-version.mjs`."** `root = fileURLToPath(new URL('..',
  import.meta.url))` always carries a trailing slash, so `root + 'static/data/versions.json'`
  is correct and stable — not a silent-failure risk. Downgraded to a one-line tidy folded into
  A99 (use `path.join`), not a standalone item.
- **"P2: timezone bug in `dowBuckets()`/`sessionOf()`."** `dowBuckets` keys off `t.date` (the
  date string the adapter already fixed at parse time), never the time-of-day, so the weekday is
  identical for every viewer regardless of their timezone — the proposed "23:30 PT vs ET"
  failure can't occur. Reading timestamps as written, US/ET assumed, is the **documented,
  intended** behavior (CLAUDE.md; the "US dates & Eastern time assumed" caveat). No bug.

Also declined as low-value / against guardrails: SRI on stylesheets (all same-origin,
Vite-hash-busted), `vite-ssg` "stale cache" (rendering is synchronous in `buildStart`, before
any `transformIndexHtml`), replacing `check-bundle-size.mjs`'s regex with an HTML parser
(Vite's emitted markup is stable and a new parser dep would fight A28), and an ESLint
file-count assertion (no real `.eslintignore`-bypass risk).

## Method

Parallel read-only agents per dimension → consolidate/dedupe → verify high-severity claims
against source → file. No code was changed by the audit itself (R1 is read-only); the only
edits are the new backlog items and this report. **R1 stays open** — it's a recurring driver;
each pass ships its output as new items.
