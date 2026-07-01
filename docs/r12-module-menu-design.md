# R12 — Dashboard module menu (design)

Status: **accepted · shipped** · drives **A71** (clickable module-header menu). _Superseded by the CH16
cutover: the module menu now ships on all surfaces and the `STAGING_PAGE` gating referenced below is
retired — this doc is a point-in-time design record._

## Problem

The dashboard panels (`perf`, `cal`, `cost`, `adv`, `defs`, `term`) are reorderable (drag the grip) and
collapsible (the chevron), with order + collapsed state persisted through the `Store.local` seam under
staging-namespaced keys, and snapshot-able as workspace templates (A36). But there is **no way to remove
a module from the dashboard, nor to add it back** — every module always renders. R12 asks for a "module
menu" to *spawn modules onto the dashboard*; A71 asks for the *top module headers to be clickable with a
menu popup* for per-module actions.

These are two halves of one feature: a per-module **header menu** (A71) whose actions include **Hide**,
and a dashboard-level **"Add module"** menu (R12) that re-spawns hidden modules.

## Design

### State (App.svelte)

- Keep the existing `panelOrder: string[]` (the canonical order of all known modules) and
  `collapsedPanels: Record<string,1>`.
- Add **`hiddenPanels: Record<string,1>`** — the set of modules removed from the dashboard. Persisted to
  `Store.local` under a new staging-namespaced key `tj_hidden_staging`, mirroring `tj_order` /
  `tj_collapsed`. Included in workspace-template snapshots and cleared on "revert to default".
- Derived: `visiblePanels = panelOrder.filter(k => !hiddenPanels[k])` drives the render loop;
  `hiddenList = panelOrder.filter(k => hiddenPanels[k])` feeds the "Add module" menu.
- `MODULE_LABELS` maps each key to a human label (the menu needs names; the labels otherwise live only
  inside each component's `<Panel title>`).

### A71 — per-module header menu (Panel.svelte)

- A "⋯" (kebab) button in the panel header opens an accessible popup `role="menu"` with:
  - **Collapse / Expand** — calls the existing `ontoggle`.
  - **Move up / Move down** — reorders within the visible set (disabled at the ends).
  - **Hide** — removes the module from the dashboard (R12).
- Close on Escape, outside click (`<svelte:window onclick>` + `stopPropagation` on the toggle — the same
  pattern as the A49 session-pill popup), or after an action. Keyboard-reachable; `aria-haspopup`/
  `aria-expanded` on the toggle.
- The menu is **staging-gated** (`menu` prop = `STAGING_PAGE`); prod/demo render the header exactly as
  before (drag + chevron only). CSP-clean — positioned via scoped CSS, no inline `style=""` (A55).

### R12 — "Add module" (App.svelte)

- A small **"+ Add module"** control by the WorkspaceBar opens a popup `role="menu"` listing the
  `hiddenList` modules by label; choosing one un-hides it (re-spawns it in its existing `panelOrder`
  position). Hidden when nothing is hidden. Staging-gated.

### Why not a free "spawn duplicate modules" model

The vanilla R12 sketch imagined spawning arbitrary module instances. The current architecture renders one
instance per known key from a fixed registry (`DEFAULT_ORDER`), and order/collapsed/hidden are keyed by
that single id — so **hide + add-back** is the faithful, low-risk realization of "spawn modules onto the
dashboard" without a multi-instance rewrite. Multi-instance modules (e.g. two calendars) would need
instance ids threaded through persistence + workspace snapshots and is out of scope here; refile if
wanted.

### Persistence / surface guarantees

- All three maps (`order`, `collapsed`, `hidden`) persist under the `_staging` suffix, so the layout
  never leaks into prod/demo, and demo's `DemoStore` keeps it in memory only (never persisted).
- Workspace templates snapshot `{ order, collapsed, hidden }`; older snapshots without `hidden` default
  to "nothing hidden".

## Done when

Clicking a module header opens an accessible menu with working Collapse/Move/Hide actions; hidden modules
can be re-added from the "Add module" menu; order/hidden persist; prod/demo are unchanged; e2e covers
open/close + hide/re-add.
