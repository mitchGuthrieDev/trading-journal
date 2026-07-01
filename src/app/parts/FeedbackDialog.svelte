<script lang="ts">
  // Feedback affordance (A105). Delivery decision: **mailto** — zero backend (A28-clean: no new
  // endpoint, no spam/rate-limit surface, no KV writes per A17), and the local-compute constraint
  // holds BY CONSTRUCTION: nothing is sent automatically, nothing is auto-attached — the draft
  // contains only what the user typed, and it opens in THEIR mail client where they can read
  // exactly what leaves the device. The app version + surface ride in the subject for triage
  // (not PII, no trade data). Safe on every surface incl. demo (no persistence, no store writes).
  import { MessageSquarePlus } from '@lucide/svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Textarea } from '$lib/components/ui/textarea';

  let { version = '', surface = '' }: { version?: string; surface?: string } = $props();

  let open = $state(false);
  let text = $state('');
  const meta = $derived([version && `v${version}`, surface].filter(Boolean).join(' · '));
  const subject = $derived(`Blotterbook feedback${meta ? ` (${meta})` : ''}`);
  const href = $derived(`mailto:contact@blotterbook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" class="size-8" aria-label="Send feedback" title="Send feedback">
        <MessageSquarePlus class="size-4" />
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Send feedback</Dialog.Title>
      <Dialog.Description>
        Opens a draft in your own email app — nothing is sent automatically, and only the text below is included (never your trades or
        journal).
      </Dialog.Description>
    </Dialog.Header>
    <Textarea bind:value={text} placeholder="What's working, what's broken, what's missing…" class="h-32 resize-none" />
    <Dialog.Footer class="flex-row justify-end gap-2">
      <Button variant="ghost" size="sm" onclick={() => (open = false)}>Cancel</Button>
      <a
        {href}
        class={buttonVariants({ size: 'sm' })}
        data-testid="feedback-mailto"
        onclick={() => (open = false)}
        aria-disabled={!text.trim() || undefined}>Open email draft</a
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
