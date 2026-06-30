<script lang="ts">
  // A36 — unified dashboard panel chrome: a collapsible, drag-to-reorder card (parity with vanilla
  // ui.js initPanels). Collapse state + order are OWNED by App (persisted through the Store.local
  // seam under a staging-namespaced key) so workspace templates can snapshot them. The grip is the
  // drag handle (matches vanilla: mousedown arms the whole-panel draggable); clicking the header —
  // but not the grip or chevron — toggles collapse, and the chevron mirrors aria-expanded/label (B41).
  import type { Snippet } from 'svelte';
  import * as DropdownMenu from '$ui/dropdown-menu';

  interface Props {
    pkey: string;
    title: string;
    collapsed?: boolean;
    dragging?: boolean;
    ontoggle?: () => void;
    onreorderstart?: (key?: string) => void;
    onreorderend?: () => void;
    onreorderover?: (e: DragEvent, key?: string) => void;
    // R12/A71 (staging): the per-module header menu (move/hide). Off by default → prod/demo unchanged.
    menu?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    onmoveup?: () => void;
    onmovedown?: () => void;
    onhide?: () => void;
    // F26 (staging): grid modules move left/right — the labels default to the stacked up/down wording.
    moveUpLabel?: string;
    moveDownLabel?: string;
    actions?: Snippet;
    children: Snippet;
  }
  let {
    pkey,
    title,
    collapsed = false,
    dragging = false,
    ontoggle = () => {},
    onreorderstart = () => {},
    onreorderend = () => {},
    onreorderover = () => {},
    menu = false,
    isFirst = false,
    isLast = false,
    onmoveup = () => {},
    onmovedown = () => {},
    onhide = () => {},
    moveUpLabel = 'Move up',
    moveDownLabel = 'Move down',
    actions,
    children,
  }: Props = $props();

  let armed = $state(false); // grip pressed → the section is draggable for this gesture only

  function headClick(e: MouseEvent) {
    // Toggle on a bare-header click only — never when the click lands on the grip, the chevron, the
    // module menu, or an interactive control in the actions area (overlays, calendar nav), which would
    // otherwise collapse the panel out from under the user.
    const target = e.target as HTMLElement;
    if (target.closest('.grip') || target.closest('.chev') || target.closest('.pactions') || target.closest('.pmenu')) return;
    ontoggle();
  }
  function onDragStart(e: DragEvent) {
    e.dataTransfer!.effectAllowed = 'move';
    try {
      e.dataTransfer!.setData('text/plain', pkey);
    } catch (_) {}
    onreorderstart(pkey);
  }
  function onDragEnd() {
    armed = false;
    onreorderend();
  }
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    onreorderover(e, pkey);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (drag-to-reorder is a pointer-only enhancement;
     the grip is aria-hidden and collapse/expand has a real keyboard button — panel content is fully
     reachable without dragging) -->
<section class="panel" class:collapsed class:dragging data-key={pkey} draggable={armed} ondragstart={onDragStart} ondragend={onDragEnd} ondragover={onDragOver}>
  <div class="phead" role="presentation" onclick={headClick}>
    <span
      class="grip"
      aria-hidden="true"
      title="Drag to reorder"
      onmousedown={() => (armed = true)}
      onmouseup={() => (armed = false)}
    >⠿</span>
    <h2>{title}</h2>
    {#if actions}<div class="pactions">{@render actions()}</div>{/if}
    {#if menu}
      <!-- A71 (staging): clickable header menu — per-module actions (move / hide). bits-ui (A128)
           owns open/close, outside-click, Escape, keyboard nav + ARIA roles. -->
      <div class="pmenu">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="pmenubtn cursor-pointer rounded-[5px] border-0 bg-transparent px-1.5 py-0.5 text-[15px] leading-none text-dim hover:bg-panel2 hover:text-txt"
            aria-label="{title} module menu"
            title="Module options">⋯</DropdownMenu.Trigger
          >
          <DropdownMenu.Content class="pmenupop" aria-label="{title} options">
            <DropdownMenu.Item onSelect={ontoggle}>{collapsed ? 'Expand' : 'Collapse'}</DropdownMenu.Item>
            <DropdownMenu.Item disabled={isFirst} onSelect={onmoveup}>{moveUpLabel}</DropdownMenu.Item>
            <DropdownMenu.Item disabled={isLast} onSelect={onmovedown}>{moveDownLabel}</DropdownMenu.Item>
            <DropdownMenu.Item variant="danger" onSelect={onhide}>Hide module</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    {/if}
    <button type="button" class="chev" aria-expanded={!collapsed} aria-label={collapsed ? 'Expand' : 'Collapse'} title={collapsed ? 'Expand' : 'Collapse'} onclick={ontoggle}>
      {collapsed ? '▸' : '▾'}
    </button>
  </div>
  {#if !collapsed}
    <div class="pbody">{@render children()}</div>
  {/if}
</section>

<style>
  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px 16px;
    margin-top: 16px;
  }
  .panel.dragging {
    opacity: 0.55;
    border-color: var(--accent);
  }
  .phead {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    /* A121/A123: in a narrow grid column (F26) a heavy header (e.g. the calendar's month nav) would
       overflow and push the collapse chevron off the panel — leaving it stuck collapsed. Allow the
       header to wrap so the controls stay reachable and nothing clips past the panel edge. */
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .grip {
    cursor: grab;
    color: var(--faint);
    font-size: 13px;
    line-height: 1;
    user-select: none;
    letter-spacing: -2px;
  }
  .grip:active {
    cursor: grabbing;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--faint);
    font-weight: 700;
    min-width: 0;
  }
  .pactions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    /* A123: let a heavy actions cluster (e.g. the calendar nav) wrap instead of overflowing the panel. */
    flex-wrap: wrap;
    min-width: 0;
  }
  .chev {
    margin-left: auto;
    background: transparent;
    border: 0;
    color: var(--dim);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 4px;
  }
  .pactions + .chev {
    margin-left: 0;
  }
  .chev:hover {
    color: var(--txt);
  }
  /* A71 (staging): the module-header menu button + popup. */
  .pmenu {
    position: relative;
    margin-left: auto;
  }
  .pactions + .pmenu {
    margin-left: 0;
  }
  .pmenu + .chev {
    margin-left: 0;
  }
</style>
