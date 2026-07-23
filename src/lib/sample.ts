import type { Schedule } from './types';
import { addDays, fmtDate } from './dates';
import { newId } from './model';

export function sampleSchedule(): Schedule {
  return {
    course: {
      title: 'PHYS 232: University Physics II',
      term: { start: '2026-08-24', end: '2026-12-11' },
    },
    view: '7day',
    meetings: [
      { days: ['Mon', 'Wed', 'Fri'], start: '10:00', end: '10:50', label: 'Lecture' },
      { days: ['Thu'], start: '13:00', end: '15:50', label: 'Lab' },
    ],
    holidays: [
      { start: '2026-09-07', end: '2026-09-07', label: 'Labor Day' },
      { start: '2026-10-12', end: '2026-10-13', label: 'Fall Break' },
      { start: '2026-11-25', end: '2026-11-27', label: 'Thanksgiving' },
    ],
    categories: [
      { name: 'lecture', color: '#2563eb' },
      { name: 'lab', color: '#7c3aed' },
      { name: 'homework', color: '#059669' },
      { name: 'exam', color: '#dc2626' },
    ],
    activities: [
      { id: newId(), title: 'Course intro', category: 'lecture', date: '2026-08-24' },
      {
        id: newId(),
        title: "Coulomb's law",
        description: 'Charge, conductors and insulators, Coulomb’s law',
        category: 'lecture',
        date: '2026-08-26',
      },
      { id: newId(), title: 'Electric fields', category: 'lecture', date: '2026-08-28' },
      { id: newId(), title: 'Lab 1: Electric fields', category: 'lab', date: '2026-08-27' },
      { id: newId(), title: "Gauss's law", category: 'lecture', date: '2026-09-02' },
      { id: newId(), title: 'Midterm 1', category: 'exam', date: '2026-10-02' },
      { id: newId(), title: 'Review session', category: 'lecture' },
      { id: newId(), title: 'Midterm 2', category: 'exam' },
    ],
    assignments: [
      {
        id: newId(),
        title: 'HW 1',
        category: 'homework',
        assigned: '2026-08-26',
        due: '2026-09-02',
        time: '23:59',
      },
      {
        id: newId(),
        title: 'HW 2',
        category: 'homework',
        assigned: '2026-09-02',
        due: '2026-09-09',
        time: '23:59',
      },
    ],
  };
}

export function blankSchedule(): Schedule {
  const start = new Date();
  const end = addDays(start, 15 * 7);
  return {
    course: { title: 'New Course', term: { start: fmtDate(start), end: fmtDate(end) } },
    view: '7day',
    meetings: [{ days: ['Mon', 'Wed', 'Fri'], start: '10:00', end: '10:50', label: 'Lecture' }],
    holidays: [],
    categories: [
      { name: 'lecture', color: '#2563eb' },
      { name: 'homework', color: '#059669' },
      { name: 'exam', color: '#dc2626' },
    ],
    activities: [],
    assignments: [],
  };
}
