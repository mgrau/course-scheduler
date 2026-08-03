import type { Holiday } from './types';

/*
 * Term presets: official semester dates and class cancellations, hand-checked
 * against the ODU academic calendar (odu.edu/academics/calendar). A static
 * site can't fetch odu.edu at runtime (CORS), so these ship with the app —
 * updating a future year is a matter of adding an entry here.
 *
 * Term end is the end of the exam period; exam week simply has no items
 * unless you schedule them.
 */
export interface TermPreset {
  id: string;
  label: string;
  start: string;
  end: string;
  holidays: Holiday[];
}

export const TERM_PRESETS: TermPreset[] = [
  {
    id: 'odu-fall-2026',
    label: 'ODU Fall 2026',
    start: '2026-08-24',
    end: '2026-12-11',
    holidays: [
      { start: '2026-09-07', end: '2026-09-07', label: 'Labor Day' },
      { start: '2026-10-10', end: '2026-10-13', label: 'Fall Break' },
      { start: '2026-11-03', end: '2026-11-03', label: 'Election Day' },
      { start: '2026-11-25', end: '2026-11-29', label: 'Thanksgiving Break' },
    ],
  },
  {
    id: 'odu-spring-2027',
    label: 'ODU Spring 2027',
    start: '2027-01-11',
    end: '2027-05-07',
    holidays: [
      { start: '2027-01-18', end: '2027-01-18', label: 'MLK Jr. Day' },
      { start: '2027-03-08', end: '2027-03-14', label: 'Spring Break' },
    ],
  },
  {
    id: 'odu-fall-2027',
    label: 'ODU Fall 2027',
    start: '2027-08-23',
    end: '2027-12-10',
    holidays: [
      { start: '2027-09-06', end: '2027-09-06', label: 'Labor Day' },
      { start: '2027-10-09', end: '2027-10-12', label: 'Fall Break' },
      { start: '2027-11-02', end: '2027-11-02', label: 'Election Day' },
      { start: '2027-11-24', end: '2027-11-28', label: 'Thanksgiving Break' },
    ],
  },
  {
    id: 'odu-spring-2028',
    label: 'ODU Spring 2028',
    start: '2028-01-10',
    end: '2028-05-05',
    holidays: [
      { start: '2028-01-17', end: '2028-01-17', label: 'MLK Jr. Day' },
      { start: '2028-03-06', end: '2028-03-12', label: 'Spring Break' },
    ],
  },
];
