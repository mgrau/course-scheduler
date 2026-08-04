import type { Activity, Assignment, Holiday, Meeting, Schedule } from './types';
import { addDays, fmtDate, parseDate, weekdayName } from './dates';

export function newId(): string {
  // crypto.randomUUID only exists in secure contexts; a LAN-served preview
  // (http://192.168.…) isn't one, so fall back to a random id there.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Clipboard write that also works outside secure contexts (LAN previews). */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

/** URL-friendly slug of a course title, for hash deep links. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function inTerm(s: Schedule, date: string): boolean {
  return date >= s.course.term.start && date <= s.course.term.end;
}

/** The holiday/marked-date entry covering this date, if any. */
export function dayMark(s: Schedule, date: string): Holiday | null {
  for (const h of s.holidays) {
    if (date >= h.start && date <= h.end) return h;
  }
  return null;
}

/** Label of any mark on this date (blocking or not). */
export function holidayLabel(s: Schedule, date: string): string | null {
  return dayMark(s, date)?.label ?? null;
}

/** Label of a class-cancelling holiday on this date, or null. */
export function blockingHoliday(s: Schedule, date: string): string | null {
  const h = dayMark(s, date);
  return h && h.blocks !== false ? h.label : null;
}

/** Meetings held on this date: weekday matches and the date is within the
 * meeting's own range (which defaults to the whole term). */
export function meetingsOn(s: Schedule, date: string): Meeting[] {
  const wd = weekdayName(parseDate(date));
  return s.meetings.filter(
    (m) =>
      m.days.includes(wd) &&
      date >= (m.from ?? s.course.term.start) &&
      date <= (m.until ?? s.course.term.end),
  );
}

/** A day class actually meets: in term, has a meeting, not cancelled. */
export function isClassDay(s: Schedule, date: string): boolean {
  return inTerm(s, date) && !blockingHoliday(s, date) && meetingsOn(s, date).length > 0;
}

export function categoryColor(s: Schedule, name?: string): string {
  return s.categories.find((c) => c.name === name)?.color ?? '#64748b';
}

export function activitiesOn(s: Schedule, date: string): Activity[] {
  return s.activities.filter((a) => a.date === date);
}

export function assignedOn(s: Schedule, date: string): Assignment[] {
  return s.assignments.filter((a) => a.assigned === date);
}

export function dueOn(s: Schedule, date: string): Assignment[] {
  return s.assignments.filter((a) => a.due === date);
}

export function unscheduled(s: Schedule): Activity[] {
  return s.activities.filter((a) => !a.date);
}

/** Why a date is questionable ("falls on Fall Break", "outside the term"), or null. */
export function dateConflict(s: Schedule, date?: string): string | null {
  if (!date) return null;
  if (!inTerm(s, date)) return 'outside the term';
  const h = blockingHoliday(s, date);
  if (h) return `falls on ${h}`;
  return null;
}

/** Stranded on a holiday (class cancelled) or outside the term. */
export function hasConflict(s: Schedule, a: Activity): boolean {
  return !!dateConflict(s, a.date);
}

export interface Conflict {
  kind: 'activity' | 'assignment';
  id: string;
  title: string;
  date: string;
  reason: string;
}

/** Everything scheduled somewhere questionable, for the header warning. */
export function findConflicts(s: Schedule): Conflict[] {
  const out: Conflict[] = [];
  for (const a of s.activities) {
    const reason = dateConflict(s, a.date);
    if (reason) out.push({ kind: 'activity', id: a.id, title: a.title, date: a.date!, reason });
  }
  for (const a of s.assignments) {
    const due = dateConflict(s, a.due);
    if (due) out.push({ kind: 'assignment', id: a.id, title: a.title, date: a.due, reason: `due ${due}` });
    const asg = dateConflict(s, a.assigned);
    if (asg)
      out.push({ kind: 'assignment', id: a.id, title: a.title, date: a.assigned!, reason: `assigned ${asg}` });
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

/** Lighten a hex color (mix toward white) — for tinted backgrounds. */
export function lighter(hex: string, amount = 0.8): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const c = [0, 2, 4]
    .map((i) => {
      const v = parseInt(m[1].slice(i, i + 2), 16);
      return Math.round(v + (255 - v) * amount);
    })
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${c}`;
}

/** Darken a hex color (mix toward black) — for colored text on white. */
export function darker(hex: string, amount = 0.45): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const c = [0, 2, 4]
    .map((i) => Math.round(parseInt(m[1].slice(i, i + 2), 16) * (1 - amount)))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${c}`;
}

/** A seasonal accent for well-known holidays, or null for plain gray. */
export function holidayTint(label: string): string | null {
  const l = label.toLowerCase();
  if (/spring/.test(l)) return '#ec4899'; // pink
  if (/thanksgiving/.test(l)) return '#f97316'; // orange
  if (/christmas|winter/.test(l)) return '#22c55e'; // green
  if (/labor/.test(l)) return '#ef4444'; // red
  if (/halloween/.test(l)) return '#f97316'; // orange
  if (/fall|autumn/.test(l)) return '#f59e0b'; // amber
  if (/mlk|martin luther/.test(l)) return '#8b5cf6'; // violet
  if (/election/.test(l)) return '#3b82f6'; // blue
  if (/juneteenth|independence|4th of july|july 4|memorial|veteran/.test(l)) return '#ef4444';
  if (/easter/.test(l)) return '#a855f7'; // lilac
  return null;
}

/** Move the entire schedule — term, holidays, and every dated item — by N days. */
export function shiftSchedule(s: Schedule, days: number) {
  const mv = (d: string) => fmtDate(addDays(parseDate(d), days));
  s.course.term.start = mv(s.course.term.start);
  s.course.term.end = mv(s.course.term.end);
  for (const h of s.holidays) {
    h.start = mv(h.start);
    h.end = mv(h.end);
  }
  for (const m of s.meetings) {
    if (m.from) m.from = mv(m.from);
    if (m.until) m.until = mv(m.until);
  }
  for (const a of s.activities) if (a.date) a.date = mv(a.date);
  for (const a of s.assignments) {
    a.due = mv(a.due);
    if (a.assigned) a.assigned = mv(a.assigned);
  }
}

/** Readable text color (white or near-black) for a hex background. */
export function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast of white vs. near-black text against this background.
  return (lum + 0.05) / 0.05 > 1.05 / (lum + 0.05) ? '#1e293b' : '#ffffff';
}
