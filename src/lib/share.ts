import type { Schedule } from './types';
import { addDays, fmtDate, parseDate } from './dates';
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


/*
 * Compact positional encoding, format v4.
 * - Dates are day offsets from the term start (ints); optional dates are
 *   offset+1 with 0 = absent, falling back to ISO strings for the rare
 *   out-of-term date whose offset would collide with the sentinel.
 * - Times are minutes+1 (0 = absent); colors drop the leading '#';
 *   categories are 1-based indices; meeting days are a bitmask.
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* eslint-disable @typescript-eslint/no-explicit-any */

function pack(s: Schedule): unknown[] {
  const t0 = parseDate(s.course.term.start);
  const off = (d: string) => Math.round((parseDate(d).getTime() - t0.getTime()) / 86400000);
  const optDate = (d?: string) => (d ? (off(d) >= 0 ? off(d) + 1 : d) : 0);
  const optMin = (t?: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m + 1;
  };
  const ci = (name?: string) =>
    name ? s.categories.findIndex((c) => c.name === name) + 1 : 0;
  return [
    4,
    s.course.title,
    s.course.term.start,
    off(s.course.term.end),
    s.view === '5day' ? 1 : 0,
    s.weekStart === 'monday' ? 1 : 0,
    s.meetings.map((m) => [
      m.days.reduce((bits, d) => bits | (1 << DAYS.indexOf(d)), 0),
      optMin(m.start),
      optMin(m.end),
      m.label ?? 0,
      optDate(m.from),
      optDate(m.until),
    ]),
    s.holidays.map((h) => [off(h.start), off(h.end), h.label, h.blocks === false ? 1 : 0]),
    s.categories.map((c) => [c.name, c.color.replace(/^#/, '')]),
    s.activities.map((a) => [
      a.title,
      optDate(a.date),
      ci(a.category),
      a.description ?? 0,
      a.reusable ? 1 : 0,
    ]),
    s.assignments.map((a) => [
      a.title,
      off(a.due),
      optDate(a.assigned),
      optMin(a.time),
      ci(a.category),
      a.description ?? 0,
    ]),
  ];
}

function unpack(v: any[]): Schedule {
  const [, title, start, endOff, five, mon, meetings, holidays, cats, acts, asgs] = v;
  const t0 = parseDate(String(start));
  const date = (n: number) => fmtDate(addDays(t0, n));
  const optDate = (x: unknown) =>
    typeof x === 'string' ? x : (x as number) > 0 ? date((x as number) - 1) : undefined;
  const optMin = (n: number) => {
    if (n <= 0) return undefined;
    const m = n - 1;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  const categories = (cats as [string, string][]).map(([name, color]) => ({
    name: String(name),
    color: /^[0-9a-f]{3,8}$/i.test(color) ? `#${color}` : String(color),
  }));
  const cn = (i: number) => (i > 0 ? categories[i - 1]?.name : undefined);
  const str = (x: unknown) => (x === 0 || x == null ? undefined : String(x));
  return {
    course: { title: String(title), term: { start: String(start), end: date(Number(endOff)) } },
    view: five ? '5day' : '7day',
    weekStart: mon ? 'monday' : 'sunday',
    meetings: (meetings as any[]).map(([bits, ms, me, ml, mf, mu]) => ({
      days: DAYS.filter((_, i) => bits & (1 << i)),
      start: optMin(ms),
      end: optMin(me),
      label: str(ml),
      from: optDate(mf ?? 0),
      until: optDate(mu ?? 0),
    })),
    holidays: (holidays as any[]).map(([hs, he, hl, nb]) => ({
      start: date(Number(hs)),
      end: date(Number(he)),
      label: String(hl),
      ...(nb ? { blocks: false as const } : {}),
    })),
    categories,
    activities: (acts as any[]).map(([t, d, c, ds, re]) => ({
      id: newId(),
      title: String(t),
      date: optDate(d),
      category: cn(c),
      description: str(ds),
      reusable: re ? true : undefined,
    })),
    assignments: (asgs as any[]).map(([t, due, asg, time, c, ds]) => ({
      id: newId(),
      title: String(t),
      due: date(Number(due)),
      assigned: optDate(asg),
      time: optMin(time),
      category: cn(c),
      description: str(ds),
    })),
  } as Schedule;
}

/** v2 decoder (kept for older links): ISO dates, HH:MM times, #hex colors. */
function unpackV2(v: any[]): Schedule {
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

/** Inverse of encodeShare. Also reads v1 (YAML) and v2 links. */
export async function decodeShare(data: string): Promise<Schedule> {
  const bytes = await pipe(b64urlDecode(data), new DecompressionStream('deflate-raw'));
  const text = new TextDecoder().decode(bytes);
  if (text.startsWith('[')) {
    const v = JSON.parse(text);
    // v3 lacks the trailing "reusable" flag on activities; unpack tolerates it.
    if (v[0] === 4 || v[0] === 3) return unpack(v);
    if (v[0] === 2) return unpackV2(v);
    throw new Error('This link was made by a newer version of the scheduler.');
  }
  return fromYaml(text);
}
