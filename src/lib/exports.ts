import type { Activity, Assignment, Schedule } from './types';
import { addDays, fmtDate, parseDate, shortDate, weekdayName, weeksOf } from './dates';
import { activitiesOn, assignedOn, dueOn, holidayLabel, meetingsOn } from './model';

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
