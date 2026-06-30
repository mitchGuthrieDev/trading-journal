<script lang="ts">
  // Stub shown for redesign surfaces not yet mocked. Each gets replaced by a real screen as we work
  // down the list (Dashboard → Calendar → Analytics → Blotter → CSV Library → Trades → Reports).
  import { Hammer } from '@lucide/svelte';

  interface Props {
    title: string;
  }
  let { title }: Props = $props();
</script>

<div class="grid min-h-[60vh] place-items-center">
  <div class="flex flex-col items-center gap-3 text-center">
    <span class="grid size-12 place-items-center rounded-md border border-border bg-card text-muted-foreground">
      <Hammer class="size-5" />
    </span>
    <div>
      <h2 class="text-lg font-semibold text-foreground">{title}</h2>
      <p class="mt-1 text-sm text-muted-foreground">This surface is next on the redesign list — coming soon.</p>
    </div>
  </div>
</div>
