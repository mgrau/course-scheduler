export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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

/** Monday-based weekday index: Mon=0 … Sun=6 */
export function dayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function weekdayName(d: Date): string {
  return DAY_NAMES[dayIndex(d)];
}

export function mondayOf(d: Date): Date {
  return addDays(d, -dayIndex(d));
}

/** All Mon–Sun weeks covering [start, end]. */
export function weeksOf(start: Date, end: Date): Date[][] {
  const weeks: Date[][] = [];
  let d = mondayOf(start);
  while (d <= end) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    d = addDays(d, 7);
  }
  return weeks;
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
