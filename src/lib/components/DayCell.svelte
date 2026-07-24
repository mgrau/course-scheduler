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
  const weekend = $derived(date.getDay() === 0 || date.getDay() === 6);

  // Chips are tall by default but shrink to fit when a day is crowded.
  const nChips = $derived.by(() => {
    let n = activitiesOn(s, dateStr).length + assignedOn(s, dateStr).length + dueOn(s, dateStr).length;
    for (const ex of extras) {
      const d = fmtDate(ex);
      if (inTerm(s, d)) n += activitiesOn(s, d).length + assignedOn(s, d).length + dueOn(s, d).length;
    }
    return n;
  });
  const chipH = $derived(Math.max(18, Math.min(40, Math.floor(118 / Math.max(nChips, 1)))));

  let dragOver = $state(false);

  function acceptable(e: DragEvent): boolean {
    // Any in-term, non-holiday day accepts items — days without scheduled
    // classes included.
    if (!isIn || holiday) return false;
    return (e.dataTransfer?.types ?? []).includes('application/x-chip');
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
  class="h-36 overflow-hidden border-b border-r border-gray-200 p-1
    {!isIn
    ? 'bg-gray-100'
    : holiday
      ? 'stripes bg-gray-100'
      : classDay
        ? 'cursor-pointer bg-white hover:bg-sky-50/60'
        : weekend
          ? 'cursor-pointer bg-slate-100/70 hover:bg-sky-50/60'
          : 'cursor-pointer bg-gray-50 hover:bg-sky-50/60'}
    {isToday ? 'ring-2 ring-inset ring-sky-400/70' : ''}
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
        <span
          class="truncate rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-500"
        >
          {meetings.map((m) => m.label ?? m.start ?? 'class').join(' · ')}
        </span>
      {/if}
    </div>
    {#if holiday}
      <div
        class="mt-1 inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
      >
        {holiday}
      </div>
    {/if}
    <div class="mt-1 space-y-0.5">
      {#each activitiesOn(s, dateStr) as a (a.id)}
        <Chip kind="activity" item={a} size={chipH} />
      {/each}
      {#each assignedOn(s, dateStr) as a (a.id)}
        <Chip kind="assigned" item={a} size={chipH} />
      {/each}
      {#each dueOn(s, dateStr) as a (a.id)}
        <Chip kind="due" item={a} size={chipH} />
      {/each}
      {#each extras as ex (fmtDate(ex))}
        {#if inTerm(s, fmtDate(ex))}
          {#each activitiesOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="activity" item={a} prefix="{weekdayName(ex)}: " size={chipH} />
          {/each}
          {#each assignedOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="assigned" item={a} prefix="{weekdayName(ex)}: " size={chipH} />
          {/each}
          {#each dueOn(s, fmtDate(ex)) as a (a.id)}
            <Chip kind="due" item={a} prefix="{weekdayName(ex)}: " size={chipH} />
          {/each}
        {/if}
      {/each}
    </div>
  {/if}
</div>
