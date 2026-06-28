<script>
  // Advanced statistics — the deeper compute() metrics not shown in the Overview, presented as
  // label/value rows (A29: pure presentation of the existing metrics object). DOW_LABEL/usd/cls
  // are imported verbatim from the core.
  import { usd, cls, DOW_LABEL } from '../../core.js';

  let { metrics } = $props();

  const ratio = v => (v === Infinity ? '∞' : Number.isFinite(v) ? v.toFixed(2) : '—');
  const num = v => (Number.isFinite(v) ? v.toFixed(2) : '—');
  const dow = d => (d ? `${DOW_LABEL[d.i]} · ${usd(d.avg)}/trade` : '—');

  const rows = $derived(build(metrics));

  function build(m) {
    if (!m) return [];
    return [
      { k: 'Payoff ratio (avg win / avg loss)', v: ratio(m.wl) },
      { k: 'Average win', v: usd(m.avgW), tone: 'pos' },
      { k: 'Average loss', v: usd(m.avgL), tone: 'neg' },
      { k: 'Expectancy / trade', v: usd(m.expectancy), tone: cls(m.expectancy) },
      { k: 'Per-trade std dev', v: usd(m.tStd, false) },
      { k: 'Sortino (daily)', v: num(m.sortino) },
      { k: 'Recovery factor (net / max DD)', v: ratio(m.recovery) },
      { k: 'Profit concentration (top 5)', v: m.concPct == null ? '—' : m.concPct.toFixed(0) + '%' },
      { k: 'Max consecutive wins', v: String(m.mcw) },
      { k: 'Max consecutive losses', v: String(m.mcl) },
      { k: 'Largest winning streak', v: usd(m.maxWinStk), tone: 'pos' },
      { k: 'Largest losing streak', v: usd(m.maxLossStk), tone: 'neg' },
      { k: 'Best weekday', v: dow(m.bestDow), tone: 'pos' },
      { k: 'Worst weekday', v: dow(m.worstDow), tone: 'neg' },
      { k: 'Long P&L', v: `${usd(m.long.pnl)} · ${m.long.n} trades`, tone: cls(m.long.pnl) },
      { k: 'Short P&L', v: `${usd(m.short.pnl)} · ${m.short.n} trades`, tone: cls(m.short.pnl) },
      { k: 'Gross profit', v: usd(m.gp), tone: 'pos' },
      { k: 'Gross loss', v: usd(m.gl), tone: 'neg' },
      { k: 'Avg trades / day', v: num(m.avgTrades) },
    ];
  }
</script>

<section class="panel advstats">
  <div class="phead"><h2>Advanced Statistics</h2></div>
  <div class="rows">
    {#each rows as r (r.k)}
      <div class="row">
        <span class="k">{r.k}</span>
        <span class="v" class:pos={r.tone === 'pos'} class:neg={r.tone === 'neg'}>{r.v}</span>
      </div>
    {/each}
  </div>
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
  .rows {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 2px 24px;
  }
  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
  }
  .k {
    font-size: 12px;
    color: var(--dim);
  }
  .v {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--txt);
    white-space: nowrap;
  }
  .v.pos {
    color: var(--green);
  }
  .v.neg {
    color: var(--red);
  }
</style>
