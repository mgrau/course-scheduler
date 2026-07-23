<script lang="ts">
  import type { Activity, Assignment } from '../types';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { categoryColor, hasConflict } from '../model';

  let {
    kind,
    item,
    prefix = '',
  }: {
    kind: 'activity' | 'assigned' | 'due';
    item: Activity | Assignment;
    prefix?: string;
  } = $props();

  const color = $derived(categoryColor(store.schedule, item.category));
  const conflict = $derived(
    kind === 'activity' && hasConflict(store.schedule, item as Activity),
  );
  const dueTime = $derived(kind === 'due' ? ((item as Assignment).time ?? '') : '');

  function ondragstart(e: DragEvent) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/x-chip', JSON.stringify({ kind, id: item.id }));
    if (kind === 'activity') e.dataTransfer.setData('application/x-activity', '1');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onclick(e: MouseEvent) {
    e.stopPropagation();
    ui.editor =
      kind === 'activity' ? { mode: 'activity', id: item.id } : { mode: 'assignment', id: item.id };
  }
</script>

{#if kind === 'activity'}
  <button
    class="block w-full cursor-grab truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white {conflict
      ? 'ring-2 ring-red-500'
      : ''}"
    style="background-color: {color}"
    draggable="true"
    {ondragstart}
    {onclick}
    title={conflict ? `${item.title} — not a class day!` : (item.description ?? item.title)}
  >
    {prefix}{item.title}
  </button>
{:else if kind === 'assigned'}
  <button
    class="block w-full cursor-grab truncate rounded border border-dashed bg-white px-1.5 py-0.5 text-left text-xs"
    style="border-color: {color}; color: {color}"
    draggable="true"
    {ondragstart}
    {onclick}
    title="{item.title} assigned"
  >
    {prefix}⇢ {item.title}
  </button>
{:else}
  <button
    class="block w-full cursor-grab truncate rounded border-2 bg-white px-1.5 py-0.5 text-left text-xs font-semibold"
    style="border-color: {color}; color: {color}"
    draggable="true"
    {ondragstart}
    {onclick}
    title="{item.title} due{dueTime ? ' at ' + dueTime : ''}"
  >
    {prefix}{item.title} due{dueTime ? ' ' + dueTime : ''}
  </button>
{/if}
