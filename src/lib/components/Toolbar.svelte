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
    class="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 shadow-sm"
  >
    <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 4.5 21.5 9.5 12 14.5 2.5 9.5Z" fill="white" />
      <path
        d="M7 12.4 12 15 17 12.4 V15.3 C17 16.5 14.8 17.4 12 17.4 C9.2 17.4 7 16.5 7 15.3 Z"
        fill="white"
        opacity="0.85"
      />
      <path d="M21.5 9.5 V13.6" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="21.5" cy="15" r="1.1" fill="white" />
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
