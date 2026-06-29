<script lang="ts">
  // Trade Blotter (F23 — staging-only). A full-width dashboard module surfacing ALL trades in one
  // scrollable, read-only table (the Manage data → Trades list, brought onto the dashboard). It tracks
  // the active filter set/scope like every other panel (App passes the already-filtered `trades`).
  // Every column is READ-ONLY except the Note, which is inline-editable and persists through the same
  // per-trade annotation path as Manage data (Store.saveTradeMeta / trademeta) — all other editing
  // stays in the Manage data menu. Commission reuses the core `rateFor()` helper (the same round-turn
  // model costModel() uses) rather than recomputing fees. Gated to staging in App; the isDemo guard is
  // belt-and-suspenders (A87) since the module never mounts on demo.
  import { getContext } from 'svelte';
  import { usd, money, cls, rateFor, emit, PAGE_MODE } from '../../lib/core.ts';
  import type { Trade, StoredTradeMeta, StoreLike, PanelBundle } from '../../lib/types.ts';
  import Panel from './Panel.svelte';

  interface Props {
    trades?: Trade[];
    /** id → persisted per-trade metadata (tags/note/shots), so a note edit preserves the rest. */
    tradeMeta?: Map<string, StoredTradeMeta>;
    /** Selected broker key — drives the per-trade round-turn commission via rateFor(). */
    broker?: string;
    /** Whether the active filter set is narrowing the list (for the empty-state copy). */
    filtered?: boolean;
    /** Reload the dashboard's derived data after a note write (App.reloadAll). */
    onchanged?: () => void;
    panel?: PanelBundle;
  }
  let { trades = [], tradeMeta = new Map(), broker = '', filtered = false, onchanged = () => {}, panel = {} as PanelBundle }: Props = $props();

  const store = getContext('bb:store') as StoreLike;
  const isDemo = PAGE_MODE === 'demo';

  const hm = (t: Trade) => (t.time || '').slice(11, 16) || '—';
  const commOf = (t: Trade) => rateFor(broker, t.root).rate * 2 * (t.qty || 1);
  const noteOf = (t: Trade) => tradeMeta.get(store.tradeId(t))?.note || '';

  const net = $derived(trades.reduce((a, t) => a + t.pnl, 0));
  const totalComm = $derived(trades.reduce((a, t) => a + commOf(t), 0));

  // Persist an inline note edit, preserving the trade's existing tags/shots (saveTradeMeta replaces
  // the whole record). Demo never writes (A87). Fires on blur/Enter (the input's change event).
  async function saveNote(t: Trade, note: string) {
    if (isDemo) return;
    const id = store.tradeId(t);
    if ((noteOf(t) || '') === note.trim()) return; // no-op if unchanged
    const ex = tradeMeta.get(id);
    await store.saveTradeMeta(id, { tags: ex?.tags || [], note, shots: ex?.shots || [] });
    emit('trade:edited', { id });
    onchanged();
  }
</script>

<Panel {...panel} title="Trade Blotter">
  {#snippet actions()}
    {#if trades.length}
      <span class="blsum">{trades.length} trade{trades.length === 1 ? '' : 's'} · <span class={cls(net)}>{usd(net)}</span> · <span class="comm">−{money(totalComm)} comm</span></span>
    {/if}
  {/snippet}

  {#if trades.length}
    <div class="blwrap">
      <table class="bltab">
        <thead>
          <tr>
            <th>Date / time</th>
            <th>Symbol</th>
            <th>Contract</th>
            <th>Side</th>
            <th class="num">Qty</th>
            <th class="num">Commission</th>
            <th>Note</th>
            <th class="num">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {#each trades as t (store.tradeId(t))}
            <tr>
              <td class="mono dim">{t.date}<span class="time"> {hm(t)}</span></td>
              <td>{t.root || t.symbol}</td>
              <td class="dim">{t.symbol}</td>
              <td class="side">{t.side || '—'}</td>
              <td class="num mono">{t.qty || 1}</td>
              <td class="num mono dim">−{money(commOf(t))}</td>
              <td class="notecell">
                <input
                  class="note"
                  type="text"
                  value={noteOf(t)}
                  disabled={isDemo}
                  placeholder="Add a note…"
                  aria-label="Note for {t.root || t.symbol} on {t.date}"
                  onchange={e => saveNote(t, (e.currentTarget as HTMLInputElement).value)}
                />
              </td>
              <td class="num mono {cls(t.pnl)}">{usd(t.pnl)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="blnone">No trades to show{filtered ? ' with the active filters' : ''}.</p>
  {/if}
</Panel>

<style>
  .blsum {
    font-size: 12px;
    font-family: var(--mono);
    color: var(--dim);
  }
  .blsum .pos {
    color: var(--green);
  }
  .blsum .neg {
    color: var(--red);
  }
  .blsum .comm {
    color: var(--faint);
  }
  /* Scrollable, full-width list — caps the height so a large book scrolls inside the module. */
  .blwrap {
    overflow: auto;
    max-height: 460px;
  }
  .bltab {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .bltab th {
    position: sticky;
    top: 0;
    z-index: 1;
    text-align: left;
    background: var(--panel);
    color: var(--faint);
    font-weight: 600;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  .bltab th.num {
    text-align: right;
  }
  .bltab td {
    padding: 4px 8px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  .bltab td.num {
    text-align: right;
  }
  .bltab td.mono {
    font-family: var(--mono);
  }
  .bltab td.dim {
    color: var(--dim);
  }
  .time {
    color: var(--faint);
  }
  .side {
    text-transform: capitalize;
  }
  .pos {
    color: var(--green);
  }
  .neg {
    color: var(--red);
  }
  .notecell {
    width: 100%;
    min-width: 160px;
    white-space: normal;
  }
  .note {
    width: 100%;
    background: var(--panel2);
    color: var(--txt);
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 4px 6px;
    font: inherit;
    font-size: 12px;
  }
  .note:hover:not(:disabled) {
    border-color: var(--line);
  }
  .note:focus {
    outline: none;
    border-color: var(--accent);
  }
  .note:disabled {
    background: transparent;
    cursor: not-allowed;
  }
  .blnone {
    margin: 0;
    font-size: 13px;
    color: var(--dim);
  }
</style>
