<script lang="ts">
  // Popover surface (A128, shadcn-svelte pattern on bits-ui). bits-ui positions it with Floating UI
  // (CSSOM element.style — NOT a literal style="" attribute, so CSP style-src 'self' is unaffected),
  // and the shift middleware keeps it on-screen — which replaces the bespoke A127 mobile-anchoring
  // hack the old hand-rolled popup needed. Rendered without a Portal so it stays in the app tree
  // (the e2e specs target `#sv-app …`).
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import { cn } from '$ui/utils';

  let {
    class: className,
    ref = $bindable(null),
    sideOffset = 6,
    align = 'end',
    ...rest
  }: PopoverPrimitive.ContentProps = $props();
</script>

<PopoverPrimitive.Content
  bind:ref
  {sideOffset}
  {align}
  class={cn(
    'z-50 rounded-[9px] border border-line bg-panel p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus:outline-none',
    className
  )}
  {...rest}
/>
