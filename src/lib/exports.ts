import type { Activity, Assignment, Schedule } from './types';
import { addDays, fmtDate, parseDate, shortDate, weekdayName, weeksOf } from './dates';
import {
  activitiesOn,
  assignedOn,
  categoryColor,
  darker,
  dueOn,
  holidayLabel,
  lighter,
  meetingsOn,
} from './model';

export type TableStyle = 'meeting' | 'week';

interface DayRow {
  d: Date;
  holiday: string | null;
  activities: Activity[];
  assigned: Assignment[];
  due: Assignment[];
}

/** Days worth a table row: class days, plus any day with items or a holiday on a meeting weekday. */
function dayRows(s: Schedule): DayRow[] {
  const rows: DayRow[] = [];
  const end = parseDate(s.course.term.end);
  for (let d = parseDate(s.course.term.start); d <= end; d = addDays(d, 1)) {
    const date = fmtDate(d);
    const holiday = holidayLabel(s, date);
    const activities = activitiesOn(s, date);
    const assigned = assignedOn(s, date);
    const due = dueOn(s, date);
    const meets = meetingsOn(s, date).length > 0;
    if (meets || activities.length || assigned.length || due.length) {
      rows.push({ d: new Date(d), holiday, activities, assigned, due });
    }
  }
  return rows;
}

interface WeekRow {
  n: number;
  start: Date;
  end: Date;
  activities: string[];
  due: string[];
}

function weekRows(s: Schedule): WeekRow[] {
  const weeks = weeksOf(parseDate(s.course.term.start), parseDate(s.course.term.end), s.weekStart);
  return weeks.map((week, i) => {
    const activities: string[] = [];
    const due: string[] = [];
    for (const d of week) {
      const date = fmtDate(d);
      const wd = weekdayName(d);
      const holiday = holidayLabel(s, date);
      if (holiday && meetingsOn(s, date).length > 0) activities.push(`${wd}: ${holiday} (no class)`);
      for (const a of activitiesOn(s, date)) activities.push(`${wd}: ${a.title}`);
      for (const a of dueOn(s, date)) due.push(`${a.title} (${wd}${a.time ? ' ' + a.time : ''})`);
    }
    return { n: i + 1, start: week[0], end: week[6], activities, due };
  });
}

function dueLabel(a: Assignment): string {
  return a.time ? `${a.title} (${a.time})` : a.title;
}

// ---------- Markdown ----------

function mdEscape(t: string): string {
  return t.replace(/\|/g, '\\|');
}

export function toMarkdown(s: Schedule, style: TableStyle): string {
  const lines: string[] = [`# ${s.course.title}`, ''];
  if (style === 'meeting') {
    lines.push('| Date | Day | Activities | Assigned | Due |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const r of dayRows(s)) {
      const acts = r.holiday
        ? `*No class — ${r.holiday}*`
        : r.activities.map((a) => mdEscape(a.title)).join('; ');
      const asg = r.assigned.map((a) => mdEscape(a.title)).join('; ');
      const due = r.due.map((a) => mdEscape(dueLabel(a))).join('; ');
      lines.push(`| ${shortDate(r.d)} | ${weekdayName(r.d)} | ${acts} | ${asg} | ${due} |`);
    }
  } else {
    lines.push('| Week | Dates | Activities | Due |');
    lines.push('| --- | --- | --- | --- |');
    for (const w of weekRows(s)) {
      lines.push(
        `| ${w.n} | ${shortDate(w.start)} – ${shortDate(w.end)} | ${w.activities
          .map(mdEscape)
          .join('; ')} | ${w.due.map(mdEscape).join('; ')} |`,
      );
    }
  }
  return lines.join('\n') + '\n';
}

// ---------- LaTeX ----------

