<script lang="ts">
  // Dropdown surface (A128, shadcn-svelte pattern on bits-ui). bits-ui positions this with Floating
  // UI via element.style (CSSOM) — NOT a literal style="" attribute — so CSP style-src 'self' is
  // unaffected (same mechanism as the styleProps action). Rendered without a Portal so menus stay in
  // the app tree (the e2e specs target `#sv-app … .pmenupop`); fixed positioning still escapes any
  // panel clipping.
  import { DropdownMenu as MenuPrimitive } from 'bits-ui';
  import { cn } from '$ui/utils';

  let {
    class: className,
    ref = $bindable(null),
    sideOffset = 6,
    align = 'end',
    ...rest
  }: MenuPrimitive.ContentProps = $props();
</script>

<MenuPrimitive.Content
  bind:ref
  {sideOffset}
  {align}
  class={cn(
    'z-40 flex min-w-[150px] flex-col rounded-[9px] border border-line bg-panel p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus:outline-none',
    className
  )}
  {...rest}
/>
