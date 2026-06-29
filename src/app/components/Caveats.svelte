<script lang="ts">
  // CH36 (from the A104 styling audit): the "Assumptions & caveats" <details> block — shared by the
  // Advanced Statistics and Break-even & Cost panels, which previously each carried a near-identical
  // copy of this markup + CSS. The caller passes the <li> bullets as children.
  import type { Snippet } from 'svelte';

  interface Props {
    summary?: string;
    children: Snippet;
  }
  let { summary = 'Assumptions & caveats', children }: Props = $props();
</script>

<details class="caveats">
  <summary>{summary}</summary>
  <ul>{@render children()}</ul>
</details>

<style>
  .caveats {
    margin-top: 14px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .caveats summary {
    font-size: 12px;
    color: var(--faint);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }
  .caveats ul {
    margin: 10px 0 0;
    padding-left: 18px;
  }
  /* The <li>/<b>/<em>/<i> bullets come from the caller's snippet (the parent component's scope), so
     they're styled with :global — contained under the Caveats-owned .caveats/ul. */
  .caveats :global(li) {
    font-size: 12px;
    line-height: 1.55;
    color: var(--dim);
    margin-bottom: 6px;
  }
  .caveats :global(b) {
    color: var(--txt);
  }
  .caveats :global(em),
  .caveats :global(i) {
    color: var(--txt);
    font-style: italic;
  }
</style>
