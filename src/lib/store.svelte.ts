import type { Activity, Assignment, Schedule } from './types';
import { sampleSchedule } from './sample';
import { newId } from './model';

const STORAGE_KEY = 'course-scheduler:schedule';

function loadInitial(): Schedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Schedule;
      // Migration for schedules saved before weekStart existed.
      s.weekStart ??= 'sunday';
      return s;
    }
  } catch (e) {
    console.warn('Could not restore saved schedule:', e);
  }
  return sampleSchedule();
}

class ScheduleStore {
  schedule = $state<Schedule>(loadInitial());

  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.schedule));
  }

  replace(s: Schedule) {
    this.schedule = s;
  }

  activity(id: string): Activity | undefined {
    return this.schedule.activities.find((a) => a.id === id);
  }

  assignment(id: string): Assignment | undefined {
    return this.schedule.assignments.find((a) => a.id === id);
  }

  addActivity(data: Omit<Activity, 'id'>): Activity {
    const a = { ...data, id: newId() };
    this.schedule.activities.push(a);
    return a;
  }

  addAssignment(data: Omit<Assignment, 'id'>): Assignment {
    const a = { ...data, id: newId() };
    this.schedule.assignments.push(a);
    return a;
  }

  deleteActivity(id: string) {
    this.schedule.activities = this.schedule.activities.filter((a) => a.id !== id);
  }

  deleteAssignment(id: string) {
    this.schedule.assignments = this.schedule.assignments.filter((a) => a.id !== id);
  }

  moveActivity(id: string, date: string | undefined) {
    const a = this.activity(id);
    if (a) a.date = date;
  }

  moveAssignment(id: string, which: 'assigned' | 'due', date: string) {
    const a = this.assignment(id);
    if (a) a[which] = date;
  }
}

export const store = new ScheduleStore();
