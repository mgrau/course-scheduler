import type { Activity, Assignment, Schedule } from './types';
import { blankSchedule, sampleSchedule } from './sample';
import { newId } from './model';

const LIBRARY_KEY = 'course-scheduler:library';
const LEGACY_KEY = 'course-scheduler:schedule';

export interface Library {
  activeId: string;
  courses: Record<string, Schedule>;
}

function migrate(s: Schedule): Schedule {
  s.weekStart ??= 'sunday';
  // Old default category colors get the current brighter defaults.
  const recolor: Record<string, string> = {
    '#2563eb': '#22d3ee',
    '#0ea5e9': '#22d3ee',
    '#7c3aed': '#a78bfa',
    '#a855f7': '#a78bfa',
    '#059669': '#fbbf24',
    '#22c55e': '#fbbf24',
    '#dc2626': '#fb7185',
    '#f43f5e': '#fb7185',
  };
  for (const c of s.categories) c.color = recolor[c.color] ?? c.color;
  return s;
}

function loadInitial(): Library {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const lib = JSON.parse(raw) as Library;
      for (const s of Object.values(lib.courses)) migrate(s);
      if (!lib.courses[lib.activeId]) lib.activeId = Object.keys(lib.courses)[0];
      if (lib.activeId) return lib;
    }
    // Migration: a schedule saved before the multi-course library existed.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const s = migrate(JSON.parse(legacy) as Schedule);
      localStorage.removeItem(LEGACY_KEY);
      const id = newId();
      return { activeId: id, courses: { [id]: s } };
    }
  } catch (e) {
    console.warn('Could not restore saved schedules:', e);
  }
  const id = newId();
  return { activeId: id, courses: { [id]: sampleSchedule() } };
}

class ScheduleStore {
  library = $state<Library>(loadInitial());

  // Undo/redo: a stack of JSON snapshots of the whole library. Rapid edits
  // (typing, dragging) coalesce into one entry via a short debounce.
  #past = $state<string[]>([]);
  #future = $state<string[]>([]);
  #current = JSON.stringify($state.snapshot(this.library));
  #recordTimer: ReturnType<typeof setTimeout> | undefined;

  /** The active course's schedule. */
  get schedule(): Schedule {
    return this.library.courses[this.library.activeId];
  }

  persist() {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(this.library));
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  /** Called (untracked) whenever the library changes. */
  noteChange(snapshot: string) {
    clearTimeout(this.#recordTimer);
    if (snapshot === this.#current) return;
    this.#recordTimer = setTimeout(() => this.#record(snapshot), 350);
  }

  #record(snapshot: string) {
    if (snapshot === this.#current) return;
    this.#past.push(this.#current);
    if (this.#past.length > 100) this.#past.shift();
    this.#current = snapshot;
    this.#future = [];
  }

  /** Any change still sitting in the debounce window becomes undoable now. */
  #flush() {
    clearTimeout(this.#recordTimer);
    this.#record(JSON.stringify($state.snapshot(this.library)));
  }

  undo() {
    this.#flush();
    if (!this.#past.length) return;
    this.#future.push(this.#current);
    this.#current = this.#past.pop()!;
    this.library = JSON.parse(this.#current);
  }

  redo() {
    this.#flush();
    if (!this.#future.length) return;
    this.#past.push(this.#current);
    this.#current = this.#future.pop()!;
    this.library = JSON.parse(this.#current);
  }

  courseIds(): string[] {
    return Object.keys(this.library.courses);
  }

  switchCourse(id: string) {
    if (this.library.courses[id]) this.library.activeId = id;
  }

  /** Add a course (blank unless given) and make it active. Returns its id. */
  addCourse(s: Schedule = blankSchedule()): string {
    const id = newId();
    this.library.courses[id] = s;
    this.library.activeId = id;
    return id;
  }

  duplicateCourse(id: string) {
    const src = this.library.courses[id];
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)) as Schedule;
    copy.course.title = `${copy.course.title} (copy)`;
    this.addCourse(copy);
  }

  deleteCourse(id: string) {
    if (!this.library.courses[id]) return;
    delete this.library.courses[id];
    if (this.library.activeId === id) {
      this.library.activeId = Object.keys(this.library.courses)[0] ?? '';
    }
    // Never leave the library empty.
    if (!this.library.activeId) this.addCourse();
  }

  /** Replace the active course's schedule (YAML import). */
  replace(s: Schedule) {
    this.library.courses[this.library.activeId] = s;
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

  /**
   * Drop an activity on a day: reusable tray templates leave a copy behind,
   * everything else moves.
   */
  placeActivity(id: string, date: string) {
    const a = this.activity(id);
    if (!a) return;
    if (a.reusable && !a.date) {
      // The placed instance is a plain activity, so the tray keeps one template.
      this.addActivity({
        title: a.title,
        description: a.description,
        category: a.category,
        date,
      });
    } else {
      a.date = date;
    }
  }

  moveAssignment(id: string, which: 'assigned' | 'due', date: string) {
    const a = this.assignment(id);
    if (a) a[which] = date;
  }
}

export const store = new ScheduleStore();
