<script lang="ts">
  import type { Activity, Assignment } from '../types';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { startChipDrag } from '../dnd.svelte';
  import { categoryColor, darker, dateConflict, lighter } from '../model';
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
  // Scheduled somewhere questionable (a holiday, outside the term)?
  const conflict = $derived(
    dateConflict(
      store.schedule,
      kind === 'activity'
        ? (item as Activity).date
        : kind === 'due'
          ? (item as Assignment).due
          : (item as Assignment).assigned,
    ),
  );
  const ring = 'ring-[3px] ring-inset ring-red-500 dark:ring-red-400';
  // Pastel tints on light surfaces; dimmed color fills with light text on dark.
  const strongStyle = $derived(
    ui.dark
      ? `background-color: ${darker(color, 0.62)}; color: ${lighter(color, 0.62)}`
      : `background-color: ${lighter(color, 0.6)}; color: ${darker(color, 0.5)}`,
  );
  const faintStyle = $derived(
    ui.dark
      ? `background-color: ${darker(color, 0.76)}; color: ${lighter(color, 0.45)}`
      : `background-color: ${lighter(color, 0.78)}; color: ${darker(color, 0.45)}`,
  );
  const dueTime = $derived(kind === 'due' ? ((item as Assignment).time ?? '') : '');
  const showDesc = $derived(size >= 36 && !!item.description);
  // A reusable, unscheduled activity is a template: dragging it copies.
  const template = $derived(
    kind === 'activity' && !!(item as Activity).reusable && !(item as Activity).date,
  );

  // Pointer-based drag (works on touch); a plain click/tap opens the editor.
  let justDragged = false;

  function onpointerdown(e: PointerEvent) {
    startChipDrag(
      e,
      { kind, id: item.id, title: item.title, color, template },
      (dragged) => (justDragged = dragged),
    );
  }

  function onclick(e: MouseEvent) {
    e.stopPropagation();
    if (justDragged) {
      justDragged = false;
      return;
    }
    ui.editor =
      kind === 'activity' ? { mode: 'activity', id: item.id } : { mode: 'assignment', id: item.id };
  }
</script>

{#if kind === 'activity'}
  <button
    class="flex w-full cursor-grab flex-col justify-center overflow-hidden rounded px-1.5 text-left text-xs font-medium shadow-md shadow-slate-500/30 transition hover:brightness-105 {conflict
      ? ring
      : ''}"
    style="height: {size}px; {strongStyle}"
    data-chip="activity:{item.id}"
    {onpointerdown}
    {onclick}
    title={conflict
      ? `${item.title} — ${conflict}`
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
      <span class="w-full truncate text-[10px] font-normal">{item.description}</span>
    {/if}
  </button>
{:else if kind === 'assigned'}
  <button
    class="flex w-full cursor-grab items-center gap-1 overflow-hidden rounded px-1.5 text-left text-xs shadow-md shadow-slate-500/30 transition hover:brightness-105 {conflict
      ? ring
      : ''}"
    style="height: {size}px; {faintStyle}"
    data-chip="assigned:{item.id}"
    {onpointerdown}
    {onclick}
    title="{item.title} assigned{conflict ? ` — ${conflict}` : ''}"
  >
    <span class="truncate">{prefix}{item.title}</span>
    <span class="ml-auto shrink-0">→</span>
  </button>
{:else}
  <button
    class="flex w-full cursor-grab items-center gap-1 overflow-hidden rounded px-1.5 text-left text-xs font-semibold shadow-md shadow-slate-500/30 transition hover:brightness-105 {conflict
      ? ring
      : ''}"
    style="height: {size}px; {strongStyle}"
    data-chip="due:{item.id}"
    {onpointerdown}
    {onclick}
    title="{item.title} due{dueTime ? ' at ' + dueTime : ''}{conflict ? ` — ${conflict}` : ''}"
  >
    <span class="shrink-0">→</span>
    <span class="truncate">{prefix}{item.title}{dueTime ? ` ${dueTime}` : ''}</span>
  </button>
{/if}
