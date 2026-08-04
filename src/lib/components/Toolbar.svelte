<script lang="ts">
  import { copyText, findConflicts } from '../model';
  import { encodeShare } from '../share';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { fromYaml } from '../yaml-io';
  import Icon from './Icon.svelte';

  let fileInput: HTMLInputElement;
  let copied = $state(false);
  let menuOpen = $state(false);
  let menuWrap = $state<HTMLElement | undefined>();
  const conflictCount = $derived(findConflicts(store.schedule).length);

  function closeMenuOutside(e: PointerEvent) {
    if (menuOpen && menuWrap && !menuWrap.contains(e.target as Node)) menuOpen = false;
  }

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
    await copyText(`${location.origin}${location.pathname}#data=${data}`);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  const btn =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50';
</script>

<svelte:window onpointerdown={closeMenuOutside} />

<header class="border-b border-gray-200 bg-white shadow-sm">
  <h1 class="sr-only">Course Scheduler</h1>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#334155]"
    >
      <!-- Spiral-bound planner, pencil mid-line -->
      <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" aria-hidden="true">
        <rect x="4.5" y="6.4" width="15" height="14.1" rx="2.2" fill="white" />
        {#each [7.9, 12, 16.1] as cx (cx)}
          <rect
            x={cx - 0.95}
            y="2.9"
            width="1.9"
            height="4.6"
            rx="0.95"
            fill="none"
            stroke="white"
            stroke-width="1.15"
          />
        {/each}
        <path d="M7.5 11.2 H16.5" stroke="#334155" stroke-width="1.7" stroke-linecap="round" />
        <path d="M7.5 14.8 H10.2" stroke="#334155" stroke-width="1.7" stroke-linecap="round" />
        <path d="M12.2 14.1 L15.1 11.2 L18 14.1 L15.1 17 Z" fill="#fbbf24" />
        <path d="M12.2 14.1 L15.1 17 L11.2 18 Z" fill="#0f172a" />
      </svg>
    </span>
    <input
      class="min-w-32 flex-1 rounded px-2 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white"
      bind:value={store.schedule.course.title}
      aria-label="Course title"
    />
    <!-- flex-wrap (not overflow scroll): a scroll container would clip the
         dropdown menu, and wrapping keeps every control reachable. -->
    <nav class="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
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
        class="{btn} hidden disabled:opacity-35 sm:flex"
        onclick={() => store.undo()}
        disabled={!store.canUndo}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        <Icon name="undo" />
      </button>
      <button
        class="{btn} hidden disabled:opacity-35 sm:flex"
        onclick={() => store.redo()}
        disabled={!store.canRedo}
        title="Redo (⇧⌘Z)"
        aria-label="Redo"
      >
        <Icon name="redo" />
      </button>
      <button
        class="{btn} hidden sm:flex"
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
      <button class="{btn} hidden sm:flex" onclick={() => fileInput.click()}>
        <Icon name="import" />Import
      </button>
      <button class="{btn} hidden sm:flex" onclick={() => (ui.exporter = true)}>
        <Icon name="export" />Export
      </button>
      <button class="{btn} hidden sm:flex" onclick={() => (ui.printDialog = true)}>
        <Icon name="printer" />Print
      </button>
      <button
        class="{btn} hidden sm:flex"
        onclick={() => (ui.help = true)}
        title="Help & shortcuts (?)"
        aria-label="Help"
      >
        <Icon name="help" />
      </button>

      <!-- Phone: everything else lives in one menu. -->
      <div class="relative ml-auto sm:hidden" bind:this={menuWrap}>
        <button class={btn} aria-label="More actions" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
          <Icon name="dots" />
        </button>
        {#if menuOpen}
          <div
            class="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            role="menu"
          >
            {#snippet menuItem(icon: string, label: string, action: () => void, disabled = false)}
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-35"
                role="menuitem"
                {disabled}
                onclick={() => {
                  menuOpen = false;
                  action();
                }}
              >
                <Icon name={icon} />{label}
              </button>
            {/snippet}
            {@render menuItem('undo', 'Undo', () => store.undo(), !store.canUndo)}
            {@render menuItem('redo', 'Redo', () => store.redo(), !store.canRedo)}
            {@render menuItem('import', 'Import', () => fileInput.click())}
            {@render menuItem('export', 'Export', () => (ui.exporter = true))}
            {@render menuItem('printer', 'Print', () => (ui.printDialog = true))}
            {@render menuItem(ui.dark ? 'sun' : 'moon', ui.dark ? 'Light mode' : 'Dark mode', () => (ui.dark = !ui.dark))}
            {@render menuItem('help', 'Help', () => (ui.help = true))}
          </div>
        {/if}
      </div>
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
