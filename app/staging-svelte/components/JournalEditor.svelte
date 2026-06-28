<script>
  // Day-note editor (A27). Persists per-day notes through the Store seam (getJournal/saveJournal —
  // A29, reused verbatim). The store comes from context (A31): real Store on app/staging, in-memory
  // DemoStore on demo. Loads the existing note when the selected date changes; an empty save deletes
  // the row. Per-day tags + screenshots from the vanilla annotation system are deferred (A32).
  import { getContext } from 'svelte';
  import { emit } from '../../core.js';

  let { date, onsaved, onclose } = $props();
  const store = getContext('bb:store');

  let text = $state('');
  let saving = $state(false);
  let savedMsg = $state('');

  // Reload whenever the selected date changes (reads `date`; setting `text` doesn't re-trigger).
  $effect(() => {
    const d = date;
    savedMsg = '';
    store.getJournal(d).then(rec => {
      text = rec.text || '';
    });
  });

  async function save() {
    saving = true;
    await store.saveJournal(date, { text });
    saving = false;
    savedMsg = text.trim() ? 'Saved' : 'Cleared';
    emit('note:saved', { date });
    onsaved();
  }
</script>

<section class="panel journal">
  <div class="phead">
    <h2>Day note · {date}</h2>
    <button type="button" class="x" onclick={onclose} aria-label="Close day note">×</button>
  </div>
  <textarea bind:value={text} rows="4" placeholder={`What happened on ${date}? Setups, mistakes, market context…`}></textarea>
  <div class="actions">
    <button type="button" class="save" onclick={save} disabled={saving}>Save note</button>
    {#if savedMsg}<span class="ok">{savedMsg}</span>{/if}
  </div>
</section>

<style>
  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px 16px;
    margin-top: 16px;
  }
  .phead {
    display: flex;
    align-items: center;
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
  .x {
    background: transparent;
    border: 0;
    color: var(--dim);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .x:hover {
    color: var(--txt);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: var(--panel2);
    color: var(--txt);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 10px;
    font-family: var(--sans);
    font-size: 13px;
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
  }
  .save {
    background: var(--accent);
    color: #0d1014;
    border: 0;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .save:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .ok {
    font-size: 12px;
    color: var(--green);
  }
</style>
