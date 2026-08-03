<script lang="ts">
  import { untrack } from 'svelte';
  import { addDays, fmtDate, parseDate, todayStr } from './lib/dates';
  import Calendar from './lib/components/Calendar.svelte';
  import CoursesModal from './lib/components/CoursesModal.svelte';
  import ExportModal from './lib/components/ExportModal.svelte';
  import ItemModal from './lib/components/ItemModal.svelte';
  import PrintDialog from './lib/components/PrintDialog.svelte';
  import PrintView from './lib/components/PrintView.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';
  import Toolbar from './lib/components/Toolbar.svelte';
  import Tray from './lib/components/Tray.svelte';
  import { toIcs } from './lib/ics';
  import { slugify } from './lib/model';
  import { decodeShare } from './lib/share';
  import { store } from './lib/store.svelte';
  import type { Schedule } from './lib/types';
  import { ui } from './lib/ui.svelte';
  import { toYaml } from './lib/yaml-io';

  // Autosave + undo history: JSON.stringify reads the whole library deeply,
  // so this effect re-runs on any change anywhere in the state tree.
  $effect(() => {
    const snapshot = JSON.stringify(store.library);
    localStorage.setItem('course-scheduler:library', snapshot);
    untrack(() => store.noteChange(snapshot));
  });

  // Theme: saved preference, else the system setting; class on <html>.
  const THEME_KEY = 'course-scheduler:theme';
  const savedTheme = localStorage.getItem(THEME_KEY);
  ui.dark = savedTheme ? savedTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $effect(() => {
    document.documentElement.classList.toggle('dark', ui.dark);
    localStorage.setItem(THEME_KEY, ui.dark ? 'dark' : 'light');
  });

  // First-visit hint.
  const HINT_KEY = 'course-scheduler:hint-seen';
  let showHint = $state(!localStorage.getItem(HINT_KEY));
  function dismissHint() {
    showHint = false;
    localStorage.setItem(HINT_KEY, '1');
  }

  const anyModalOpen = () =>
    !!ui.editor || ui.settings || ui.courses || ui.exporter || ui.printDialog;

  // Global keys: undo/redo everywhere; arrows/Enter navigate the calendar.
  function onKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const inField = !!target.closest('input, textarea, select, [contenteditable]');

    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'z') {
      if (inField) return; // let text fields keep their native undo
      e.preventDefault();
      if (e.shiftKey) store.redo();
      else store.undo();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'y') {
      if (inField) return;
      e.preventDefault();
      store.redo();
      return;
    }

    if (inField || anyModalOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    const term = store.schedule.course.term;
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (e.key in deltas) {
      e.preventDefault();
      const clamp = (d: string) => (d < term.start ? term.start : d > term.end ? term.end : d);
      if (!ui.focusDate) {
        ui.focusDate = clamp(todayStr());
        return;
      }
      let next = fmtDate(addDays(parseDate(ui.focusDate), deltas[e.key]));
      // In the 5-day view, single steps skip the hidden weekend.
      if (store.schedule.view === '5day' && Math.abs(deltas[e.key]) === 1) {
        const step = deltas[e.key];
        let d = parseDate(next);
        while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, step);
        next = fmtDate(d);
      }
      ui.focusDate = clamp(next);
    } else if (e.key === 'Enter' && ui.focusDate) {
      e.preventDefault();
      ui.editor = { mode: 'new', date: ui.focusDate };
    } else if (e.key === 'Escape') {
      ui.focusDate = null;
    }
  }

  // Import a schedule from a link: open the existing copy if we already have
  // an identical one, otherwise add it as a new course.
  function importIncoming(incoming: Schedule) {
    const yaml = toYaml(incoming);
    const match = store.courseIds().find((i) => toYaml(store.library.courses[i]) === yaml);
    if (match) store.switchCourse(match);
    else store.addCourse(incoming);
  }

  // Deep links: #data=<packed schedule> imports/opens that schedule;
  // #ics=<packed schedule> additionally downloads it as an iCalendar file;
  // a bare #<slug-or-id> (legacy links) selects a stored course by name.
  // The hash is cleared afterwards so the address bar stays clean.
  async function resolveHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const prefix = ['data=', 'ics='].find((p) => h.startsWith(p));
    if (prefix) {
      const ics = prefix === 'ics=';
      try {
        const incoming = await decodeShare(h.slice(prefix.length));
        importIncoming(incoming);
        if (ics) {
          const blob = new Blob([toIcs(incoming)], { type: 'text/calendar' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slugify(incoming.course.title) || 'schedule'}.ics`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.warn('Could not load the schedule from this link:', e);
      }
    } else {
      const ids = store.courseIds();
      const id =
        ids.find((i) => i === h) ??
        ids.find((i) => slugify(store.library.courses[i].course.title) === h);
      if (id) store.switchCourse(id);
    }
    history.replaceState(null, '', location.pathname + location.search);
  }
  resolveHash();
</script>

<svelte:window onhashchange={resolveHash} onkeydown={onKeydown} />

<div class="screen-only flex h-screen flex-col bg-white text-gray-900">
  <Toolbar />
  <div class="flex flex-1 flex-col overflow-hidden md:flex-row">
    <main class="flex-1 overflow-auto">
      <Calendar />
    </main>
    <Tray />
  </div>
</div>

{#if ui.editor}
  <ItemModal />
{/if}
{#if ui.settings}
  <SettingsModal />
{/if}
{#if ui.courses}
  <CoursesModal />
{/if}
{#if ui.exporter}
  <ExportModal />
{/if}
{#if ui.printDialog}
  <PrintDialog />
{/if}

{#if showHint}
  <div
    class="screen-only fixed bottom-4 left-1/2 z-30 w-[26rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
  >
    <h3 class="mb-1.5 font-semibold text-gray-800">👋 Welcome to Course Scheduler</h3>
    <ul class="mb-3 list-disc space-y-1 pl-4 text-sm text-gray-600">
      <li>Click any day to add an activity or assignment, or drag items around the calendar.</li>
      <li>The <b>Unscheduled</b> tray holds items without a date — drag them on when ready.</li>
      <li><b>Settings</b> sets your meeting days, holidays, and categories (try a semester preset).</li>
      <li>Everything autosaves in this browser; <b>Copy link</b> shares the whole schedule.</li>
    </ul>
    <button
      class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
      onclick={dismissHint}>Got it</button
    >
  </div>
{/if}

<PrintView />
