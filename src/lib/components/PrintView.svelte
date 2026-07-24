<script lang="ts">
  import {
    dayOrder,
    fmtDate,
    lastOfMonth,
    monthLabel,
    monthsOf,
    parseDate,
    sameMonth,
    visibleDayIdxs,
    weekNumber,
    weeksOf,
  } from '../dates';
  import {
    activitiesOn,
    assignedOn,
    categoryColor,
    dueOn,
    holidayLabel,
    inTerm,
    meetingsOn,
    unscheduled,
  } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';

  const s = $derived(store.schedule);
  const termStart = $derived(parseDate(s.course.term.start));
  const termEnd = $derived(parseDate(s.course.term.end));
  const months = $derived(monthsOf(termStart, termEnd));
  const order = $derived(dayOrder(s.weekStart));
  const dayIdxs = $derived(visibleDayIdxs(s.view, s.weekStart));
  const cards = $derived(unscheduled(s));

  /** Weeks of a month that contain at least one in-term day of that month. */
  function monthWeeks(month: Date): Date[][] {
    return weeksOf(month, lastOfMonth(month), s.weekStart).filter((week) =>
      week.some((d) => sameMonth(d, month) && inTerm(s, fmtDate(d))),
    );
  }

  const maxWeeks = $derived(Math.max(1, ...months.map((m) => monthWeeks(m).length)));

  // Week rows are the same height on every page: the month with the most
  // weeks fills the printable letter-landscape height, the rest are shorter.
  const TABLE_MM = 180;
  const HEADER_MM = 6;
  function tableHeightMm(nWeeks: number): number {
    return HEADER_MM + ((TABLE_MM - HEADER_MM) / maxWeeks) * nWeeks;
  }
</script>

<div class="print-only">
  {#if ui.printOpts.calendar}
    {#each months as month (fmtDate(month))}
      {@const weeks = monthWeeks(month)}
      <section class="page">
        <h1 class="mb-2 text-xl font-bold">
          {s.course.title} — {monthLabel(month)}
        </h1>
        <table
          class="month-table w-full table-fixed border-collapse"
          style="height: {tableHeightMm(weeks.length).toFixed(1)}mm"
        >
          <thead>
            <tr>
              <th class="w-8 border border-gray-400 bg-gray-100 px-1 py-0.5 text-center text-[10px] uppercase">
                Wk
              </th>
              {#each dayIdxs as i (i)}
                <th class="border border-gray-400 bg-gray-100 px-1 py-0.5 text-left text-[10px] uppercase">
                  {order[i]}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each weeks as week (fmtDate(week[0]))}
              <tr>
                <td
                  class="border border-gray-400 bg-gray-100 p-1 text-center align-middle text-sm font-bold text-gray-500"
                >
                  {weekNumber(week[0], termStart, s.weekStart)}
                </td>
                {#each dayIdxs as i (i)}
                  {@const d = week[i]}
                  {@const dateStr = fmtDate(d)}
                  {@const visible = sameMonth(d, month) && inTerm(s, dateStr)}
                  {@const holiday = visible ? holidayLabel(s, dateStr) : null}
                  <td
                    class="h-24 border border-gray-400 p-1 align-top text-[10px]
                      {!visible ? 'bg-gray-100' : holiday ? 'bg-gray-200' : ''}"
                  >
                    {#if visible}
                      <div class="flex justify-between font-semibold">
                        <span>{d.getDate()}</span>
                        {#if !holiday && meetingsOn(s, dateStr).length > 0}
                          <span class="font-normal text-gray-500">
                            {meetingsOn(s, dateStr)
                              .map((m) => m.label ?? '')
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        {/if}
                      </div>
                      {#if holiday}
                        <div class="italic text-gray-600">{holiday}</div>
                      {/if}
                      <div class="mt-0.5 space-y-0.5">
                        {#each activitiesOn(s, dateStr) as a (a.id)}
                          <div
                            class="rounded px-1 py-0.5 font-medium text-white"
                            style="background-color: {categoryColor(s, a.category)}"
                          >
                            {a.title}
                          </div>
                        {/each}
                        {#each assignedOn(s, dateStr) as a (a.id)}
                          <div
                            class="rounded border border-dashed bg-white px-1 py-0.5"
                            style="border-color: {categoryColor(s, a.category)}; color: {categoryColor(
                              s,
                              a.category,
                            )}"
                          >
                            ⇢ {a.title}
                          </div>
                        {/each}
                        {#each dueOn(s, dateStr) as a (a.id)}
                          <div
                            class="rounded border-2 bg-white px-1 py-0.5 font-semibold"
                            style="border-color: {categoryColor(s, a.category)}; color: {categoryColor(
                              s,
                              a.category,
                            )}"
                          >
                            {a.title} due{a.time ? ` ${a.time}` : ''}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/each}
  {/if}

  {#if ui.printOpts.cards && cards.length > 0}
    <section class="page">
      <h1 class="mb-2 text-xl font-bold">{s.course.title} — unscheduled activities</h1>
      <p class="mb-3 text-xs text-gray-500">Cut out along the dashed lines.</p>
      <div class="grid grid-cols-4">
        {#each cards as a (a.id)}
          <div class="min-h-28 border border-dashed border-gray-500 p-2">
            <div class="flex items-center gap-1.5">
              <span
                class="inline-block h-3 w-3 shrink-0 rounded-full"
                style="background-color: {categoryColor(s, a.category)}"
              ></span>
              <span class="text-sm font-bold">{a.title}</span>
            </div>
            {#if a.category}
              <div class="mt-0.5 text-[9px] uppercase tracking-wide text-gray-500">
                {a.category}
              </div>
            {/if}
            {#if a.description}
              <div class="mt-1 text-[10px] leading-snug">{a.description}</div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
