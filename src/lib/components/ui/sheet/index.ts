import { Dialog as SheetPrimitive } from 'bits-ui';

import Overlay from './sheet-overlay.svelte';
import Content from './sheet-content.svelte';
import Header from './sheet-header.svelte';
import Footer from './sheet-footer.svelte';
import Title from './sheet-title.svelte';
import Description from './sheet-description.svelte';

const Root = SheetPrimitive.Root;
const Portal = SheetPrimitive.Portal;
const Trigger = SheetPrimitive.Trigger;
const Close = SheetPrimitive.Close;

export {
  Root,
  Portal,
  Trigger,
  Close,
  Overlay,
  Content,
  Header,
  Footer,
  Title,
  Description,
  //
  Root as Sheet,
  Portal as SheetPortal,
  Trigger as SheetTrigger,
  Close as SheetClose,
  Overlay as SheetOverlay,
  Content as SheetContent,
  Header as SheetHeader,
  Footer as SheetFooter,
  Title as SheetTitle,
  Description as SheetDescription,
};
