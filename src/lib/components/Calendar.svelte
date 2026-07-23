<script lang="ts">
  import { DAY_NAMES, monthShort, parseDate, weeksOf } from '../dates';
  import { store } from '../store.svelte';
  import DayCell from './DayCell.svelte';

  const s = $derived(store.schedule);
  const weeks = $derived(weeksOf(parseDate(s.course.term.start), parseDate(s.course.term.end)));
  const dayIdxs = $derived(s.view === '5day' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6]);

  function gutterMonth(week: Date[], i: number): string {
    if (i === 0) return monthShort(week[0]);
    const first = week.find((d) => d.getDate() === 1);
    return first ? monthShort(first) : '';
  }
</script>

<div
  class="grid"
  style="grid-template-columns: 3.5rem repeat({dayIdxs.length}, minmax(0, 1fr))"
>
  <!-- header row -->
  <div class="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50"></div>
  {#each dayIdxs as i (i)}
    <div
      class="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
    >
      {DAY_NAMES[i]}
    </div>
  {/each}

  {#each weeks as week, i (i)}
    <div class="border-b border-r border-gray-200 bg-gray-50 p-1 text-right">
      <div class="text-xs font-semibold text-gray-600">{gutterMonth(week, i)}</div>
      <div class="text-[10px] text-gray-400">W{i + 1}</div>
    </div>
    {#each dayIdxs as di (di)}
      <DayCell
        date={week[di]}
        extras={s.view === '5day' && di === 4 ? [week[5], week[6]] : []}
      />
    {/each}
  {/each}
</div>
