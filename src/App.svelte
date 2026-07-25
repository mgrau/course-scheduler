<script lang="ts">
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
  import { decodeShare, encodeShare } from './lib/share';
  import { store } from './lib/store.svelte';
  import type { Schedule } from './lib/types';
  import { ui } from './lib/ui.svelte';
  import { toYaml } from './lib/yaml-io';

  // Autosave: JSON.stringify reads the whole library deeply, so this effect
  // re-runs on any change anywhere in the state tree.
  $effect(() => {
    JSON.stringify(store.library);
    store.persist();
  });

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
  async function resolveHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    if (h.startsWith('data=') || h.startsWith('ics=')) {
      const ics = h.startsWith('ics=');
      try {
        const incoming = await decodeShare(h.slice(ics ? 4 : 5));
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
  }
  resolveHash();

  // The URL bar always carries the current schedule, so copying the address
  // is copying a share link.
  let hashTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    JSON.stringify(store.schedule);
    clearTimeout(hashTimer);
    hashTimer = setTimeout(async () => {
      const data = await encodeShare(store.schedule);
      history.replaceState(null, '', `#data=${data}`);
    }, 400);
    return () => clearTimeout(hashTimer);
  });
</script>

<svelte:window onhashchange={resolveHash} />

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

<PrintView />
