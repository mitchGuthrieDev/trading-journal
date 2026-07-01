<script lang="ts">
  // Staging-only dashboard tab bar (A135): multiple named dashboards, each with its own module
  // layout, persisted via the Store.local seam (App owns the state + keys). Each tab carries a
  // small menu (rename / move / delete); "+ New tab" creates. Prod/demo never render this.
  import { Plus, MoreHorizontal, Pencil, ChevronLeft, ChevronRight, Trash2 } from '@lucide/svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

  export type DashTab = { id: string; name: string };
  let {
    tabs,
    active,
    onselect,
    oncreate,
    onrename,
    onmove,
    ondelete,
  }: {
    tabs: DashTab[];
    active: string;
    onselect: (id: string) => void;
    oncreate: () => void;
    onrename: (id: string) => void;
    onmove: (id: string, dir: -1 | 1) => void;
    ondelete: (id: string) => void;
  } = $props();
</script>

<div class="flex flex-wrap items-center gap-1 border-b border-border pb-2">
  {#each tabs as t, i (t.id)}
    <div
      class={[
        'flex items-center rounded-md border',
        active === t.id ? 'border-border bg-secondary text-foreground' : 'border-transparent text-muted-foreground',
      ]}
    >
      <button
        type="button"
        class="rounded-l-md px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-foreground"
        aria-current={active === t.id ? 'page' : undefined}
        onclick={() => onselect(t.id)}>{t.name}</button
      >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class="grid size-6 place-items-center rounded-r-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Tab menu: {t.name}"><MoreHorizontal class="size-3.5" /></button
            >
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="min-w-[160px]">
          <DropdownMenu.Item onSelect={() => onrename(t.id)}><Pencil class="size-4" /> Rename</DropdownMenu.Item>
          <DropdownMenu.Item disabled={i === 0} onSelect={() => onmove(t.id, -1)}
            ><ChevronLeft class="size-4" /> Move left</DropdownMenu.Item
          >
          <DropdownMenu.Item disabled={i === tabs.length - 1} onSelect={() => onmove(t.id, 1)}
            ><ChevronRight class="size-4" /> Move right</DropdownMenu.Item
          >
          <DropdownMenu.Item disabled={tabs.length === 1} class="text-destructive" onSelect={() => ondelete(t.id)}
            ><Trash2 class="size-4" /> Delete</DropdownMenu.Item
          >
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/each}
  <button
    type="button"
    class="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    onclick={oncreate}><Plus class="size-3.5" /> New tab</button
  >
</div>
