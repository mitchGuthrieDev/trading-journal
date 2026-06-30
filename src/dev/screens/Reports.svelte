<script lang="ts">
  // Reports surface mockup (UI redesign, Phase 2 — 7th/last screen; Data Management). A two-pane
  // report generator: a left config panel (template, title/account, date-range + scope, period
  // comparison, section toggles) drives a live document preview on the right; export actions
  // (PDF / Markdown / CSV / Email / Copy) in the toolbar. On cutover the preview + Markdown/email
  // export reuse the existing pure report.ts builder (A34). Representative static data; color only
  // in the P&L.
  import { FileDown, Code, Table2, Mail, Copy, Receipt, Percent, ChartLine, FileText } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Separator } from '$lib/components/ui/separator';
  import * as Card from '$lib/components/ui/card';

  type Tmpl = 'performance' | 'cost' | 'tax' | 'full';
  type Sections = { kpis: boolean; curve: boolean; calendar: boolean; cost: boolean; tax: boolean; advanced: boolean };

  let template = $state<Tmpl>('performance');
  let title = $state('Q2 2026 Performance');
  let account = $state('Main · Tradovate');
  let scope = $state<'all' | 'month' | 'custom'>('custom');
  let from = $state('2026-04-01');
  let to = $state('2026-06-30');
  let compare = $state(true);
  let sections = $state<Sections>({ kpis: true, curve: true, calendar: true, cost: false, tax: false, advanced: true });

  const PRESETS: Record<Tmpl, Sections> = {
    performance: { kpis: true, curve: true, calendar: true, cost: false, tax: false, advanced: true },
    cost: { kpis: true, curve: false, calendar: false, cost: true, tax: false, advanced: false },
    tax: { kpis: true, curve: false, calendar: false, cost: false, tax: true, advanced: false },
    full: { kpis: true, curve: true, calendar: true, cost: true, tax: true, advanced: true },
  };
  function selectTemplate(t: Tmpl) {
    template = t;
    sections = { ...PRESETS[t] };
  }
  const rangeLabel = $derived(scope === 'all' ? 'All time' : scope === 'month' ? 'June 2026' : `${from} → ${to}`);

  const TEMPLATES: { key: Tmpl; label: string; icon: typeof FileText }[] = [
    { key: 'performance', label: 'Performance', icon: ChartLine },
    { key: 'cost', label: 'Cost & break-even', icon: Receipt },
    { key: 'tax', label: 'Tax (1256)', icon: Percent },
    { key: 'full', label: 'Full / custom', icon: FileText },
  ];
  const SECTION_LIST: { key: keyof Sections; label: string }[] = [
    { key: 'kpis', label: 'Headline KPIs' },
    { key: 'curve', label: 'Equity curve' },
    { key: 'calendar', label: 'Trading calendar' },
    { key: 'cost', label: 'Cost breakdown' },
    { key: 'tax', label: 'Tax (Section 1256)' },
    { key: 'advanced', label: 'Advanced stats' },
  ];

  const kpis: { label: string; value: string; prior: string; tone?: 'pos' | 'neg' }[] = [
    { label: 'Net P&L', value: '+$79,467', prior: '+$71,240', tone: 'pos' },
    { label: 'Win rate', value: '58.0%', prior: '56.4%' },
    { label: 'Profit factor', value: '3.01', prior: '2.78' },
    { label: 'Expectancy', value: '+$51.64', prior: '+$48.10', tone: 'pos' },
    { label: 'Trades', value: '1,539', prior: '1,402' },
    { label: 'Max drawdown', value: '-$502.75', prior: '-$610.20', tone: 'neg' },
  ];
  const costRows: [string, string, boolean][] = [
    ['Commissions', '-$4,210', false], ['Exchange & NFA fees', '-$1,890', false],
    ['Data & platform', '-$540', false], ['Total costs', '-$6,640', true],
  ];
  const taxRows: [string, string, boolean][] = [
    ['Net §1256 gain', '$79,467', false], ['60% long-term @ 15%', '-$7,152', false],
    ['40% short-term @ 24%', '-$7,629', false], ['State (CA est.)', '-$2,640', false], ['Est. take-home', '$62,046', true],
  ];
  const advRows: [string, string][] = [
    ['Payoff ratio', '2.18'], ['Sortino', '1.24'], ['Recovery factor', '12.4'],
    ['Profit concentration', '18%'], ['Max consec. wins', '9'], ['Max consec. losses', '4'],
  ];
  // Compact calendar heatmap (June).
  const calPnl: Record<number, number> = { 2: 454, 3: 383, 4: 216, 5: 90, 8: 355, 9: 426, 10: -106, 11: -91, 12: -28, 15: 338, 16: 48, 17: 96, 18: 438, 22: 93, 23: 319, 24: 380, 25: 448, 26: -270, 30: 430 };
  const calCells: (number | null)[] = [...Array.from({ length: 1 }, () => null), ...Array.from({ length: 30 }, (_, i) => i + 1)];
