<script lang="ts">
  // Reusable app FRAME for UI mockups — adapted from the production dashboard chrome in
  // src/app/App.svelte (topbar + centered content column + responsive gutters), rebuilt with
  // Tailwind LAYOUT UTILITIES so it's the single frame every new screen mockup sits inside.
  //
  // It deliberately mirrors the real app's measurements: the 1100px centered column, the
  // flex/space-between topbar with a bottom border, the brand/meta/actions zones, and the
  // 560px mobile gutter step. The real app has no sidebar, so the `sidebar` snippet is OFF by
  // default; pass it only for mockups that need a left rail (it stacks above content on mobile).
  //
  // Styling is utility-only (no scoped <style>, no inline style="") so it stays CSP-clean and
  // reads design-token values straight from src/styles/tailwind.css.
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    /** Wordmark / badges (topbar left). Defaults to the "Blotterbook" wordmark. */
    brand?: Snippet;
    /** Muted mono sub-line (topbar center) — e.g. a date range or surface label. */
    meta?: Snippet;
    /** Top-right controls (buttons, pills, menus…). */
    actions?: Snippet;
    /** OPTIONAL left rail. Off by default to match the real topbar-only app. */
    sidebar?: Snippet;
    /** Drop the 1100px cap and run edge-to-edge, matching the staging surface (L8). */
    wide?: boolean;
    /** Extra classes for the outer column. */
    class?: string;
    children: Snippet;
  }
  let { brand, meta, actions, sidebar, wide = false, class: className, children }: Props = $props();
</script>

<div
  class={cn(
    'mx-auto px-2.5 pt-3.5 pb-10 min-[560px]:px-4 min-[560px]:pt-5 min-[560px]:pb-12',
    wide ? 'max-w-none' : 'max-w-[1100px]',
    className
  )}
>
  <header
    class="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border pb-3.5"
  >
    <div class="text-xl font-bold tracking-[0.2px]">
      {#if brand}{@render brand()}{:else}Blotterbook{/if}
    </div>
    {#if meta}
      <div class="font-mono text-xs text-muted-foreground">{@render meta()}</div>
    {/if}
    {#if actions}
      <div class="flex items-center gap-2.5">{@render actions()}</div>
    {/if}
  </header>

  {#if sidebar}
    <div class="flex flex-col gap-6 md:flex-row">
      <aside class="shrink-0 md:w-60">{@render sidebar()}</aside>
      <main class="min-w-0 flex-1">{@render children()}</main>
    </div>
  {:else}
    <main>{@render children()}</main>
  {/if}
</div>
