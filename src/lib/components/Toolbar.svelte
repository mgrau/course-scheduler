<script lang="ts">
  import { encodeShare } from '../share';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { fromYaml } from '../yaml-io';
  import Icon from './Icon.svelte';

  let fileInput: HTMLInputElement;
  let copied = $state(false);

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

  async function copyLink() {
    const data = await encodeShare(store.schedule);
    const url = `${location.origin}${location.pathname}#data=${data}`;
    await navigator.clipboard.writeText(url);
    // Show the link in the URL bar briefly, then tidy it away again.
    history.replaceState(null, '', url);
    copied = true;
    setTimeout(() => {
      copied = false;
      history.replaceState(null, '', location.pathname + location.search);
    }, 1500);
  }

  const btn =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50';
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#003057]"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15.5" rx="2.5" fill="white" />
        <path d="M4 9 H20" stroke="#003057" stroke-width="1.5" />
        <path d="M12 10.6 17.4 13.3 12 16 6.6 13.3Z" fill="#003057" />
        <path
          d="M9.5 15 12 16.2 14.5 15 V17 C14.5 18 9.5 18 9.5 17 Z"
          fill="#003057"
        />
      </svg>
    </span>
    <input
      class="min-w-32 flex-1 rounded px-2 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white"
      bind:value={store.schedule.course.title}
      aria-label="Course title"
    />
    <nav class="flex w-full items-center gap-1.5 overflow-x-auto sm:w-auto">
      <button
        class="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500"
        onclick={() => (ui.editor = { mode: 'new' })}
      >
        <Icon name="plus" />New item
      </button>
      <button class={btn} onclick={copyLink}>
        <Icon name={copied ? 'check' : 'link'} />{copied ? 'Copied!' : 'Copy link'}
      </button>
      <button class={btn} onclick={() => (ui.courses = true)}>
        <Icon name="library" />Courses
      </button>
      <button class={btn} onclick={() => (ui.settings = true)}>
        <Icon name="settings" />Settings
      </button>
      <button class={btn} onclick={() => fileInput.click()}>
        <Icon name="import" />Import
      </button>
      <button class={btn} onclick={() => (ui.exporter = true)}>
        <Icon name="export" />Export
      </button>
      <button class={btn} onclick={() => (ui.printDialog = true)}>
        <Icon name="printer" />Print
      </button>
    </nav>
    <input
      bind:this={fileInput}
      type="file"
      accept=".yaml,.yml,text/yaml"
      class="hidden"
      onchange={importFile}
    />
  </div>
</header>
