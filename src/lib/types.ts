export type ViewMode = '5day' | '7day';

export type WeekStart = 'sunday' | 'monday';

export interface TermInfo {
  /** ISO date string YYYY-MM-DD */
  start: string;
  end: string;
}

export interface CourseInfo {
  title: string;
  term: TermInfo;
}

export interface Meeting {
  /** Day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun */
  days: string[];
  /** 24h time, e.g. "10:00" */
  start?: string;
  end?: string;
  /** e.g. "Lecture", "Lab" */
  label?: string;
  /** Optional date range within the term (e.g. classes end before exam week). */
  from?: string;
  until?: string;
}

export interface Holiday {
  start: string;
  end: string;
  label: string;
  /**
   * Whether class is cancelled on these days (the default). false marks the
   * dates as significant — labelled on the calendar — while class meets
   * normally and nothing scheduled there is flagged as a conflict.
   */
  blocks?: boolean;
}

export interface Category {
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category?: string;
  /** Undefined = unscheduled (lives in the tray) */
  date?: string;
  /** Tray template: dragging it onto the calendar leaves the original behind. */
  reusable?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  category?: string;
  assigned?: string;
  due: string;
  /** Optional due time, e.g. "23:59" */
  time?: string;
}

export interface Schedule {
  course: CourseInfo;
  view: ViewMode;
  weekStart: WeekStart;
  meetings: Meeting[];
  holidays: Holiday[];
  categories: Category[];
  activities: Activity[];
  assignments: Assignment[];
}
