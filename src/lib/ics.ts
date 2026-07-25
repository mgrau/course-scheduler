import type { Schedule } from './types';
import { addDays, fmtDate, parseDate, weekdayName } from './dates';
import { holidayLabel, slugify } from './model';

const BYDAY: Record<string, string> = {
  Mon: 'MO',
  Tue: 'TU',
  Wed: 'WE',
  Thu: 'TH',
  Fri: 'FR',
  Sat: 'SA',
  Sun: 'SU',
};

function esc(t: string): string {
  return t
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** 2026-08-24 (+ 10:00) → 20260824 / 20260824T100000 (floating local time). */
function dt(date: string, time?: string): string {
  const d = date.replace(/-/g, '');
  return time ? `${d}T${time.replace(':', '')}00` : d;
}

/** RFC 5545 line folding at 74 chars. */
function fold(line: string): string {
  const out: string[] = [];
  while (line.length > 74) {
    out.push(line.slice(0, 74));
    line = ' ' + line.slice(74);
  }
  out.push(line);
  return out.join('\r\n');
}

export function toIcs(s: Schedule): string {
  const lines: string[] = [];
  const push = (l: string) => lines.push(fold(l));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const uidBase = slugify(s.course.title) || 'course';
  const end = parseDate(s.course.term.end);

  push('BEGIN:VCALENDAR');
  push('VERSION:2.0');
  push('PRODID:-//course-scheduler//EN');
  push('CALSCALE:GREGORIAN');
  push(`X-WR-CALNAME:${esc(s.course.title)}`);

  // Class meetings as weekly recurring events, holidays excluded.
  s.meetings.forEach((m, mi) => {
    if (m.days.length === 0) return;
    let d = parseDate(s.course.term.start);
    while (d <= end && !m.days.includes(weekdayName(d))) d = addDays(d, 1);
    if (d > end) return;
    const first = fmtDate(d);
    const timed = !!m.start;

    push('BEGIN:VEVENT');
    push(`UID:${uidBase}-meeting-${mi}@course-scheduler`);
    push(`DTSTAMP:${stamp}`);
    if (timed) {
      push(`DTSTART:${dt(first, m.start)}`);
      if (m.end) push(`DTEND:${dt(first, m.end)}`);
    } else {
      push(`DTSTART;VALUE=DATE:${dt(first)}`);
    }
    const until = timed ? `${dt(s.course.term.end)}T235959` : dt(s.course.term.end);
    push(
      `RRULE:FREQ=WEEKLY;BYDAY=${m.days.map((x) => BYDAY[x]).join(',')};UNTIL=${until}`,
    );
    const exdates: string[] = [];
    for (let dd = parseDate(first); dd <= end; dd = addDays(dd, 1)) {
      const ds = fmtDate(dd);
      if (m.days.includes(weekdayName(dd)) && holidayLabel(s, ds)) {
        exdates.push(timed ? dt(ds, m.start) : dt(ds));
      }
    }
    if (exdates.length) push(`EXDATE${timed ? '' : ';VALUE=DATE'}:${exdates.join(',')}`);
    push(`SUMMARY:${esc(m.label ? `${s.course.title} — ${m.label}` : s.course.title)}`);
    push('END:VEVENT');
  });

  // Scheduled activities as all-day events.
  s.activities
    .filter((a) => a.date)
    .forEach((a, i) => {
      push('BEGIN:VEVENT');
      push(`UID:${uidBase}-act-${i}@course-scheduler`);
      push(`DTSTAMP:${stamp}`);
      push(`DTSTART;VALUE=DATE:${dt(a.date!)}`);
      push(`SUMMARY:${esc(a.title)}`);
      if (a.description) push(`DESCRIPTION:${esc(a.description)}`);
      if (a.category) push(`CATEGORIES:${esc(a.category)}`);
      push('END:VEVENT');
    });

  // Assignments as events on their due date.
  s.assignments.forEach((a, i) => {
    push('BEGIN:VEVENT');
    push(`UID:${uidBase}-due-${i}@course-scheduler`);
    push(`DTSTAMP:${stamp}`);
    if (a.time) push(`DTSTART:${dt(a.due, a.time)}`);
    else push(`DTSTART;VALUE=DATE:${dt(a.due)}`);
    push(`SUMMARY:${esc(`${a.title} due`)}`);
    const notes = [a.description, a.assigned ? `Assigned: ${a.assigned}` : '']
      .filter(Boolean)
      .join('\n');
    if (notes) push(`DESCRIPTION:${esc(notes)}`);
    if (a.category) push(`CATEGORIES:${esc(a.category)}`);
    push('END:VEVENT');
  });

  push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
