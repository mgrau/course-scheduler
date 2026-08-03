<script lang="ts">
  import { unscheduled } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Chip from './Chip.svelte';
  import Icon from './Icon.svelte';

  const items = $derived(unscheduled(store.schedule));
  let dragOver = $state(false);

  function ondragover(e: DragEvent) {
    if (e.dataTransfer?.types.includes('application/x-activity')) {
      e.preventDefault();
      dragOver = true;
    }
  }

  function ondrop(e: DragEvent) {
    dragOver = false;
    const raw = e.dataTransfer?.getData('application/x-chip');
    if (!raw) return;
    e.preventDefault();
    const { kind, id } = JSON.parse(raw);
    if (kind === 'activity') store.moveActivity(id, undefined);
  }
</script>

<aside
  class="flex w-full shrink-0 flex-col border-t border-gray-200 bg-gray-50 p-3 md:w-56 md:border-l md:border-t-0
    {dragOver ? 'ring-2 ring-inset ring-blue-400' : ''}"
  {ondragover}
  {ondrop}
  ondragleave={() => (dragOver = false)}
>
  <div class="mb-2 flex items-center justify-between gap-2">
    <h2 class="text-sm font-semibold text-gray-700">Unscheduled</h2>
    <button
      class="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
      onclick={() => (ui.editor = { mode: 'new' })}
    >
      <Icon name="plus" class="h-3.5 w-3.5" />New item
    </button>
  </div>
  <div class="grid max-h-32 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3 md:block md:max-h-none md:space-y-1">
    {#each items as a (a.id)}
      <Chip kind="activity" item={a} />
    {/each}
  </div>
  <p class="mt-auto hidden pt-3 text-[11px] leading-snug text-gray-400 md:block">
    Drag activities onto the calendar, or drop them here to unschedule. Items marked
    <span class="font-medium">reusable</span> stay here when dragged out, so they can be placed
    repeatedly. These can be printed as cut-out cards.
  </p>
</aside>
