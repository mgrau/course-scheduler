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
  import { slugify } from './lib/model';
  import { store } from './lib/store.svelte';
  import { ui } from './lib/ui.svelte';

  // Autosave: JSON.stringify reads the whole library deeply, so this effect
  // re-runs on any change anywhere in the state tree.
  $effect(() => {
    JSON.stringify(store.library);
    store.persist();
  });

  // Deep links: #<slug-of-course-title> (or a course id) selects that course.
  function resolveHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const ids = store.courseIds();
    const id =
      ids.find((i) => i === h) ??
      ids.find((i) => slugify(store.library.courses[i].course.title) === h);
    if (id) store.switchCourse(id);
  }
  resolveHash();

  // Keep the hash in sync with the active course (and its title).
  $effect(() => {
    const slug = slugify(store.schedule.course.title);
    if (slug && decodeURIComponent(location.hash.slice(1)) !== slug) {
      history.replaceState(null, '', `#${encodeURIComponent(slug)}`);
    }
  });
</script>

<svelte:window onhashchange={resolveHash} />

<div class="screen-only flex h-screen flex-col bg-white text-gray-900">
  <Toolbar />
  <div class="flex flex-1 overflow-hidden">
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
