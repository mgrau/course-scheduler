import type { ViewMode, WeekStart } from './types';

/** Indexed by Date.getDay() */
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Parse YYYY-MM-DD as a local date. */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function weekdayName(d: Date): string {
  return WEEKDAYS[d.getDay()];
}

/** Weekday names in display order for the chosen week start. */
export function dayOrder(ws: WeekStart): string[] {
  return ws === 'monday'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/** Which indices of a week row are visible for a view mode. */
export function visibleDayIdxs(view: ViewMode, ws: WeekStart): number[] {
  if (view === '7day') return [0, 1, 2, 3, 4, 5, 6];
  return ws === 'monday' ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 5];
}

export function startOfWeek(d: Date, ws: WeekStart): Date {
  const first = ws === 'monday' ? 1 : 0;
  return addDays(d, -((d.getDay() - first + 7) % 7));
}

/** All weeks (7 dates each, in display order) covering [start, end]. */
export function weeksOf(start: Date, end: Date, ws: WeekStart): Date[][] {
  const weeks: Date[][] = [];
  let d = startOfWeek(start, ws);
  while (d <= end) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    d = addDays(d, 7);
  }
  return weeks;
}

/** 1-based course week number of the week containing d. */
export function weekNumber(d: Date, termStart: Date, ws: WeekStart): number {
  const a = startOfWeek(d, ws).getTime();
  const b = startOfWeek(termStart, ws).getTime();
  return Math.round((a - b) / (7 * 86400000)) + 1;
}

export function monthLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthShort(d: Date): string {
  return MONTHS_SHORT[d.getMonth()];
}

export function shortDate(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** First-of-month dates for every month overlapping [start, end]. */
export function monthsOf(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let d = firstOfMonth(start);
  while (d <= end) {
    months.push(d);
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return months;
}

export function todayStr(): string {
  return fmtDate(new Date());
}
