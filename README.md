# Trading Journal

A single-file, dependency-free trading journal and cost dashboard for futures traders. It
reads a balance-history CSV exported from TradingView (or a compatible platform), parses it
entirely in the browser, and renders performance, calendar, cost, and statistics views. No
server, no build step, no data ever leaves the page.

## Quick start

1. Open `index.html` in any modern browser.
2. In TradingView, export your account balance history as CSV.
3. Click **Load CSV** and select the file.

The expected columns are `Time`, `Realized PnL (value)`, and `Action`. The parser is
quote-aware, so the commas inside the `Action` field do not break it.

## Features

- **Headline cards** — Net PnL (with after-tax take-home), win rate, commission-adjusted
  profit factor, average win/loss ratio, and realized max drawdown.
- **Performance curve** — cumulative realized PnL by trade sequence, with a shaded drawdown
  band from the running equity peak.
- **Trading calendar** — daily PnL colored by result, with weekly summaries down the left
  column and month-to-month navigation.
- **Break-even and cost budget** — a per-symbol commission table, subscription costs, an
  estimated Section 1256 tax, and the resulting take-home and break-even per trade.
- **Advanced statistics** — daily averages, best and worst trades, Sharpe (daily), recovery
  factor, streaks, and account date span.
- **Definitions and caveats** — documents exactly how every number is computed and where the
  source data falls short.

### Scope toggle

A toggle at the top switches the cards, performance curve, cost budget, and statistics
between **All time** and the **Selected month** shown on the calendar. The calendar itself
always displays the navigated month regardless of the toggle.

### Collapsible, reorderable sections

Every section can be collapsed by clicking its header and dragged into a new order using the
grip handle on the left of the header. The chosen order and collapse state are saved to the
browser's local storage and restored on the next visit.

## Commissions

Commissions are computed per traded symbol rather than from a single flat input. For each
trade, the futures root ticker is parsed from the `Action` text (for example `MESM2025` maps
to `MES`) and matched against a built-in table of AMP all-in flat-rate commissions for the
CQG data feed on the TradingView platform. The Break-even panel shows a table of every traded
symbol with its trade count, per-side rate, per-round-turn rate, and total commission.

Each CSV row is treated as one round turn (entry plus exit, one contract), so the round-turn
commission — twice the per-side rate — is charged once per row.

### Updating the rate table

AMP revises its schedule periodically. The rates live in the `AMP_RATES` object near the top
of the script in `index.html`, keyed by root ticker with the per-side cost in US dollars. Any
symbol not found in the table is charged a configurable fallback (`AMP_FALLBACK`) and flagged
with an asterisk in the commission table. Edit those values to refresh the figures; no other
changes are required.

The bundled snapshot was taken from AMP's published "Exact Cost" futures price quote in
June 2026. These are estimates of the broker's all-in flat rate and should be verified against
your own account before relying on them.

## Subscriptions

Platform and data-feed fees are charged as a full month for every distinct calendar month
present in the active scope. They are not prorated by day: one month of trades is charged one
month of fees, three months is charged three. The data-feed list mirrors AMP's published CQG
schedule and the platform fee is a free-text input.

## Tax estimate

Take-home is Net PnL after an estimated Section 1256 tax. The blended rate is 60 percent at an
assumed 15 percent long-term rate plus 40 percent at an assumed 24 percent ordinary rate, plus
the selected state's top marginal rate applied to the full gain. Tax applies only when net
profit is positive. This is a rough planning estimate, not tax advice.

## Known limitations

- **Drawdown is realized only.** It is computed from the closed-trade equity curve and does
  not capture open-position heat between entry and exit.
- **No trade length.** The balance export contains close timestamps only, not entries, so
  holding time cannot be derived and is not shown.
- **Commissions are modeled.** The export carries no fees, so raw PnL is gross and commissions
  are overlaid from the rate table.
- **Calendar-day grouping.** Days are grouped by the literal date in the `Time` column, not by
  the CME session day, so overnight trades may land on a different day than your session view.
- **Sharpe is illustrative.** It uses daily PnL with population standard deviation and is not
  annualized, so it is near-meaningless over a small number of days.

## Privacy

All parsing and computation happen locally in your browser. The only external resource the
page loads is the optional PayPal donate button in the footer.

## License

No license specified. All rights reserved by the author unless stated otherwise.
