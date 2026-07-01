<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import type { WithElementRef } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  let { ref = $bindable(null), value = $bindable(), class: className, ...restProps }: WithElementRef<HTMLTextareaAttributes> = $props();
</script>

<textarea
  bind:this={ref}
  bind:value
  data-slot="textarea"
  class={cn(
    'border-input placeholder:text-muted-foreground flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    className
  )}
  {...restProps}
></textarea>
