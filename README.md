# Trading Journal

A single-file, dependency-free trading journal and cost dashboard for futures traders. It
reads a balance-history CSV exported from TradingView, parses it entirely in the browser, and
renders performance, calendar, cost, and statistics views. No server, no build step, no data
ever leaves the page.

## Quick start

1. Open `index.html` in any modern browser.
2. In the Setup bar, choose your **Broker**, **Data feed**, and **State**, and set the monthly
   **Platform fee**. (Load CSV stays disabled until broker, feed, and state are chosen.)
3. In TradingView, export your account balance history as CSV.
4. Click **Load CSV** and select the file.

Prefer to look around first? Click **Demo** to load a generated sample dataset using default
selections (AMP broker, CME bundle data feed, Arkansas tax, $35 platform fee).

The expected columns are `Time`, `Realized PnL (value)`, and `Action`. The parser is
quote-aware, so the commas inside the `Action` field do not break it.

## Top bar

- **Load CSV** — loads your balance-history CSV (enabled once the Setup selections are made).
- **Demo** — loads a generated sample dataset to explore the app.
- **Export** — opens the browser print dialog so you can save or share the dashboard as a PDF.
  Print styles expand collapsed sections and hide interactive-only controls.
- **Contact** — a `mailto:` link to `contact@scalineaudio.net` for support requests or
  feedback; it opens a pre-filled draft in your email app.
- Clicking the **Trading Journal** title returns to the start page and unloads the current CSV.

## Features

- **Headline cards** — Net PnL (with after-tax take-home), win rate, commission-adjusted
  profit factor, average win/loss ratio, and realized max drawdown.
- **Performance graph** — cumulative PnL plotted against the calendar date. The X axis is
  labeled Date and spans the selected month (first to last day) or the full sample in All-time
  scope; the Y axis is labeled Cumulative PnL. Gross, Net, and Take-home series can be toggled
  on as overlays. Hovering shows a tooltip with each series value, and clicking a calendar day
  drops a marker on the graph at that date.
- **Trading calendar** — daily PnL colored by result, Sunday-first, with weekly summaries down
  the left column and month-to-month navigation. Clicking a day highlights it on the graph.
- **Break-even and cost budget** — a per-symbol commission table, subscription costs, an
  estimated Section 1256 tax, and the resulting take-home and break-even per trade.
- **Advanced statistics** — daily averages, best and worst trades, Sharpe (daily), recovery
  factor, streaks, and account date span.
- **Definitions and caveats** — documents how every number is computed and where the source
  data falls short.

### Scope toggle

A toggle at the top switches the cards, performance graph, cost budget, and statistics between
**All time** and the **Selected month** shown on the calendar. The calendar itself always
displays the navigated month regardless of the toggle.

### Collapsible, reorderable sections

Every section can be collapsed by clicking its header and dragged into a new order using the
grip handle on the left of the header. The chosen order and collapse state are saved to the
browser's local storage and restored on the next visit.

## Brokers, commissions, and data feeds

The **Broker** selector in the Setup bar drives both commission rates and the available data
feeds. Supported brokers: AMP Futures, EdgeClear, Tradovate / NinjaTrader, Optimus Futures,
Charles Schwab (thinkorswim), Interactive Brokers, and TradeStation.

Commissions are computed per traded symbol. For each trade, the futures root ticker is parsed
from the `Action` text (for example `MESM2025` maps to `MES`) and priced as:

```
all-in per side = broker commission (micro or standard tier) + CME exchange/clearing/NFA fee
```

The broker commission comes from the selected broker's schedule; the exchange/clearing/NFA fee
comes from a shared per-contract table. Each CSV row is one round turn (entry plus exit, one
contract), so the round-turn commission is twice the per-side rate, charged once per row. The
Break-even panel shows every traded symbol with its trade count, per-side rate, round-turn
rate, and total commission.

Selecting a broker repopulates the data-feed dropdown with that broker's feed options and
monthly costs.

### Updating the rate tables

All rates are editable snapshot estimates taken in mid-2026 and should be verified against your
own account. They live near the top of the script in `index.html`:

- `EXCH` — CME exchange/clearing/NFA fee per side, keyed by root ticker. Symbols not listed use
  a fallback and are flagged with an asterisk in the commission table.
- `BROKERS` — each broker's commission per side for the micro and standard tiers.
- `BROKER_FEEDS` — each broker's data-feed options and monthly costs.

Edit those structures to refresh figures or add instruments and brokers; no other changes are
required.

## Subscriptions

Platform and data-feed fees are charged as a full month for every distinct calendar month
present in the active scope. They are not prorated by day: one month of trades is charged one
month of fees, three months is charged three.

## Tax estimate

Take-home is Net PnL after an estimated Section 1256 tax. The blended rate is 60 percent at an
assumed 15 percent long-term rate plus 40 percent at an assumed 24 percent ordinary rate, plus
the selected state's top marginal rate applied to the full gain. Tax applies only when net
profit is positive. This is a rough planning estimate, not tax advice.

## Known limitations

- **Drawdown is realized only.** It is computed from the closed-trade equity curve and does not
  capture open-position heat between entry and exit.
- **No trade length.** The balance export contains close timestamps only, not entries, so
  holding time cannot be derived and is not shown.
- **Commissions are modeled.** The export carries no fees, so raw PnL is gross and commissions
  are overlaid from the broker rate model.
- **Calendar-day grouping.** Days are grouped by the literal date in the `Time` column, not by
  the CME session day, so overnight trades may land on a different day than your session view.
- **Sharpe is illustrative.** It uses daily PnL with population standard deviation and is not
  annualized, so it is near-meaningless over a small number of days.

## Privacy

All parsing and computation happen locally in your browser. The only external resource the page
loads is the optional PayPal donate button in the footer.

## License

No license specified. All rights reserved by the author unless stated otherwise.
