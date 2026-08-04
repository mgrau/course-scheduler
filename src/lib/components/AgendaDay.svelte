<script lang="ts">
  import { fmtDate, todayStr, weekdayName } from '../dates';
  import { dnd } from '../dnd.svelte';
  import {
    activitiesOn,
    assignedOn,
    darker,
    dayMark,
    dueOn,
    holidayTint,
    inTerm,
    isClassDay,
    lighter,
    meetingsOn,
  } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Chip from './Chip.svelte';

  let { date }: { date: Date } = $props();

  const s = $derived(store.schedule);
  const dateStr = $derived(fmtDate(date));
  const isIn = $derived(inTerm(s, dateStr));
  const mark = $derived(isIn ? dayMark(s, dateStr) : null);
  const holiday = $derived(mark && mark.blocks !== false ? mark.label : null);
  const meetings = $derived(isIn && !holiday ? meetingsOn(s, dateStr) : []);
  const acts = $derived(activitiesOn(s, dateStr));
  const asg = $derived(assignedOn(s, dateStr));
  const due = $derived(dueOn(s, dateStr));
  const isToday = $derived(dateStr === todayStr());
  const dragOver = $derived(dnd.over === dateStr);

  // Agenda rows exist for days that carry anything: class meetings, items,
  // or a holiday. Quiet weekends collapse away entirely.
  const visible = $derived(
    isIn && (mark || meetings.length > 0 || acts.length > 0 || asg.length > 0 || due.length > 0),
  );
  const tint = $derived(mark ? holidayTint(mark.label) : null);
  const tintStyle = $derived(
    tint
      ? `background-color: ${ui.dark ? darker(tint, 0.93) : lighter(tint, 0.95)}`
      : '',
  );
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="flex gap-2 border-b border-gray-100 px-2 py-1.5
      {holiday ? 'stripes bg-gray-100' : isClassDay(s, dateStr) ? 'bg-white' : 'bg-gray-50'}
      {dragOver ? 'ring-2 ring-inset ring-blue-400' : ''}"
    style={tintStyle}
    data-drop-date={dateStr}
    onclick={() => (ui.editor = { mode: 'new', date: dateStr })}
  >
    <div class="w-11 shrink-0 pt-0.5 text-center">
      <div class="text-[10px] font-medium uppercase text-gray-500">{weekdayName(date)}</div>
      <div
        class="mx-auto w-7 rounded-full text-base font-semibold
          {isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}"
      >
        {date.getDate()}
      </div>
    </div>
    <div class="min-w-0 flex-1 space-y-1 py-0.5">
      {#if mark}
        <span
          class="inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
        >
          {mark.label}
        </span>
      {/if}
      {#if !holiday && meetings.length > 0}
        <div class="text-[10px] font-medium text-slate-500">
          {meetings.map((m) => m.label ?? 'class').join(' · ')}
        </div>
      {/if}
      {#each acts as a (a.id)}
        <Chip kind="activity" item={a} size={34} />
      {/each}
      {#each asg as a (a.id)}
        <Chip kind="assigned" item={a} size={30} />
      {/each}
      {#each due as a (a.id)}
        <Chip kind="due" item={a} size={30} />
      {/each}
    </div>
  </div>
{/if}