</script>

{#snippet sectionTitle(t: string)}
  <h3 class="mb-2 mt-5 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:mt-0">{t}</h3>
{/snippet}

<div class="flex flex-col gap-4">
  <!-- Export toolbar -->
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-xs text-muted-foreground">Preview updates live as you configure.</span>
    <div class="ml-auto flex flex-wrap gap-2">
      <Button size="sm"><FileDown class="size-4" /> PDF</Button>
      <Button variant="outline" size="sm"><Code class="size-4" /> Markdown</Button>
      <Button variant="outline" size="sm"><Table2 class="size-4" /> CSV</Button>
      <Button variant="outline" size="sm"><Mail class="size-4" /> Email</Button>
      <Button variant="outline" size="sm"><Copy class="size-4" /> Copy</Button>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[300px_1fr]">
    <!-- Config panel -->
    <Card.Root class="h-fit">
      <Card.Header><Card.Title>Configure</Card.Title></Card.Header>
      <Card.Content class="space-y-4">
        <div>
          <Label class="mb-1.5">Template</Label>
          <div class="grid grid-cols-2 gap-2">
            {#each TEMPLATES as t (t.key)}
              {@const Icon = t.icon}
              <button
                type="button"
                onclick={() => selectTemplate(t.key)}
                class={cn(
                  'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors',
                  template === t.key ? 'border-border bg-secondary text-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon class="size-4 shrink-0" /> <span class="truncate">{t.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <Separator />

        <div class="grid gap-1.5"><Label for="r-title">Report title</Label><Input id="r-title" bind:value={title} class="h-8" /></div>
        <div class="grid gap-1.5"><Label for="r-acct">Account</Label><Input id="r-acct" bind:value={account} class="h-8" /></div>

        <Separator />

        <div>
          <Label class="mb-1.5">Date range</Label>
          <div class="mb-2 flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {#each [['all', 'All time'], ['month', 'Month'], ['custom', 'Custom']] as const as [k, lbl] (k)}
              <button type="button" onclick={() => (scope = k)} class={cn('flex-1 rounded px-2 py-1 text-xs transition-colors', scope === k ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>{lbl}</button>
            {/each}
          </div>
          {#if scope === 'custom'}
            <div class="grid grid-cols-2 gap-2">
              <Input type="date" bind:value={from} class="h-8" />
              <Input type="date" bind:value={to} class="h-8" />
            </div>
          {/if}
        </div>

        <Label class="justify-between"><span>Compare to prior period</span><Switch bind:checked={compare} /></Label>

        <Separator />

        <div>
          <Label class="mb-2">Sections</Label>
          <div class="space-y-2.5">
            {#each SECTION_LIST as s (s.key)}
              <Label class="justify-between font-normal"><span>{s.label}</span><Switch bind:checked={sections[s.key]} /></Label>
            {/each}
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Live preview document -->
    <Card.Root>
      <Card.Content class="p-6 sm:p-8">
        <div class="mx-auto max-w-2xl">
          <!-- Document header -->
          <div class="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 class="text-2xl font-bold tracking-tight">{title || 'Untitled report'}</h1>
              <p class="mt-1 text-sm text-muted-foreground">{account} · {rangeLabel}</p>
            </div>
            <div class="flex items-center gap-2 text-right">
              <span class="grid size-9 place-items-center rounded-full border border-border"><span class="size-3.5 rounded-full bg-foreground"></span></span>
              <span class="text-sm font-semibold">Blotterbook</span>
            </div>
          </div>

          {#if sections.kpis}
            {@render sectionTitle('Summary')}
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {#each kpis as k (k.label)}
                <div class="rounded-md border border-border bg-background p-3">
                  <div class="text-[11px] text-muted-foreground">{k.label}</div>
                  <div class={cn('mt-0.5 text-lg font-semibold tabular-nums', k.tone === 'pos' ? 'text-chart-2' : k.tone === 'neg' ? 'text-destructive' : 'text-foreground')}>{k.value}</div>
                  {#if compare}<div class="text-[10px] text-muted-foreground">vs {k.prior}</div>{/if}
                </div>
              {/each}
            </div>
          {/if}

          {#if sections.curve}
            {@render sectionTitle('Equity curve')}
            <svg viewBox="0 0 1000 240" class="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Cumulative P&L">
              <defs><linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" class="[stop-color:var(--chart-2)] [stop-opacity:0.25]" /><stop offset="100%" class="[stop-color:var(--chart-2)] [stop-opacity:0]" /></linearGradient></defs>
              {#each [48, 96, 144, 192] as y (y)}<line x1="0" y1={y} x2="1000" y2={y} class="stroke-border" stroke-width="1" />{/each}
              <path d="M0 230 L140 210 L280 180 L420 165 L560 120 L700 90 L840 55 L1000 25 L1000 240 L0 240 Z" fill="url(#repFill)" />
              <path d="M0 230 L140 210 L280 180 L420 165 L560 120 L700 90 L840 55 L1000 25" fill="none" class="stroke-chart-2" stroke-width="2" />
            </svg>
          {/if}

          {#if sections.calendar}
            {@render sectionTitle('Trading calendar — June 2026')}
            <div class="grid grid-cols-7 gap-1">
              {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as d, i (i)}<div class="pb-0.5 text-center text-[9px] text-muted-foreground">{d}</div>{/each}
              {#each calCells as day, i (i)}
                {#if day === null}
                  <div></div>
                {:else}
                  {@const p = calPnl[day]}
                  <div class={cn('flex h-9 flex-col rounded-sm border p-1 text-[9px]', p === undefined ? 'border-border text-muted-foreground' : p >= 0 ? 'border-chart-2/30 bg-chart-2/10 text-chart-2' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
                    <span class="text-muted-foreground">{day}</span>
                    {#if p !== undefined}<span class="mt-auto text-right font-medium tabular-nums">{p >= 0 ? '+' : '-'}{Math.abs(p)}</span>{/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}

          {#if sections.cost}
            {@render sectionTitle('Cost breakdown')}
            <div class="overflow-hidden rounded-md border border-border">
              {#each costRows as [label, amt, total], i (label)}
                <div class={cn('flex items-center justify-between px-3 py-2 text-sm', i > 0 && 'border-t border-border', total && 'bg-secondary font-semibold')}>
                  <span class={total ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  <span class="tabular-nums text-destructive">{amt}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if sections.tax}
            {@render sectionTitle('Tax — Section 1256 (60/40)')}
            <div class="overflow-hidden rounded-md border border-border">
              {#each taxRows as [label, amt, total], i (label)}
                <div class={cn('flex items-center justify-between px-3 py-2 text-sm', i > 0 && 'border-t border-border', total && 'bg-secondary font-semibold')}>
                  <span class={total ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  <span class={cn('tabular-nums', total ? 'text-chart-2' : amt.startsWith('-') ? 'text-destructive' : 'text-foreground')}>{amt}</span>
                </div>
              {/each}
            </div>
            <p class="mt-1.5 text-[11px] text-muted-foreground">Estimate only — not tax advice. Section 1256 contracts are marked-to-market with 60% long-term / 40% short-term treatment.</p>
          {/if}

          {#if sections.advanced}
            {@render sectionTitle('Advanced statistics')}
            <div class="grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
              {#each advRows as [label, value] (label)}
                <div class="flex items-baseline justify-between gap-3 border-b border-border py-1.5 text-sm">
                  <span class="text-xs text-muted-foreground">{label}</span>
                  <span class="font-semibold tabular-nums">{value}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if !sections.kpis && !sections.curve && !sections.calendar && !sections.cost && !sections.tax && !sections.advanced}
            <p class="py-12 text-center text-sm text-muted-foreground">No sections selected — toggle some on to build the report.</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
