/*
 * "Import from a website": fetch a page (an academic calendar like
 * odu.edu/academics/calendar/2026-2027), find every line that mentions a
 * date, and offer each line for review as a term boundary or holiday.
 *
 * A static site can't read other origins directly (CORS), so fetching goes
 * through public CORS-friendly readers, with paste-the-page-text as the
 * always-works fallback.
 */

export interface FoundDate {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;
  role: Role;
}

export type Role = 'ignore' | 'holiday' | 'start' | 'end' | 'term';

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

// "September 7, 2026" · "Oct 10-13, 2026" · "October 10 – November 1" · "10/10/2026"
const DATE_RE =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:\s*[-–—]\s*(\d{1,2}))?(?:,?\s*(\d{4}))?|\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/gi;

interface Token {
  start: string;
  end: string;
  index: number;
  length: number;
  hadYear: boolean;
}

function tokenize(line: string, fallbackYear: number): Token[] {
  const out: Token[] = [];
  for (const m of line.matchAll(DATE_RE)) {
    if (m[5] !== undefined) {
      // MM/DD/YYYY
      const y = Number(m[7]);
      const date = iso(y, Number(m[5]), Number(m[6]));
      out.push({ start: date, end: date, index: m.index!, length: m[0].length, hadYear: true });
    } else {
      const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
      const day = Number(m[2]);
      if (!mon || day < 1 || day > 31) continue;
      const y = m[4] ? Number(m[4]) : fallbackYear;
      const start = iso(y, mon, day);
      const end = m[3] ? iso(y, mon, Number(m[3])) : start;
      out.push({ start, end, index: m.index!, length: m[0].length, hadYear: !!m[4] });
    }
  }
  return out;
}

/** Guess what a dated line is, from its wording. */
export function guessRole(label: string, isRange: boolean): Role {
  const l = label.toLowerCase();
  if (/(break|holiday|thanksgiving|mlk|martin luther|labor day|election|juneteenth|reading day|no class)/.test(l))
    return 'holiday';
  if (/(full[- ]?term|semester dates|term dates)/.test(l)) return isRange ? 'term' : 'ignore';
  if (/(classes begin|first day of class|instruction begins|classes start)/.test(l)) return 'start';
  if (/(exams? end|semester ends|term ends|last day of exam|classes end|last day of class)/.test(l))
    return 'end';
  return 'ignore';
}

/** Every line of the text that carries at least one date. */
export function parseDatedLines(text: string): FoundDate[] {
  const out: FoundDate[] = [];
  const seen = new Set<string>();
  // Years often appear once per section ("Fall Semester 2026"); carry the
  // most recent one forward for dates written without a year.
  let year = new Date().getFullYear();

  for (const rawLine of text.split(/\n+/)) {
    // Reader output is markdown: collapse [text](url) links down to their text.
    const line = rawLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
    if (!line || line.length > 300) continue;
    const yearMention = /\b(20\d{2})\b/.exec(line);
    const tokens = tokenize(line, year);
    if (yearMention) year = Number(yearMention[1]);
    if (!tokens.length) continue;

    // The label is the line with its dates (and table/markdown noise) removed.
    let label = line;
    for (const t of [...tokens].reverse()) {
      label = label.slice(0, t.index) + label.slice(t.index + t.length);
    }
    label = label
      .replace(/\b20\d{2}\b/g, '')
      .replace(/[|*_#:]+/g, ' ')
      .replace(/[-–—,]\s*$/g, '')
      .replace(/^\s*[-–—,]+/g, '')
      .replace(/\(\s*\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (label.length < 3 || label.length > 90) continue;

    const start = tokens[0].start;
    const end = tokens[tokens.length - 1].end;
    const key = `${label}|${start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, start, end: end >= start ? end : start, role: guessRole(label, end > start) });
  }

  // Pre-select conservatively: pages often list several terms and repeat
  // holidays per session column. Keep the first term-start/end/term picks and
  // the first holiday per date range; later repeats start unselected.
  const roleTaken = new Set<string>();
  const holidaySeen = new Set<string>();
  for (const f of out) {
    if (f.role === 'start' || f.role === 'end' || f.role === 'term') {
      if (roleTaken.has(f.role) || (f.role !== 'term' && roleTaken.has('term'))) f.role = 'ignore';
      else roleTaken.add(f.role);
    } else if (f.role === 'holiday') {
      const key = `${f.start}|${f.end}`;
      if (holidaySeen.has(key)) f.role = 'ignore';
      else holidaySeen.add(key);
    }
  }
  return out;
}

/** Fetch a page's text via CORS-friendly readers; throws if all fail. */
export async function fetchPageText(url: string): Promise<string> {
  // 1. Jina reader: returns clean markdown, CORS-open.
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
    });
    if (res.ok) return await res.text();
  } catch {
    /* fall through */
  }
  // 2. AllOrigins: raw HTML, CORS-open; strip to text.
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Could not fetch the page (HTTP ${res.status}).`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
  return doc.body?.innerText ?? '';
}
