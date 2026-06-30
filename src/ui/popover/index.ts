// Popover barrel (A128). shadcn-svelte composition over bits-ui. Import as a namespace:
//   import * as Popover from '$ui/popover';
import { Popover as PopoverPrimitive } from 'bits-ui';
import Content from './popover-content.svelte';

const Root = PopoverPrimitive.Root;
const Trigger = PopoverPrimitive.Trigger;
const Close = PopoverPrimitive.Close;

export { Root, Trigger, Close, Content };
