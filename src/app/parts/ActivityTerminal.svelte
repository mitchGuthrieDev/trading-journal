<script lang="ts">
  // Activity terminal (CH16 redesign chrome). A small scrollable status log that subscribes to the
  // core event bus (onEvent — A29) and appends a timestamped human-readable line for each action
  // event shared code emits (data loaded/imported, note saved, backup, erase, trade delete). Parity
  // with the legacy src/app/components/ActivityTerminal.svelte, but self-contained (no Panel wrapper).
  import { onEvent, pad2 } from '../../lib/core/core.ts';
  import { cn } from '$lib/utils';
  import { Terminal } from '@lucide/svelte';

  let { class: className }: { class?: string } = $props();

  interface Line {
    id: number;
    ts: string;
    msg: string;
  }

  // The (optional) detail payloads the core event bus carries; detail is `unknown`, so every read is
  // guarded (isRecord + typed field access) — a missing/odd field never throws or logs "undefined".
  function isRecord(d: unknown): d is Record<string, unknown> {
    return typeof d === 'object' && d !== null;
  }
  function num(d: unknown, key: string): number | null {
    if (isRecord(d) && typeof d[key] === 'number') return d[key];
    return null;
  }
  function str(d: unknown, key: string): string {
    if (isRecord(d) && typeof d[key] === 'string') return d[key];
    return '';
  }

  // Event name → human-readable line. Kept simple + defensive since the detail is `unknown`.
  const FMT: Record<string, (d: unknown) => string> = {
    'app:ready': () => 'app ready',
    'refdata:loaded': () => 'reference data loaded',
    'data:loaded': d => `loaded ${num(d, 'count') ?? '?'} trades`,
    'data:imported': d => `imported ${num(d, 'added') ?? '?'} new trades`,
    'note:saved': d => `note saved${str(d, 'date') ? ` · ${str(d, 'date')}` : ''}`,
    'trade:deleted': () => 'trade deleted',
    'backup:created': () => 'backup downloaded',
    'data:erased': () => 'all local data erased',
  };

  let lines = $state<Line[]>([]);
  let nextId = 0; // stable per-line key so the ring buffer doesn't reindex on wrap
  let box: HTMLDivElement | undefined = $state();

  function add(msg: string) {
    const t = new Date();
    const ts = `${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}`;
    lines = [...lines.slice(-49), { id: nextId++, ts, msg }]; // keep the last ~50
  }

  // Subscribe on mount; onEvent returns an unsubscribe fn (core.ts), so collect them and release in
  // the $effect teardown — no duplicate log lines if this component ever unmounts + remounts.
  $effect(() => {
    const offs = Object.entries(FMT).map(([ev, fmt]) => onEvent(ev, d => add(fmt(d))));
    return () => offs.forEach(off => off());
  });

  // Auto-scroll to the newest line.
  $effect(() => {
    lines.length;
    if (box) box.scrollTop = box.scrollHeight;
  });
</script>

<div class={cn('rounded-md border border-border bg-card p-3', className)}>
  <div class="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">
    <Terminal class="size-3.5" />
    <span>Activity</span>
  </div>
  <div
    class="max-h-40 overflow-auto rounded-sm border border-border bg-background px-2.5 py-2 font-mono text-xs"
    bind:this={box}
    role="log"
    aria-live="polite"
  >
    {#each lines as l (l.id)}
      <div class="flex gap-2.5 py-0.5">
        <span class="text-muted-foreground">{l.ts}</span><span class="text-chart-2">{l.msg}</span>
      </div>
    {:else}
      <div class="py-0.5 text-muted-foreground">Waiting for activity…</div>
    {/each}
  </div>
</div>
