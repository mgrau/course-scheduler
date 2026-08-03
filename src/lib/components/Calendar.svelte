<script lang="ts">
  import { dayOrder, monthShort, parseDate, visibleDayIdxs, weeksOf } from '../dates';
  import { store } from '../store.svelte';
  import DayCell from './DayCell.svelte';

  const s = $derived(store.schedule);
  const weeks = $derived(
    weeksOf(parseDate(s.course.term.start), parseDate(s.course.term.end), s.weekStart),
  );
  const order = $derived(dayOrder(s.weekStart));
  const dayIdxs = $derived(visibleDayIdxs(s.view, s.weekStart));
  const lastIdx = $derived(dayIdxs[dayIdxs.length - 1]);

  /** Weekend days folded into the last visible cell in 5-day view. */
  function foldExtras(week: Date[]): Date[] {
    if (s.view !== '5day') return [];
    return s.weekStart === 'monday' ? [week[5], week[6]] : [week[6], week[0]];
  }

  function gutterMonth(week: Date[], i: number): string {
    if (i === 0) return monthShort(week[0]);
    const first = week.find((d) => d.getDate() === 1);
    return first ? monthShort(first) : '';
  }
</script>

<div class="cal-grid" style="--cols: {dayIdxs.length}">
  <!-- header row -->
  <div
    class="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-1 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
  >
    Wk
  </div>
  {#each dayIdxs as i (i)}
    <div
      class="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
    >
      {order[i]}
    </div>
  {/each}

  {#each weeks as week, i (i)}
    <div class="border-b border-r border-gray-200 bg-gray-50 p-1 text-right" data-week={i}>
      {#if gutterMonth(week, i)}
        <div class="text-base font-bold uppercase tracking-wide text-slate-700">
          {gutterMonth(week, i)}
        </div>
      {/if}
      <div class="text-xs font-semibold text-gray-500" title="Course week {i + 1}">{i + 1}</div>
    </div>
    {#each dayIdxs as di (di)}
      <DayCell date={week[di]} extras={di === lastIdx ? foldExtras(week) : []} />
    {/each}
  {/each}
</div>
