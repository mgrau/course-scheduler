import type { Schedule } from './types';
import { newId } from './model';
import { fromYaml } from './yaml-io';

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Compact positional encoding (format v2). Optional fields are 0 when absent;
// categories are referenced by 1-based index; meeting days are a bitmask.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pack(s: Schedule): unknown[] {
  const ci = (name?: string) =>
    name ? s.categories.findIndex((c) => c.name === name) + 1 : 0;
  return [
    2,
    s.course.title,
    s.course.term.start,
    s.course.term.end,
    s.view === '5day' ? 1 : 0,
    s.weekStart === 'monday' ? 1 : 0,
    s.meetings.map((m) => [
      m.days.reduce((bits, d) => bits | (1 << DAYS.indexOf(d)), 0),
      m.start ?? 0,
      m.end ?? 0,
      m.label ?? 0,
    ]),
    s.holidays.map((h) => [h.start, h.end, h.label]),
    s.categories.map((c) => [c.name, c.color]),
    s.activities.map((a) => [a.title, a.date ?? 0, ci(a.category), a.description ?? 0]),
    s.assignments.map((a) => [
      a.title,
      a.due,
      a.assigned ?? 0,
      a.time ?? 0,
      ci(a.category),
      a.description ?? 0,
    ]),
  ];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function unpack(v: any[]): Schedule {
  const [, title, start, end, five, mon, meetings, holidays, cats, acts, asgs] = v;
  const categories = (cats as [string, string][]).map(([name, color]) => ({
    name: String(name),
    color: String(color),
  }));
  const cn = (i: number) => (i > 0 ? categories[i - 1]?.name : undefined);
  const str = (x: unknown) => (x === 0 || x == null ? undefined : String(x));
  return {
    course: { title: String(title), term: { start: String(start), end: String(end) } },
    view: five ? '5day' : '7day',
    weekStart: mon ? 'monday' : 'sunday',
    meetings: (meetings as any[]).map(([bits, ms, me, ml]) => ({
      days: DAYS.filter((_, i) => bits & (1 << i)),
      start: str(ms),
      end: str(me),
      label: str(ml),
    })),
    holidays: (holidays as any[]).map(([hs, he, hl]) => ({
      start: String(hs),
      end: String(he),
      label: String(hl),
    })),
    categories,
    activities: (acts as any[]).map(([t, d, c, ds]) => ({
      id: newId(),
      title: String(t),
      date: str(d),
      category: cn(c),
      description: str(ds),
    })),
    assignments: (asgs as any[]).map(([t, due, asg, time, c, ds]) => ({
      id: newId(),
      title: String(t),
      due: String(due),
      assigned: str(asg),
      time: str(time),
      category: cn(c),
      description: str(ds),
    })),
  } as Schedule;
}

/** Pack a schedule into a URL-hash-safe string (deflated compact JSON). */
export async function encodeShare(s: Schedule): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(pack(s)));
  return b64urlEncode(await pipe(json, new CompressionStream('deflate-raw')));
}

/** Inverse of encodeShare. Also reads v1 links (deflated YAML). */
export async function decodeShare(data: string): Promise<Schedule> {
  const bytes = await pipe(b64urlDecode(data), new DecompressionStream('deflate-raw'));
  const text = new TextDecoder().decode(bytes);
  if (text.startsWith('[')) {
    const v = JSON.parse(text);
    if (v[0] === 2) return unpack(v);
    throw new Error('This link was made by a newer version of the scheduler.');
  }
  return fromYaml(text);
}
