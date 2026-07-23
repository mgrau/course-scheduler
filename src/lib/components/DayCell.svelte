<script lang="ts">
  import { fmtDate, todayStr, weekdayName, monthShort } from '../dates';
  import {
    activitiesOn,
    assignedOn,
    dueOn,
    holidayLabel,
    inTerm,
    isClassDay,
    meetingsOn,
  } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Chip from './Chip.svelte';

  let { date, extras = [] }: { date: Date; extras?: Date[] } = $props();

  const s = $derived(store.schedule);
  const dateStr = $derived(fmtDate(date));
  const isIn = $derived(inTerm(s, dateStr));
  const holiday = $derived(isIn ? holidayLabel(s, dateStr) : null);
  const meetings = $derived(isIn && !holiday ? meetingsOn(s, dateStr) : []);
  const classDay = $derived(isClassDay(s, dateStr));
  const isToday = $derived(dateStr === todayStr());

  let dragOver = $state(false);

  function acceptable(e: DragEvent): boolean {
    if (!isIn || holiday) return false;
    const types = e.dataTransfer?.types ?? [];
    if (types.includes('application/x-activity')) return classDay;
    return types.includes('application/x-chip');
  }

  function ondragover(e: DragEvent) {
    if (acceptable(e)) {
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
    if (kind === 'activity') store.moveActivity(id, dateStr);
    else store.moveAssignment(id, kind, dateStr);
  }

  function onclick() {
    if (isIn) ui.editor = { mode: 'new', date: dateStr };
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="min-h-24 border-b border-r border-gray-200 p-1
    {!isIn
    ? 'bg-gray-100'
    : holiday
      ? 'bg-gray-200'
      : classDay
        ? 'cursor-pointer bg-white hover:bg-blue-50/40'
        : 'cursor-pointer bg-gray-50 hover:bg-blue-50/40'}
    {dragOver ? 'ring-2 ring-inset ring-blue-400' : ''}"
  {onclick}
  {ondragover}
  {ondrop}
  ondragleave={() => (dragOver = false)}
>
  {#if isIn}
    <div class="flex items-baseline justify-between gap-1">
      <span
        class="text-xs {isToday
          ? 'rounded-full bg-blue-600 px-1.5 font-bold text-white'
          : 'font-semibold text-gray-500'}"
      >
        {date.getDate() === 1 ? `${monthShort(date)} ` : ''}{date.getDate()}
      </span>
      {#if meetings.length > 0}
        <span class="truncate text-[10px] text-gray-400">
          {meetings.map((m) => m.label ?? m.start ?? 'class').join(' · ')}
        </span>
      {/if}
    </div>
    {#if holiday}
      <div class="mt-1 text-[11px] font-medium italic text-gray-500">{holiday}</div>
    {/if}
    <div class="mt-1 space-y-0.5">
      {#each activitiesOn(s, dateStr) as a (a.id)}
        <Chip kind="activity" item={a} />
      {/each}
      {#each assignedOn(s, dateStr) as a (a.id)}
        <Chip kind="assigned" item={a} />
      {/each}
      {#each dueOn(s, dateStr) as a (a.id)}
        <Chip kind="due" item={a} />
      {/each}
      {#each extras as ex (fmtDate(ex))}
        {#if inTerm(s, fmtDate(ex))}
          {#each activitiesOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="activity" item={a} prefix="{weekdayName(ex)}: " />
          {/each}
          {#each assignedOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="assigned" item={a} prefix="{weekdayName(ex)}: " />
          {/each}
          {#each dueOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="due" item={a} prefix="{weekdayName(ex)}: " />
          {/each}
        {/if}
      {/each}
    </div>
  {/if}
</div>
