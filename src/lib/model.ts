import type { Activity, Assignment, Meeting, Schedule } from './types';
import { parseDate, weekdayName } from './dates';

export function newId(): string {
  return crypto.randomUUID();
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

/** Scheduled on a day class doesn't meet (holiday added later, etc.). */
export function hasConflict(s: Schedule, a: Activity): boolean {
  return !!a.date && !isClassDay(s, a.date);
}
