<script lang="ts">
  // Dashboard surface mockup (UI redesign, Phase 2 — first screen). Re-frames the current app's
  // dashboard in the new greyscale/mono language inside the sidebar shell: a scope/filter toolbar, a
  // KPI stat-card row, and reorderable modules (Performance + Trading Calendar) with drag/menu
  // affordances. Representative STATIC data — this is a layout mockup, not the live reactive engine
  // (that integration comes when the look is approved). Utility-only styling, color only in the data.
  import { SlidersHorizontal, Plus, GripVertical, MoreHorizontal } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';

  let scope = $state<'all' | 'month'>('all');
  let overlay = $state<'gross' | 'net' | 'take'>('gross');

  const stats: { label: string; value: string; badge?: string; up?: boolean; note: string }[] = [
    { label: 'Net P&L', value: '+$79,467.75', badge: '+12.5%', up: true, note: '892W · 647L' },
    { label: 'Win rate', value: '58.0%', note: '1,539 trades' },
    { label: 'Profit factor', value: '3.01', note: 'gross win ÷ loss' },
    { label: 'Expectancy', value: '+$51.64', badge: 'per trade', up: true, note: 'avg edge' },
    { label: 'Max drawdown', value: '-$502.75', badge: '0.8%', up: false, note: 'of peak' },
    { label: 'Sharpe (daily)', value: '0.80', note: '443 trading days' },
  ];

  // Representative June grid: first day is Monday; a few traded days carry P&L tints.
  const pnlByDay: Record<number, { pnl: number; tr: number }> = {
    2: { pnl: 454, tr: 4 }, 3: { pnl: 383, tr: 4 }, 4: { pnl: 216, tr: 3 }, 5: { pnl: 90, tr: 4 },
    8: { pnl: 355, tr: 5 }, 9: { pnl: 426, tr: 3 }, 10: { pnl: -106, tr: 2 }, 11: { pnl: -91, tr: 4 },
    12: { pnl: -28, tr: 2 }, 15: { pnl: 338, tr: 2 }, 16: { pnl: 48, tr: 4 }, 17: { pnl: 96, tr: 3 },
    18: { pnl: 438, tr: 5 }, 22: { pnl: 93, tr: 5 }, 23: { pnl: 319, tr: 4 }, 24: { pnl: 380, tr: 5 },
    25: { pnl: 448, tr: 4 }, 26: { pnl: -270, tr: 5 }, 30: { pnl: 430, tr: 5 },
  };
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDow = 1; // Monday
  const daysInMonth = 30;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const money = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString()}`;
</script>

{#snippet moduleHeader(title: string)}
  <div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
    <GripVertical class="size-4 cursor-grab text-muted-foreground" />
    <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
    <button type="button" class="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Module menu">
      <MoreHorizontal class="size-4" />
    </button>
  </div>
{/snippet}

{#snippet seg(active: boolean, label: string, onclick: () => void)}
  <button
    type="button"
    {onclick}
    class={[
      'rounded px-2.5 py-1 text-xs transition-colors',
      active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
    ]}
  >
    {label}
  </button>
{/snippet}

<div class="flex flex-col gap-5">
  <!-- Toolbar -->
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      {@render seg(scope === 'all', 'All time', () => (scope = 'all'))}
      {@render seg(scope === 'month', 'This month', () => (scope = 'month'))}
    </div>
    <Button variant="outline" size="sm">
      <SlidersHorizontal class="size-4" /> Filters
    </Button>
    <span class="ml-auto text-xs text-muted-foreground">2024-07-01 → 2026-06-30</span>
  </div>

  <!-- KPI stat cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {#each stats as s (s.label)}
      <Card.Root class="p-4">
        <div class="flex items-start justify-between gap-2">
          <span class="text-xs text-muted-foreground">{s.label}</span>
          {#if s.badge}
            <Badge variant="outline" class={s.up ? 'border-chart-2/40 text-chart-2' : 'border-destructive/40 text-destructive'}>{s.badge}</Badge>
          {/if}
        </div>
        <div
          class={[
            'mt-2 text-xl font-semibold tracking-tight tabular-nums',
            s.up === undefined ? 'text-foreground' : s.up ? 'text-chart-2' : 'text-destructive',
          ]}
        >
          {s.value}
        </div>
        <div class="mt-1 text-[11px] text-muted-foreground">{s.note}</div>
      </Card.Root>
    {/each}
  </div>

  <!-- Performance module -->
  <Card.Root>
    {@render moduleHeader('Performance')}
    <Card.Content>
      <div class="mb-3 flex w-fit items-center gap-0.5 rounded-md border border-border p-0.5">
        {@render seg(overlay === 'gross', 'Gross', () => (overlay = 'gross'))}
        {@render seg(overlay === 'net', 'Net', () => (overlay = 'net'))}
        {@render seg(overlay === 'take', 'Take-home', () => (overlay = 'take'))}
      </div>
      <svg viewBox="0 0 1000 280" class="h-64 w-full" preserveAspectRatio="none" role="img" aria-label="Cumulative P&L curve">
        <defs>
          <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="[stop-color:var(--chart-2)] [stop-opacity:0.25]" />
            <stop offset="100%" class="[stop-color:var(--chart-2)] [stop-opacity:0]" />
          </linearGradient>
        </defs>
        {#each [56, 112, 168, 224] as y (y)}
          <line x1="0" y1={y} x2="1000" y2={y} class="stroke-border" stroke-width="1" />
        {/each}
        <path
          d="M0 270 L120 250 L240 215 L360 205 L480 160 L600 135 L720 95 L840 70 L1000 30 L1000 280 L0 280 Z"
          fill="url(#perfFill)"
        />
        <path
          d="M0 270 L120 250 L240 215 L360 205 L480 160 L600 135 L720 95 L840 70 L1000 30"
          fill="none"
          class="stroke-chart-2"
          stroke-width="2"
        />
      </svg>
    </Card.Content>
  </Card.Root>

  <!-- Trading calendar module -->
  <Card.Root>
    {@render moduleHeader('Trading Calendar')}
    <Card.Content>
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium text-foreground">June 2026</span>
        <span class="text-sm tabular-nums text-chart-2">+$4,016.50</span>
      </div>
      <div class="grid grid-cols-7 gap-1.5">
        {#each weekdays as d (d)}
          <div class="pb-1 text-center text-[11px] text-muted-foreground">{d}</div>
        {/each}
        {#each cells as day, i (i)}
          {#if day === null}
            <div></div>
          {:else}
            {@const t = pnlByDay[day]}
            {@const up = t && t.pnl >= 0}
            <div
              class={[
                'min-h-16 rounded border p-1.5',
                t
                  ? up
                    ? 'border-chart-2/30 bg-chart-2/10'
                    : 'border-destructive/30 bg-destructive/10'
                  : 'border-border',
              ]}
            >
              <div class="text-[11px] text-muted-foreground">{day}</div>
              {#if t}
                <div class={['mt-1 text-right text-xs font-medium tabular-nums', up ? 'text-chart-2' : 'text-destructive']}>
                  {money(t.pnl)}
                </div>
                <div class="text-right text-[10px] text-muted-foreground">{t.tr} tr</div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Add-module affordance -->
  <button
    type="button"
    class="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
  >
    <Plus class="size-4" /> Add module
  </button>
</div>
