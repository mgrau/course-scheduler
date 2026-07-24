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
    darker,
    lighter,
    meetingsOn,
    textOn,
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
  const PAGE_W_MM = 259; // letter landscape width minus 10mm margins
  const WK_COL_MM = 8.5;

  function tableHeightMm(nWeeks: number): number {
    return HEADER_MM + ((TABLE_MM - HEADER_MM) / maxWeeks) * nWeeks;
  }

  // Cut-out cards match the size of a printed calendar day cell.
  const rowHmm = $derived((TABLE_MM - HEADER_MM) / maxWeeks);
  const cardWmm = $derived((PAGE_W_MM - WK_COL_MM) / dayIdxs.length);

  // Pack months onto pages: short months (orphaned first/last weeks of the
  // term) share a page when their weeks plus a one-row header allowance per
  // extra month fit within the tallest month's week count.
  const pages = $derived.by(() => {
    const bins: { months: Date[]; weeks: number }[] = [];
    for (const m of months) {
      const w = monthWeeks(m).length;
      const bin = bins.find((b) => b.weeks + w + 1 <= maxWeeks);
      if (bin) {
        bin.months.push(m);
        bin.weeks += w;
      } else {
        bins.push({ months: [m], weeks: w });
      }
    }
    return bins.map((b) => b.months);
  });
</script>

<div class="print-only">
  {#if ui.printOpts.calendar}
    {#each pages as pageMonths, pi (pi)}
      <section class="page month-page">
        {#each pageMonths as month (fmtDate(month))}
          {@const weeks = monthWeeks(month)}
          <div>
            <div class="mb-2 flex items-baseline justify-between border-b-2 border-slate-700 pb-1">
              <h1 class="text-2xl font-bold text-slate-800">{monthLabel(month)}</h1>
              <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">
                {s.course.title}
              </span>
            </div>
            <table
              class="w-full table-fixed border-collapse"
              style="height: {tableHeightMm(weeks.length).toFixed(1)}mm"
            >
              <thead>
                <tr>
                  <th class="w-8 border border-slate-700 bg-slate-700 px-1 py-0.5 text-center text-[10px] uppercase text-white">
                    Wk
                  </th>
                  {#each dayIdxs as i (i)}
                    <th class="border border-slate-700 bg-slate-700 px-1 py-0.5 text-left text-[10px] uppercase tracking-wide text-white">
                      {order[i]}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each weeks as week (fmtDate(week[0]))}
                  <tr style="height: {rowHmm.toFixed(1)}mm">
                    <td
                      class="border border-gray-400 bg-slate-50 p-1 text-center align-middle text-sm font-bold text-slate-400"
                    >
                      {weekNumber(week[0], termStart, s.weekStart)}
                    </td>
                    {#each dayIdxs as i (i)}
                      {@const d = week[i]}
                      {@const dateStr = fmtDate(d)}
                      {@const visible = sameMonth(d, month) && inTerm(s, dateStr)}
                      {@const holiday = visible ? holidayLabel(s, dateStr) : null}
                      {@const wknd = d.getDay() === 0 || d.getDay() === 6}
                      <td
                        class="border border-gray-400 p-1 align-top text-[10px]
                          {!visible
                          ? 'bg-gray-100'
                          : holiday
                            ? 'stripes bg-gray-100'
                            : wknd
                              ? 'bg-slate-50'
                              : ''}"
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
                            <div
                              class="mt-0.5 inline-block rounded bg-white/80 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-gray-500"
                            >
                              {holiday}
                            </div>
                          {/if}
                          <div class="mt-0.5 space-y-0.5">
                            {#each activitiesOn(s, dateStr) as a (a.id)}
                              <div
                                class="rounded px-1 py-0.5 font-medium"
                                style="background-color: {categoryColor(s, a.category)}; color: {textOn(
                                  categoryColor(s, a.category),
                                )}"
                              >
                                {a.title}
                              </div>
                            {/each}
                            {#each assignedOn(s, dateStr) as a (a.id)}
                              <div
                                class="flex items-center gap-1 rounded border border-dashed bg-white px-1 py-0.5"
                                style="border-color: {categoryColor(s, a.category)}; color: {darker(
                                  categoryColor(s, a.category),
                                )}"
                              >
                                <span class="truncate">{a.title}</span>
                                <span class="ml-auto shrink-0">→</span>
                              </div>
                            {/each}
                            {#each dueOn(s, dateStr) as a (a.id)}
                              <div
                                class="flex items-center gap-1 rounded border-2 bg-white px-1 py-0.5 font-semibold"
                                style="border-color: {categoryColor(s, a.category)}; color: {darker(
                                  categoryColor(s, a.category),
                                )}"
                              >
                                <span class="shrink-0">→</span>
                                <span class="truncate">
                                  {a.title} due{a.time ? ` ${a.time}` : ''}
                                </span>
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
          </div>
        {/each}
      </section>
    {/each}
  {/if}

  {#if ui.printOpts.cards && cards.length > 0}
    <section class="page">
      <div class="mb-2 flex items-baseline justify-between border-b-2 border-slate-700 pb-1">
        <h1 class="text-2xl font-bold text-slate-800">Unscheduled activities</h1>
        <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {s.course.title}
        </span>
      </div>
      <p class="mb-3 text-xs text-gray-500">
        Cut out along the dashed lines — each card is the size of a calendar day.
      </p>
      <div class="flex flex-wrap gap-[2mm]">
        {#each cards as a (a.id)}
          {@const color = categoryColor(s, a.category)}
          <div
            class="overflow-hidden rounded-lg border border-dashed border-gray-500 p-2"
            style="width: {cardWmm.toFixed(1)}mm; height: {rowHmm.toFixed(1)}mm; background-color: {lighter(
              color,
            )}"
          >
            <div class="text-sm font-bold leading-tight" style="color: {darker(color)}">
              {a.title}
            </div>
            {#if a.category}
              <div class="text-[9px] uppercase tracking-wide" style="color: {darker(color)}">
                {a.category}
              </div>
            {/if}
            {#if a.description}
              <div class="mt-1 text-[10px] leading-snug text-gray-800">{a.description}</div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
