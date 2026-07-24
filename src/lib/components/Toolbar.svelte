<script lang="ts">
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { fromYaml } from '../yaml-io';

  let fileInput: HTMLInputElement;

  async function importFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      // Imports become a new course; existing ones are untouched.
      store.addCourse(fromYaml(await file.text()));
    } catch (err) {
      alert(`Could not import YAML: ${err instanceof Error ? err.message : err}`);
    }
  }

  const btn =
    'rounded px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900';
</script>

<header class="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 shadow-sm">
  <span
    class="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003057]"
  >
    <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M12 2 18 5 12 8 6 5Z" fill="white" />
      <path d="M18 5 V7.6" stroke="white" stroke-width="1.3" stroke-linecap="round" />
      <circle cx="18" cy="8.6" r="0.9" fill="white" />
      <rect x="4.5" y="9.5" width="15" height="11" rx="2" stroke="white" stroke-width="1.6" />
      <path d="M4.5 13.2 H19.5" stroke="white" stroke-width="1.3" />
      <circle cx="8.6" cy="16" r="1" fill="white" />
      <circle cx="12" cy="16" r="1" fill="white" />
      <circle cx="15.4" cy="16" r="1" fill="white" />
      <circle cx="8.6" cy="18.6" r="1" fill="white" />
      <circle cx="12" cy="18.6" r="1" fill="white" />
    </svg>
  </span>
  <input
    class="min-w-0 flex-1 rounded px-2 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white"
    bind:value={store.schedule.course.title}
    aria-label="Course title"
  />
  <button class={btn} onclick={() => (ui.editor = { mode: 'new' })}>+ New item</button>
  <button class={btn} onclick={() => (ui.courses = true)}>Courses</button>
  <button class={btn} onclick={() => (ui.settings = true)}>Settings</button>
  <button class={btn} onclick={() => fileInput.click()}>Import</button>
  <button class={btn} onclick={() => (ui.exporter = true)}>Export</button>
  <button class={btn} onclick={() => (ui.printDialog = true)}>Print</button>
  <input
    bind:this={fileInput}
    type="file"
    accept=".yaml,.yml,text/yaml"
    class="hidden"
    onchange={importFile}
  />
</header>
