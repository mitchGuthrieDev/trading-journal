// DropdownMenu barrel (A128). shadcn-svelte composition over bits-ui. Import as a namespace:
//   import * as DropdownMenu from '$ui/dropdown-menu';
import { DropdownMenu as MenuPrimitive } from 'bits-ui';
import Content from './dropdown-menu-content.svelte';
import Item from './dropdown-menu-item.svelte';

const Root = MenuPrimitive.Root;
const Trigger = MenuPrimitive.Trigger;
const Group = MenuPrimitive.Group;
const Separator = MenuPrimitive.Separator;

export { Root, Trigger, Group, Separator, Content, Item };
