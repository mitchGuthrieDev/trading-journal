<script>
  // Cumulative-equity curve, derived from compute()'s m.curve (A29: no recomputation). Core line +
  // gradient fill, plus (A32) day note-dots, a hover/keyboard cursor with an aria-live tooltip
  // (B33), and click-to-select-day which cross-links to the calendar + journal (B37). The
  // gross/net/take-home overlays are a separate sub-slice (they need the cost inputs).
  import { minMax, usd, money } from '../../core.js';

  let { metrics, journalDates = new Set(), selectedDate = null, onselect = () => {} } = $props();

  const W = 800;
  const H = 240;
  const PX = 10;
  const PY = 14;

  let cursor = $state(null); // active curve index (hover / keyboard), null when idle

  const view = $derived(build(metrics));
  // Tooltip text for the active point (aria-live announces it for keyboard users).
  const tip = $derived(view && cursor != null && view.dates[cursor] ? `${view.dates[cursor]} · ${usd(view.c[cursor])}` : '');
  const selIdx = $derived(view && selectedDate ? view.lastIdxByDate.get(selectedDate) ?? null : null);

  function build(m) {
    const c = m && m.curve ? m.curve : [];
    const trades = m && m.trades ? m.trades : [];
    if (c.length < 2) return null;
    const { lo, hi } = minMax(c);
    const span = hi - lo || 1;
    const x = i => PX + (i / (c.length - 1)) * (W - 2 * PX);
    const y = v => PY + (1 - (v - lo) / span) * (H - 2 * PY);
    const dates = c.map((_, i) => (i === 0 ? null : trades[i - 1] && trades[i - 1].date));
    const line = c.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const baseY = (H - PY).toFixed(1);
    const area = `${line} L${x(c.length - 1).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;
    // One note-dot per journaled day, placed at that day's last curve point.
    const lastIdxByDate = new Map();
    for (let i = 1; i < c.length; i++) if (dates[i]) lastIdxByDate.set(dates[i], i);
    const notes = [];
    for (const [date, i] of lastIdxByDate) if (journalDates.has(date)) notes.push({ x: x(i), y: y(c[i]), date });
    return { c, dates, line, area, x, y, lo, hi, len: c.length, up: c[c.length - 1] >= 0, zeroY: lo <= 0 && hi >= 0 ? y(0) : null, lastIdxByDate, notes };
  }

  function idxFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbx = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((vbx - PX) / (W - 2 * PX)) * (view.len - 1));
    return Math.max(1, Math.min(view.len - 1, i));
  }
  const move = e => (cursor = idxFromEvent(e));
  const pick = () => {
    if (cursor != null && view.dates[cursor]) onselect(view.dates[cursor]);
  };
  function onkeydown(e) {
    if (!view) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const base = cursor == null ? view.len - 1 : cursor;
      cursor = Math.max(1, Math.min(view.len - 1, base + (e.key === 'ArrowRight' ? 1 : -1)));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick();
    }
  }
</script>

<section class="panel">
  <div class="phead">
    <h2>Performance</h2>
    {#if metrics}<span class="net" class:neg={metrics.net < 0}>{usd(metrics.net)}</span>{/if}
  </div>

  {#if view}
    <svg
      class="equity"
      class:neg={!view.up}
      viewBox="0 0 {W} {H}"
      preserveAspectRatio="none"
      role="img"
      aria-label="Cumulative equity curve — use arrow keys to inspect days, Enter to select"
      tabindex="0"
      onpointermove={move}
      onpointerleave={() => (cursor = null)}
      onclick={pick}
      {onkeydown}
    >
      <defs>
        <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
          <stop class="g0" offset="0%" />
          <stop class="g1" offset="100%" />
        </linearGradient>
      </defs>
      <path class="fill" d={view.area} fill="url(#eqfill)" />
      {#if view.zeroY != null}<line class="zero" x1={PX} y1={view.zeroY} x2={W - PX} y2={view.zeroY} vector-effect="non-scaling-stroke" />{/if}
      <path class="line" d={view.line} fill="none" vector-effect="non-scaling-stroke" />
      {#if selIdx != null}
        <line class="sel" x1={view.x(selIdx)} y1={PY} x2={view.x(selIdx)} y2={H - PY} vector-effect="non-scaling-stroke" />
      {/if}
      {#each view.notes as nd (nd.date)}
        <circle class="notedot" cx={nd.x} cy={nd.y} r="3" vector-effect="non-scaling-stroke" />
      {/each}
      {#if cursor != null}
        <line class="cursor" x1={view.x(cursor)} y1={PY} x2={view.x(cursor)} y2={H - PY} vector-effect="non-scaling-stroke" />
        <circle class="dot" cx={view.x(cursor)} cy={view.y(view.c[cursor])} r="3.5" vector-effect="non-scaling-stroke" />
      {/if}
    </svg>
    <div class="axis">
      <span>{money(view.lo)}</span>
      <span class="tip" aria-live="polite">{tip || 'cumulative P&L'}</span>
      <span>{money(view.hi)}</span>
    </div>
  {:else}
    <p class="empty">Not enough trades to plot a curve.</p>
  {/if}
</section>

<style>
  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px 12px;
    margin-top: 16px;
  }
  .phead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--faint);
    font-weight: 700;
  }
  .net {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 700;
    color: var(--green);
  }
  .net.neg {
    color: var(--red);
  }
  .equity {
    width: 100%;
    height: 240px;
    display: block;
    cursor: crosshair;
  }
  .equity:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .line {
    stroke: var(--green);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .equity.neg .line {
    stroke: var(--red);
  }
  .g0 {
    stop-color: var(--green);
    stop-opacity: 0.28;
  }
  .g1 {
    stop-color: var(--green);
    stop-opacity: 0;
  }
  .equity.neg .g0 {
    stop-color: var(--red);
  }
  .equity.neg .g1 {
    stop-color: var(--red);
  }
  .zero {
    stroke: var(--line);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .sel {
    stroke: var(--accent);
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
  }
  .cursor {
    stroke: var(--dim);
    stroke-width: 1;
  }
  .dot {
    fill: var(--txt);
  }
  .notedot {
    fill: var(--accent);
    stroke: var(--bg);
    stroke-width: 1.5;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--faint);
    margin-top: 4px;
  }
  .axis .tip {
    color: var(--dim);
    text-align: center;
  }
  .empty {
    color: var(--dim);
    padding: 24px 4px;
  }
</style>
