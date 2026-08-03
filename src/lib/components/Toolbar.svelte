<script lang="ts">
  import { findConflicts } from '../model';
  import { encodeShare } from '../share';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { fromYaml } from '../yaml-io';
  import Icon from './Icon.svelte';

  let fileInput: HTMLInputElement;
  let copied = $state(false);
  const conflictCount = $derived(findConflicts(store.schedule).length);

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

  // Copies a self-contained link without touching the address bar.
  async function copyLink() {
    const data = await encodeShare(store.schedule);
    await navigator.clipboard.writeText(
      `${location.origin}${location.pathname}#data=${data}`,
    );
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  const btn =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50';
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
  <h1 class="sr-only">Course Scheduler</h1>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.8" width="17" height="16.2" rx="2.5" fill="white" />
        <path
          d="M6 4.8 H18 A2.5 2.5 0 0 1 20.5 7.3 V8.8 H3.5 V7.3 A2.5 2.5 0 0 1 6 4.8 Z"
          fill="#0ea5e9"
        />
        <rect x="6.9" y="2.4" width="1.9" height="4.4" rx="0.95" fill="white" />
        <rect x="15.2" y="2.4" width="1.9" height="4.4" rx="0.95" fill="white" />
        {#each [11.2, 15.6] as y (y)}
          {#each [6.4, 10.8, 15.2] as x (x)}
            <rect {x} {y} width="2.4" height="2.4" rx="0.6" fill="#0ea5e9" />
          {/each}
        {/each}
      </svg>
    </span>
    <input
      class="min-w-32 flex-1 rounded px-2 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white"
      bind:value={store.schedule.course.title}
      aria-label="Course title"
    />
    <nav class="flex w-full items-center gap-1.5 overflow-x-auto sm:w-auto">
      {#if conflictCount > 0}
        <button
          class="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100"
          onclick={() => (ui.conflicts = true)}
          title="{conflictCount} possible conflict{conflictCount === 1 ? '' : 's'} — click to review"
        >
          <Icon name="warning" />{conflictCount}
        </button>
      {/if}
      <button
        class="{btn} disabled:opacity-35"
        onclick={() => store.undo()}
        disabled={!store.canUndo}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        <Icon name="undo" />
      </button>
      <button
        class="{btn} disabled:opacity-35"
        onclick={() => store.redo()}
        disabled={!store.canRedo}
        title="Redo (⇧⌘Z)"
        aria-label="Redo"
      >
        <Icon name="redo" />
      </button>
      <button
        class={btn}
        onclick={() => (ui.dark = !ui.dark)}
        title={ui.dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark mode"
      >
        <Icon name={ui.dark ? 'sun' : 'moon'} />
      </button>
      <button class={btn} onclick={copyLink} aria-live="polite">
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
      <button
        class={btn}
        onclick={() => (ui.help = true)}
        title="Help & shortcuts (?)"
        aria-label="Help"
      >
        <Icon name="help" />
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
