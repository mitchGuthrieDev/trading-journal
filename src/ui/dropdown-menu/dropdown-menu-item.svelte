<script lang="ts">
  // Dropdown item (A128). bits-ui gives keyboard navigation, type-ahead, and `data-highlighted`/
  // `data-disabled` state for free; we map those to the token utilities. `variant="danger"` is the
  // destructive action (e.g. Hide module).
  import { DropdownMenu as MenuPrimitive } from 'bits-ui';
  import { cn } from '$ui/utils';

  let {
    class: className,
    ref = $bindable(null),
    variant = 'default',
    ...rest
  }: MenuPrimitive.ItemProps & { variant?: 'default' | 'danger' } = $props();
</script>

<MenuPrimitive.Item
  bind:ref
  class={cn(
    'cursor-pointer select-none rounded-md px-2.5 py-[7px] text-[13px] text-txt outline-none data-highlighted:bg-panel2 data-disabled:cursor-not-allowed data-disabled:opacity-40',
    variant === 'danger' && 'text-red',
    className
  )}
  {...rest}
/>
