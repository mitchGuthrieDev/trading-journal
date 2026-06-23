<p align="center">
  <img src="assets/banner.svg" alt="Blotterbook — private futures journal and cost dashboard" width="100%">
</p>

<p align="center">
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-none-3fb950?style=flat-square&labelColor=151a21">
  <img alt="Runs in browser" src="https://img.shields.io/badge/compute-browser%20only-d6dde6?style=flat-square&labelColor=151a21">
  <img alt="Local storage" src="https://img.shields.io/badge/storage-IndexedDB%20(local)-6aa0ff?style=flat-square&labelColor=151a21">
  <img alt="Hosting" src="https://img.shields.io/badge/hosting-Cloudflare%20Pages-e3b341?style=flat-square&labelColor=151a21">
  <img alt="Privacy" src="https://img.shields.io/badge/data-never%20leaves%20your%20browser-c98bff?style=flat-square&labelColor=151a21">
</p>

---

**Blotterbook** is a **dependency-free** trading journal and cost dashboard for futures traders. It
reads a balance-history CSV exported from **TradingView**, parses it entirely in the browser, stores
it **locally** (IndexedDB), and renders performance, calendar, cost, filter, and statistics views.
All computation is client-side and **no trade data ever leaves the browser**. The only network
calls are loading the app's own reference-data JSON and an optional PayPal donate button.

> **Design pillars (intentional constraints):** compute happens locally, there are **no runtime
> dependencies**, and the whole thing deploys as static files to **Cloudflare Pages**. The app
> *is* split across files (it used to be one `index.html`), so it must be **served over http(s)** —
> opening it from disk will block the `fetch()` of the reference data.

## Table of contents

