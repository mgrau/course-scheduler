<script lang="ts">
  import { requestPrint, ui } from '../ui.svelte';
  import { unscheduled } from '../model';
  import { store } from '../store.svelte';
  import Modal from './Modal.svelte';

  const nUnscheduled = $derived(unscheduled(store.schedule).length);
</script>

<Modal title="Print" onclose={() => (ui.printDialog = false)}>
  <div class="space-y-3 text-sm">
    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={ui.printOpts.calendar} />
      <span>Calendar — one month per page</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={ui.printOpts.overview} />
      <span>Semester overview — whole term on one page, one week per row</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={ui.printOpts.cards} />
      <span>
        Unscheduled activities as cut-out cards
        <span class="text-gray-400">({nUnscheduled} card{nUnscheduled === 1 ? '' : 's'})</span>
      </span>
    </label>
    <p class="text-xs text-gray-500">
      Use your browser's print dialog to save as PDF. Landscape orientation and "background
      graphics" enabled are recommended.
    </p>
    <div class="flex justify-end gap-2 pt-2">
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        onclick={() => (ui.printDialog = false)}>Cancel</button
      >
      <button
        class="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        onclick={requestPrint}
        disabled={!ui.printOpts.calendar && !ui.printOpts.overview && !ui.printOpts.cards}
        >Print…</button
      >
    </div>
  </div>
</Modal>