function texEscape(t: string): string {
  return t
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export function toLatex(s: Schedule, style: TableStyle): string {
  const lines: string[] = [
    `% ${s.course.title} — course schedule`,
    '% Requires: \\usepackage{longtable} \\usepackage{booktabs}',
  ];
  if (style === 'meeting') {
    lines.push('\\begin{longtable}{@{}llp{0.32\\linewidth}p{0.16\\linewidth}p{0.16\\linewidth}@{}}');
    lines.push('\\toprule');
    lines.push('Date & Day & Activities & Assigned & Due \\\\');
    lines.push('\\midrule');
    lines.push('\\endhead');
    for (const r of dayRows(s)) {
      const acts = r.holiday
        ? `\\emph{No class — ${texEscape(r.holiday)}}`
        : r.activities.map((a) => texEscape(a.title)).join('; ');
      const asg = r.assigned.map((a) => texEscape(a.title)).join('; ');
      const due = r.due.map((a) => texEscape(dueLabel(a))).join('; ');
      lines.push(
        `${shortDate(r.d)} & ${weekdayName(r.d)} & ${acts} & ${asg} & ${due} \\\\`,
      );
    }
  } else {
    lines.push('\\begin{longtable}{@{}clp{0.42\\linewidth}p{0.28\\linewidth}@{}}');
    lines.push('\\toprule');
    lines.push('Week & Dates & Activities & Due \\\\');
    lines.push('\\midrule');
    lines.push('\\endhead');
    for (const w of weekRows(s)) {
      lines.push(
        `${w.n} & ${shortDate(w.start)} -- ${shortDate(w.end)} & ${w.activities
          .map(texEscape)
          .join('; ')} & ${w.due.map(texEscape).join('; ')} \\\\`,
      );
    }
  }
  lines.push('\\bottomrule');
  lines.push('\\end{longtable}');
  return lines.join('\n') + '\n';
}

// ---------- HTML (for pasting into Canvas / LMS pages) ----------
//
// Canvas's rich-content editor strips <style> blocks and class attributes,
// so everything is expressed as inline styles on plain table markup.

function htmlEscape(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TD = 'border:1px solid #d1d5db;padding:4px 8px;vertical-align:top;text-align:left';
const TH = `${TD};background:#f3f4f6;font-weight:bold`;

function chip(s: Schedule, title: string, category: string | undefined, bold = false): string {
  const c = categoryColor(s, category);
  return (
    `<span style="background:${lighter(c, 0.6)};color:${darker(c, 0.5)};` +
    `padding:1px 6px;border-radius:4px;white-space:nowrap${bold ? ';font-weight:bold' : ''}">` +
    `${htmlEscape(title)}</span>`
  );
}

export function toHtml(s: Schedule, style: TableStyle): string {
  const caption =
    style === 'meeting'
      ? `Course schedule for ${s.course.title}: activities and assignments for each class day.`
      : `Course schedule for ${s.course.title}: activities and assignment due dates by week.`;
  const lines: string[] = [
    `<table style="border-collapse:collapse">`,
    `<caption style="padding:4px 8px;text-align:left;font-weight:bold">${htmlEscape(caption)}</caption>`,
  ];
  if (style === 'meeting') {
    lines.push(
      `<thead><tr><th scope="col" style="${TH}">Date</th><th scope="col" style="${TH}">Day</th>` +
        `<th scope="col" style="${TH}">Activities</th><th scope="col" style="${TH}">Assigned</th>` +
        `<th scope="col" style="${TH}">Due</th></tr></thead>`,
    );
    lines.push('<tbody>');
    for (const r of dayRows(s)) {
      const acts = r.holiday
        ? `<em style="color:#6b7280">No class &mdash; ${htmlEscape(r.holiday)}</em>`
        : r.activities.map((a) => chip(s, a.title, a.category)).join('<br>');
      const asg = r.assigned.map((a) => chip(s, `${a.title} →`, a.category)).join('<br>');
      const due = r.due
        .map((a) => chip(s, `→ ${dueLabel(a)}`, a.category, true))
        .join('<br>');
      lines.push(
        `<tr><td style="${TD};white-space:nowrap">${shortDate(r.d)}</td>` +
          `<td style="${TD}">${weekdayName(r.d)}</td>` +
          `<td style="${TD}">${acts}</td><td style="${TD}">${asg}</td>` +
          `<td style="${TD}">${due}</td></tr>`,
      );
    }
  } else {
    lines.push(
      `<thead><tr><th scope="col" style="${TH}">Week</th><th scope="col" style="${TH}">Dates</th>` +
        `<th scope="col" style="${TH}">Activities</th><th scope="col" style="${TH}">Due</th></tr></thead>`,
    );
    lines.push('<tbody>');
    for (const w of weekRows(s)) {
      lines.push(
        `<tr><td style="${TD};text-align:center">${w.n}</td>` +
          `<td style="${TD};white-space:nowrap">${shortDate(w.start)} &ndash; ${shortDate(w.end)}</td>` +
          `<td style="${TD}">${w.activities.map(htmlEscape).join('<br>')}</td>` +
          `<td style="${TD}">${w.due.map(htmlEscape).join('<br>')}</td></tr>`,
      );
    }
  }
  lines.push('</tbody>');
  lines.push('</table>');
  return lines.join('\n') + '\n';
}
