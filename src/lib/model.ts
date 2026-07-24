import type { Activity, Assignment, Meeting, Schedule } from './types';
import { parseDate, weekdayName } from './dates';

export function newId(): string {
  return crypto.randomUUID();
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

export function holidayLabel(s: Schedule, date: string): string | null {
  for (const h of s.holidays) {
    if (date >= h.start && date <= h.end) return h.label;
  }
  return null;
}

/** Meetings whose weekday matches this date (ignores holidays/term). */
export function meetingsOn(s: Schedule, date: string): Meeting[] {
  const wd = weekdayName(parseDate(date));
  return s.meetings.filter((m) => m.days.includes(wd));
}

/** A day class actually meets: in term, has a meeting, not a holiday. */
export function isClassDay(s: Schedule, date: string): boolean {
  return inTerm(s, date) && !holidayLabel(s, date) && meetingsOn(s, date).length > 0;
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

/** Stranded on a holiday (class cancelled) or outside the term. */
export function hasConflict(s: Schedule, a: Activity): boolean {
  if (!a.date) return false;
  return !inTerm(s, a.date) || !!holidayLabel(s, a.date);
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
