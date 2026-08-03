<script lang="ts">
  import { parseDate, shortDate, weekdayName } from '../dates';
  import { findConflicts } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  const conflicts = $derived(findConflicts(store.schedule));

  function open(kind: 'activity' | 'assignment', id: string) {
    ui.conflicts = false;
    ui.editor = { mode: kind, id };
  }
</script>

<Modal title="Possible conflicts" onclose={() => (ui.conflicts = false)}>
  {#if conflicts.length === 0}
    <p class="text-sm text-gray-500">Nothing conflicts any more — all clear.</p>
  {:else}
    <p class="mb-3 text-xs text-gray-500">
      These items sit on a holiday or outside the term. That might be intentional — click one to
      review or move it.
    </p>
    <div class="space-y-1.5">
      {#each conflicts as c (c.kind + c.id + c.date)}
        <button
          class="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm hover:bg-red-100"
          onclick={() => open(c.kind, c.id)}
        >
          <Icon name="warning" class="h-4 w-4 shrink-0 text-red-500" />
          <span class="min-w-0 flex-1">
            <span class="font-medium text-gray-800">{c.title}</span>
            <span class="text-gray-600"> — {c.reason}</span>
          </span>
          <span class="shrink-0 text-xs text-gray-500">
            {weekdayName(parseDate(c.date))}
            {shortDate(parseDate(c.date))}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</Modal>
