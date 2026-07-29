import YAML from 'yaml';
import type { Schedule, ViewMode, WeekStart } from './types';
import { fmtDate } from './dates';
import { newId } from './model';

/** Drop undefined / empty-string fields so the YAML stays clean. */
function clean<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out as Partial<T>;
}

export function toYaml(s: Schedule): string {
  const doc = {
    course: s.course,
    view: s.view,
    weekStart: s.weekStart,
    meetings: s.meetings.map((m) => clean(m)),
    holidays: s.holidays.map((h) =>
      h.start === h.end ? { date: h.start, label: h.label } : { ...h },
    ),
    categories: s.categories,
    activities: s.activities.map(({ id, ...rest }) => clean(rest)),
    assignments: s.assignments.map(({ id, ...rest }) => clean(rest)),
  };
  return YAML.stringify(doc);
}

/** Coerce YAML scalars (string or Date) to YYYY-MM-DD. */
function dstr(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (v instanceof Date) return fmtDate(v);
  return String(v);
}

export function fromYaml(text: string): Schedule {
  const raw = YAML.parse(text);
  if (!raw || typeof raw !== 'object') throw new Error('File does not contain a YAML mapping.');

  const title = raw.course?.title;
  const termStart = dstr(raw.course?.term?.start);
  const termEnd = dstr(raw.course?.term?.end);
  if (!title || !termStart || !termEnd) {
    throw new Error('YAML must define course.title, course.term.start, and course.term.end.');
  }

  const view: ViewMode = raw.view === '5day' ? '5day' : '7day';
  const weekStart: WeekStart = raw.weekStart === 'monday' ? 'monday' : 'sunday';

  const holidays = (raw.holidays ?? []).map((h: any) => {
    const start = dstr(h.date ?? h.start);
    if (!start) throw new Error(`Holiday "${h.label ?? '?'}" needs a date or start.`);
    return { start, end: dstr(h.end ?? h.date ?? h.start)!, label: String(h.label ?? 'Holiday') };
  });

  const activities = (raw.activities ?? []).map((a: any) => {
    if (!a.title) throw new Error('Every activity needs a title.');
    return clean({
      id: newId(),
      title: String(a.title),
      description: a.description ? String(a.description) : undefined,
      category: a.category ? String(a.category) : undefined,
      date: dstr(a.date),
      reusable: a.reusable ? true : undefined,
    });
  });

  const assignments = (raw.assignments ?? []).map((a: any) => {
    const due = dstr(a.due);
    if (!a.title || !due) throw new Error('Every assignment needs a title and a due date.');
    return clean({
      id: newId(),
      title: String(a.title),
      description: a.description ? String(a.description) : undefined,
      category: a.category ? String(a.category) : undefined,
      assigned: dstr(a.assigned),
      due,
      time: a.time ? String(a.time) : undefined,
    });
  });

  const meetings = (raw.meetings ?? []).map((m: any) => ({
    days: (m.days ?? []).map(String),
    start: m.start ? String(m.start) : undefined,
    end: m.end ? String(m.end) : undefined,
    label: m.label ? String(m.label) : undefined,
  }));

  const categories = (raw.categories ?? []).map((c: any) => ({
    name: String(c.name ?? ''),
    color: String(c.color ?? '#64748b'),
  }));

  return {
    course: { title: String(title), term: { start: termStart, end: termEnd } },
    view,
    weekStart,
    meetings,
    holidays,
    categories,
    activities,
    assignments,
  } as Schedule;
}
