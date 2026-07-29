<script lang="ts">
  import type { Activity, Assignment } from '../types';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { categoryColor, darker, hasConflict, lighter } from '../model';
  import Icon from './Icon.svelte';

  let {
    kind,
    item,
    prefix = '',
    size = 40,
  }: {
    kind: 'activity' | 'assigned' | 'due';
    item: Activity | Assignment;
    prefix?: string;
    /** Chip height in px; cells shrink this when a day is crowded. */
    size?: number;
  } = $props();

  const color = $derived(categoryColor(store.schedule, item.category));
  const conflict = $derived(
    kind === 'activity' && hasConflict(store.schedule, item as Activity),
  );
  const dueTime = $derived(kind === 'due' ? ((item as Assignment).time ?? '') : '');
  const showDesc = $derived(size >= 36 && !!item.description);
  // A reusable, unscheduled activity is a template: dragging it copies.
  const template = $derived(
    kind === 'activity' && !!(item as Activity).reusable && !(item as Activity).date,
  );

  function ondragstart(e: DragEvent) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/x-chip', JSON.stringify({ kind, id: item.id }));
    if (kind === 'activity') e.dataTransfer.setData('application/x-activity', '1');
    e.dataTransfer.effectAllowed = template ? 'copy' : 'move';
  }

  function onclick(e: MouseEvent) {
    e.stopPropagation();
    ui.editor =
      kind === 'activity' ? { mode: 'activity', id: item.id } : { mode: 'assignment', id: item.id };
  }
</script>

{#if kind === 'activity'}
  <button
    class="flex w-full cursor-grab flex-col justify-center overflow-hidden rounded px-1.5 text-left text-xs font-medium shadow-md shadow-slate-500/30 transition hover:brightness-105 {conflict
      ? 'ring-2 ring-red-500'
      : ''}"
    style="height: {size}px; background-color: {lighter(color, 0.6)}; color: {darker(color, 0.5)}"
    draggable="true"
    data-chip="activity:{item.id}"
    {ondragstart}
    {onclick}
    title={conflict
      ? `${item.title} — class is cancelled on this day!`
      : template
        ? `${item.title} — reusable: drag out as many copies as you like`
        : (item.description ?? item.title)}
  >
    <span class="flex w-full items-center gap-1">
      <span class="truncate">{prefix}{item.title}</span>
      {#if template}
        <Icon name="copy" class="ml-auto h-3 w-3 opacity-70" />
      {/if}
    </span>
    {#if showDesc}
      <span class="w-full truncate text-[10px] font-normal opacity-75">{item.description}</span>
    {/if}
  </button>
{:else if kind === 'assigned'}
  <button
    class="flex w-full cursor-grab items-center gap-1 overflow-hidden rounded px-1.5 text-left text-xs shadow-md shadow-slate-500/30 transition hover:brightness-105"
    style="height: {size}px; background-color: {lighter(color, 0.78)}; color: {darker(color, 0.45)}"
    draggable="true"
    data-chip="assigned:{item.id}"
    {ondragstart}
    {onclick}
    title="{item.title} assigned"
  >
    <span class="truncate">{prefix}{item.title}</span>
    <span class="ml-auto shrink-0">→</span>
  </button>
{:else}
  <button
    class="flex w-full cursor-grab items-center gap-1 overflow-hidden rounded px-1.5 text-left text-xs font-semibold shadow-md shadow-slate-500/30 transition hover:brightness-105"
    style="height: {size}px; background-color: {lighter(color, 0.6)}; color: {darker(color, 0.5)}"
    draggable="true"
    data-chip="due:{item.id}"
    {ondragstart}
    {onclick}
    title="{item.title} due{dueTime ? ' at ' + dueTime : ''}"
  >
    <span class="shrink-0">→</span>
    <span class="truncate">{prefix}{item.title}{dueTime ? ` ${dueTime}` : ''}</span>
  </button>
{/if}
