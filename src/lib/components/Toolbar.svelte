<script lang="ts">
  import { blankSchedule } from '../sample';
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
      store.replace(fromYaml(await file.text()));
    } catch (err) {
      alert(`Could not import YAML: ${err instanceof Error ? err.message : err}`);
    }
  }

  function newSchedule() {
    if (confirm('Start a new blank schedule? The current one will be replaced (export it first if you want to keep it).')) {
      store.replace(blankSchedule());
    }
  }

  const btn =
    'rounded px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900';
</script>

<header class="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
  <span class="mr-2 text-lg">📅</span>
  <input
    class="min-w-0 flex-1 rounded px-2 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white"
    bind:value={store.schedule.course.title}
    aria-label="Course title"
  />
  <button class={btn} onclick={() => (ui.editor = { mode: 'new' })}>+ New item</button>
  <button class={btn} onclick={() => (ui.settings = true)}>Settings</button>
  <button class={btn} onclick={() => fileInput.click()}>Import</button>
  <button class={btn} onclick={() => (ui.exporter = true)}>Export</button>
  <button class={btn} onclick={() => (ui.printDialog = true)}>Print</button>
  <button class={btn} onclick={newSchedule}>New</button>
  <input
    bind:this={fileInput}
    type="file"
    accept=".yaml,.yml,text/yaml"
    class="hidden"
    onchange={importFile}
  />
</header>