- [Project layout](#project-layout)
- [Marketing homepage](#marketing-homepage) — the one-page site at `/`
- [Quick start](#quick-start)
- [Input: the CSV](#input-the-csv) — and how re-uploads merge
- [UI walkthrough](#ui-walkthrough)
- [Cost model](#cost-model) — commissions, subscriptions, tax
- [Reference data (JSON)](#reference-data-json) — brokers, fees, feeds, states + cache-busting
- [Local persistence](#local-persistence) — IndexedDB, delta merge, purge
- [Managing local data](#managing-local-data) — edit, back up, and restore
- [Filters & journal](#filters--journal)
- [Architecture](#architecture)
- [Storage tiers & payments (scaffold)](#storage-tiers--payments-scaffold)
- [Known limitations](#known-limitations)
- [Privacy](#privacy)
- [Development & deployment](#development--deployment)
- [License](#license)

## Project layout

```
/                       one-page marketing homepage (index.html) → links to /app
  index.html            hero + features + use cases + pricing + FAQ (single scroll, anchor nav)
  changelog.html        "Blotterlog" — change history styled to match the homepage
/app/                   the journal app
  index.html            app markup (links app.css + app.js)
  demo.html             the demo on its own page (shares app.css/app.js; opens in a new tab)
  app.css               all app styles (shared by index.html and demo.html)
  app.js                the main app script (shared; mode-aware via body[data-mode])
  store.js              IndexedDB persistence (swappable storage interface)
  entitlements.js       storage-tier resolver (scaffold; always "local" today)
/data/                  reference data, fetched at runtime
  brokers.json          broker commission tiers
  exchange-fees.json    CME exchange/clearing/NFA fees + micro set
  feeds.json            per-broker market-data feed options
  state-tax.json        Section 1256 model + per-state top rates
  manifest.json         content hashes for cache-busting (generated)
/functions/             Cloudflare Pages Functions (Stripe/accounts scaffold)
  api/{me,checkout,webhook}.js
  README.md             accounts/payments/storage-tier plan
/scripts/
  build-manifest.mjs    regenerates data/manifest.json (Node built-ins only)
/assets/banner.svg
```

## Marketing homepage

The site root (`index.html`) is a **single-page, scrollable marketing site** for Blotterbook,
styled with the same dark palette and tokens as the app. A minimalist sticky header carries
anchor links that smooth-scroll to each full-height section:

| Section | Purpose |
| --- | --- |
| **Home** | The hero (banner, tagline, CTAs) plus a **Live** status pill that pings `/app/` and reports whether the app is responding. |
| **Features** | A three-column grid of the app's capabilities (privacy, cost model, tax, broker comparison, curve/calendar, stats). |
| **Use Cases** | The pitch — Blotterbook as both a profit/budgeting calculator and a private journal (broker comparison, tax planning, break-even, review). |
| **Pricing** | Donation-based today (stylized PayPal donate button), with the planned **$20 one-time local** and **$5/mo online** tiers shown greyed-out and a founders blurb: donate now → lifetime access to both. |
| **FAQ** | Expandable (collapsed-by-default) questions covering supported data, cost/tax modeling, and limitations — a friendlier take on this README. |

`changelog.html` ("**Blotterlog**") is a standalone, matching-styled page linked from the header
and footer; it presents the project's commit history as a timeline. Both pages are static and have
no build step or runtime dependencies (the donate button is the only external resource).

## Quick start

1. Serve the folder over http (see [Development](#development--deployment)) and open `/app/`.
   The homepage at `/` links to it.
2. In **Setup**, choose your **Broker**, **Data feed**, and **State**, and set the monthly
   **Platform fee**. (Load CSV is disabled until broker, feed, and state are all chosen.)
3. In TradingView, export your account balance history as CSV.
4. Click **Load CSV** and select the file. Your data is saved locally — it's restored
   automatically next time you open the app.

Prefer to look around first? Click **Demo** for a generated sample dataset (not saved). Use
**Clear data** in the top bar to erase everything stored in your browser.

## Input: the CSV

The parser expects a TradingView balance-history export. Required columns (matched
case-insensitively by substring): **`Time`**, **`Realized PnL (value)`** (falls back to
`Realized PnL`), and **`Action`**. The parser is quote-aware because `Action` contains commas
inside quotes.

Each CSV **row is one trade** — a position-*close* event with its own realized PnL. The
instrument is parsed from the `Action` text (`... for symbol MESM2025 at price ...`) and reduced
to a **root ticker** (`MESM2025` → `MES`, `MES1!` → `MES`, `M2KZ2025` → `M2K`).

```
Time,Action,Realized PnL (value)
2026-06-02 10:00:00,"Close long position for symbol MESM2025 at price 5300.00",75.00
```

**Re-uploads merge.** Each trade gets a stable id from its `time + symbol + side + pnl`. Uploading
a CSV that overlaps a previous one only inserts the genuinely new rows, so you can export a wider
window each time without creating duplicates. The data summary shows `+N new · M dup`.

## UI walkthrough

| Section | What it shows |
| --- | --- |
| **Top bar** | The **Blotterbook** wordmark (links to the homepage) and the loaded-source text (click it to load a CSV, like the Load CSV button — it's truncated so long filenames don't bloat the bar). Actions: Load CSV, Demo (opens the demo in a new tab), **Export report**, **Manage data**, Clear data, Contact. |
| **Landing (no data)** | The intro text sits at the top; the **Broker & Costs** module is centered in the page (like the homepage hero) until data loads. |
| **Broker & Costs** | Broker / data feed / platform fee / state. Collapsible once loaded; selections persist. |
| **Scope toggle** | Switches most views between *All time* and the *Selected month*. |
| **Filters** | Date range, symbol, side, session (RTH/ETH), and day-of-week. Applies before everything. |
| **Stat cards** | Net PnL (+ take-home), win rate, profit factor, avg win/loss, max drawdown. |
| **Performance** | Cumulative PnL vs. date. Click the **Gross / Net / Take-home** buttons to toggle overlays (highlighted when active); hover for values; click a calendar day to mark it. |
| **Trading Calendar** | Sunday-first month grid of daily PnL with weekly summaries; **day-notes** below. |
| **Break-even & Cost Budget** | Per-symbol commission table and a full-width itemized waterfall — gross, commissions, subscriptions, net pre-tax, the folded-in **Section 1256** tax detail, take-home, and break-even/trade. |
| **Advanced Statistics** | Daily averages, expectancy, long/short split, best/worst day & weekday, Sharpe, streaks. |
| **Definitions & Caveats** | How each number is computed and where the data falls short. |

**Demo (its own page).** The **Demo** button opens `app/demo.html` in a new tab with a generated,
profitable month of sample data. It's the full app minus the Load CSV, Manage data, and Clear data
controls; an **End demo** button returns you to the app (and closes the tab when the browser allows).
Demo data is in-memory only and never persists.

**Export report.** **Export report** opens a condensed, print-ready **performance report** in a new
tab — period summary tiles, a cost &amp; tax breakdown, key statistics, and per-symbol commissions,
in the Blotterbook palette — then prompts to print or save as PDF. It reads like a report rather than
a screenshot of the dashboard. (Allow pop-ups for the report tab.)

**Manage data.** **Manage data** opens a local-data manager (see
[Managing local data](#managing-local-data)).

## Cost model

Costs are applied to whatever scope **and filters** are active.

**Commissions (per symbol, broker-aware):**

```
all-in per side = broker commission (micro|standard tier) + CME exchange/clearing/NFA fee
round-turn per trade = 2 × all-in per side          (one entry + one exit, 1 contract)
```

The broker commission comes from `brokers.json`; the exchange fee from `exchange-fees.json`. A
symbol's tier (micro vs. standard) is from that file's `micro` list, falling back to a heuristic
(`M`-prefixed roots are treated as micros). Unknown symbols use a fallback and are flagged `*`.

**Subscriptions (not prorated):** `platform fee + data-feed fee` is charged as a **full month for
every distinct calendar month** present in the active scope — never prorated by day.

**Tax (Section 1256, estimated):**

```
blended rate = ltcgWeight × ltcg + ordinaryWeight × fedOrdinary + state top marginal rate
            = 0.60 × 15%  + 0.40 × 24% + state rate            (defaults, from state-tax.json)
```

Applied to net pre-tax profit **only when positive**. A rough planning estimate, not tax advice.

**Break-even per trade:** `(total commissions + subscriptions) ÷ trade count`.

## Reference data (JSON)

The broker/fee/feed/state tables used to be inline constants; they now live in `/data/*.json` and
are fetched at runtime by `loadRefData()` before anything renders. Edit a JSON file to change
rates — no app code changes. Brokers modeled: **AMP, EdgeClear, Tradovate / NinjaTrader, Optimus,
Charles Schwab (thinkorswim), Interactive Brokers, TradeStation.**

| File | Contents |
| --- | --- |
| `brokers.json` | `order` + `brokers` (per-side commission for `micro`/`std`). |
| `exchange-fees.json` | `exchange` (fee per root), `micro` set, and a `fallback`. |
| `feeds.json` | `shared` feed sets + `brokerFeeds` (a broker may alias a shared set by name, e.g. `"AMP": "CQG"`). |
| `state-tax.json` | `model` (`fedOrdinary`, `ltcg`, weights) + `states` (`[abbr, ratePct, label]`). |

### `schemaVersion` + content-hash cache-busting

Every data file carries a **`schemaVersion`** field, and `scripts/build-manifest.mjs` writes
`data/manifest.json` mapping each file to a short SHA-256 **content hash**. At boot the app fetches
`manifest.json` with `no-cache`, then requests each data file as `brokers.json?v=<hash>`.

**What this buys us:**

- **Aggressive caching with instant updates.** Because the URL only changes when the file's bytes
  change, the data files can be cached forever by the browser and Cloudflare's edge — yet an edit
  takes effect immediately (new bytes → new hash → new URL → cache miss). No more "users stuck on
  stale rates" and no cache-clearing rituals.
- **`schemaVersion` is the contract.** The hash answers *"did these bytes change?"*; the version
  answers *"did the **shape** change?"*. If a file's structure ever changes incompatibly, bump its
  `schemaVersion` and the app can detect a too-new/too-old file and refuse to misread it — instead
  of silently mispricing trades. It also keeps these app-facing data files cleanly versioned
  independently of any future cloud API.

**After editing any data file, run:** `node scripts/build-manifest.mjs` (also a good Cloudflare
Pages build command).

## Local persistence

Trade data and day-notes are stored in **IndexedDB** via `app/store.js`, so your data is restored
automatically on return visits. Nothing is uploaded.

- **Stores:** `trades` (keyed by the dedupe id), `journal` (keyed by date), `meta` (setup
  selections).
- **Delta merge:** `Store.addTrades()` skips ids already present, so re-imports only add new trades.
- **Demo data is never persisted** — it lives in memory only.
- **Clear data** (top bar) calls `Store.purge()` to wipe all three stores after a confirm.

The app never touches `indexedDB` directly — it goes through the `Store` interface. A future cloud
backend implements the same interface, so adding cloud sync won't touch the rest of the app. See
[storage tiers](#storage-tiers--payments-scaffold).

## Managing local data

**Manage data** (top bar) opens a modal for editing and managing everything saved in this browser —
the recommended home for local-data control because it reuses the existing `Store` interface and
keeps all destructive actions behind one clearly-labeled surface. It has four parts:

- **Overview** — trade count, date range, day-note count, and the approximate on-disk size.
- **Backup &amp; restore** — *Download backup (.json)* writes a single file with your trades, day-notes,
  and setup (`Store.exportAll()`); *Restore from backup* merges one back in (`Store.importAll()`).
  Restores de-duplicate by the same stable trade id, so re-importing is always safe. This is the
  answer to "local storage is per-browser" — a portable snapshot you control.
- **Day notes** — every dated note, each with a delete button.
- **Trades** — a searchable (symbol / date / side), scrollable table with per-row delete. Deletions
  apply immediately across every view and recompute metrics live.
- **Danger zone** — *Erase all local data* (`Store.purge()`), behind a confirm.

The `Store` interface stays the single source of truth — the manager added `deleteTrade`,
`getAllJournal`, `deleteJournal`, `getAllMeta`, `exportAll`, and `importAll` to it, so a future cloud
backend gets the same management UI for free.

## Filters & journal

**Filters** (apply before scope, cards, graph, calendar, cost, and stats):

- **Date range**, **Symbol** (root), **Side** (long/short).
- **Session** — RTH (09:30–16:00) vs. ETH, by the timestamp's clock time as exported.
- **Day of week** — toggle any subset of S M T W T F S.
- A live `N / M trades` count and a **Reset filters** button.

**Day-notes / journal:** click any calendar day to open a notes editor for that date. Notes
auto-save to IndexedDB; days with a note get a small dot on the calendar. (Disabled for demo data.)

## Architecture

The data flow is linear and entirely client-side:

```
loadRefData()   manifest.json → brokers/exchange-fees/feeds/state-tax (cache-busted by hash)
CSV text
  → parseCSV()      quote-aware splitter → rows
  → toTrades()      rows → [{time,date,pnl,symbol,root,side}] (chronological)
  → Store.addTrades / getAllTrades   delta-merge + persist (IndexedDB)
  → applyFilters()  active filter set → working trade list
  → compute()       trades → metrics (PnL, win rate, drawdown, curve, days, expectancy, …)
  → costModel()     metrics + Setup inputs → commissions, subscriptions, tax, take-home
  → render*()       → cards / curve / calendar / advanced / break-even
```

The styles and script live in `app/app.css` and `app/app.js`, shared by both `index.html` and
`demo.html`; `app.js` adapts to the page via `document.body.dataset.mode` (the demo sets
`data-mode="demo"`, auto-loads sample data, and skips persistence). Key globals: `TRADES` (full
merged set), `METRICS_ALL` (metrics for the *filtered* set), `FILTERS`, `SCOPE`,
`calYear`/`calMonth`, `selectedDate`, `JOURNAL_DATES`, `DEMO_MODE`, `DEMO_PAGE`. The boot sequence
is async: `loadRefData()` → `Store.init()` → `restoreSession()` (or `runDemo()` on the demo page).

## Storage tiers & payments (scaffold)

Accounts and payments are **not implemented in the app yet** — only scaffolded so the architecture
is ready. The plan (see `functions/README.md`):

| Tier | Bought via | Storage | Status |
| --- | --- | --- | --- |
| `local` | one-time payment | IndexedDB (this browser) | shipped |
| `cloud` | subscription | IndexedDB + server | planned |

`/functions/api/{me,checkout,webhook}.js` are stubbed Cloudflare Pages Functions for Stripe
checkout, webhook-driven account provisioning, and tier lookup. `app/entitlements.js` is the
client resolver that will pick the matching `Store` implementation; today it always returns
`local`.

## Known limitations

- **Drawdown is realized only** — from the closed-trade curve; no open-position heat.
- **No trade length** — the export has close timestamps only, so holding time isn't derivable.
- **Commissions are modeled** — raw PnL is gross; rates come from the editable JSON and may drift.
- **Calendar-day & session grouping** — both use the literal `Time` value, not the CME session day;
  RTH/ETH assumes the timestamp's clock time.
- **Sharpe is illustrative** — daily PnL, population std, not annualized.
- **Local storage is per-browser** — data is not synced across devices and is cleared if you clear
  site data. Use **Manage data → Download backup** for a portable JSON snapshot in the meantime.
  (Cloud sync is the planned subscription tier.)

## Privacy

All parsing, computation, and storage happen locally in your browser; trade data is never
uploaded. The only network calls are the app's own `/data/*.json` and the optional PayPal donate
button.

## Development & deployment

No build step for the app itself. Because the app fetches `/data/*.json`, it **must be served over
http(s)** — don't open the files from disk.

```
# any static server works, e.g.
python3 -m http.server 8000      # then visit http://localhost:8000/app/
```

The repo deploys to **Cloudflare Pages** as static files; `/functions/*` are served as edge
functions automatically. Recommended Pages build command: `node scripts/build-manifest.mjs` (keeps
the cache-busting manifest fresh). The `.claude/` directory (local preview tooling) is git-ignored.

## License

No license specified. All rights reserved by the author unless stated otherwise.
