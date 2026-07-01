<script lang="ts">
  import { Tabs as TabsPrimitive, type WithoutChild } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  let { ref = $bindable(null), class: className, ...restProps }: WithoutChild<TabsPrimitive.ContentProps> = $props();
</script>

<TabsPrimitive.Content bind:ref data-slot="tabs-content" class={cn('flex-1 outline-none', className)} {...restProps} />
