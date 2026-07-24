<script lang="ts">
  import { dayOrder, monthShort, parseDate, visibleDayIdxs, weeksOf } from '../dates';
  import { categoryColor } from '../model';
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

  // Threads connecting each assignment's "assigned" chip to its "due" chip.
  let container = $state<HTMLElement | null>(null);
  let threads = $state<{ d: string; color: string }[]>([]);

  function measureThreads() {
    const el = container;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const W = box.width;
    // Week-row bands, from the gutter cells.
    const bands = Array.from(el.querySelectorAll('[data-week]')).map((g) => {
      const r = g.getBoundingClientRect();
      return { top: r.top - box.top, bottom: r.bottom - box.top };
    });
    const rowOf = (y: number) => bands.findIndex((b) => y >= b.top && y <= b.bottom);

    const out: { d: string; color: string }[] = [];
    for (const a of s.assignments) {
      if (!a.assigned) continue;
      const from = el.querySelector(`[data-chip="assigned:${a.id}"]`);
      const to = el.querySelector(`[data-chip="due:${a.id}"]`);
      if (!from || !to) continue;
      const f = from.getBoundingClientRect();
      const t = to.getBoundingClientRect();
      const x1 = f.right - box.left;
      const y1 = f.top + f.height / 2 - box.top;
      const x2 = t.left - box.left;
      const y2 = t.top + t.height / 2 - box.top;
      const r1 = rowOf(y1);
      const r2 = rowOf(y2);

      // The thread runs parallel to the weeks: along the row, off the right
      // edge, and back in from the left on the next row — like text wrapping.
      let d: string;
      if (r1 === r2 || r1 === -1 || r2 === -1 || r2 < r1) {
        d =
          Math.abs(y2 - y1) < 4 || x2 - x1 < 28
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} H ${x2 - 16} C ${x2 - 7} ${y1}, ${x2 - 9} ${y2}, ${x2} ${y2}`;
      } else {
        const parts = [`M ${x1} ${y1} H ${W + 24}`];
        for (let k = r1 + 1; k < r2; k++) {
          parts.push(`M -24 ${bands[k].bottom - 12} H ${W + 24}`);
        }
        parts.push(`M -24 ${y2} H ${x2}`);
        d = parts.join(' ');
      }
      out.push({ d, color: categoryColor(s, a.category) });
    }
    threads = out;
  }

  $effect(() => {
    // Re-measure whenever anything in the schedule changes.
    JSON.stringify(s);
    const raf = requestAnimationFrame(measureThreads);
    return () => cancelAnimationFrame(raf);
  });

  $effect(() => {
    if (!container) return;
    const ro = new ResizeObserver(() => measureThreads());
    ro.observe(container);
    return () => ro.disconnect();
  });
</script>

<div class="relative" bind:this={container}>
<div
  class="grid"
  style="grid-template-columns: 4rem repeat({dayIdxs.length}, minmax(0, 1fr))"
>
  <!-- header row -->
  <div
    class="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-1 text-right text-xs font-semibold uppercase tracking-wide text-gray-400"
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
      <div class="text-xs font-semibold text-gray-400" title="Course week {i + 1}">{i + 1}</div>
    </div>
    {#each dayIdxs as di (di)}
      <DayCell date={week[di]} extras={di === lastIdx ? foldExtras(week) : []} />
    {/each}
  {/each}
</div>

<svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
  {#each threads as t, i (i)}
    <path
      d={t.d}
      fill="none"
      stroke={t.color}
      stroke-width="1.5"
      stroke-dasharray="5 4"
      stroke-linecap="round"
      opacity="0.65"
    />
  {/each}
</svg>
</div>
