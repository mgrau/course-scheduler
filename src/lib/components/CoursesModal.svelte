<script lang="ts">
  import { parseDate, shortDate } from '../dates';
  import { encodeShare } from '../share';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  const lib = $derived(store.library);
  let copiedId = $state('');

  // The link carries the full schedule, so it works in any browser.
  async function copyLink(id: string) {
    const data = await encodeShare(lib.courses[id]);
    const url = `${location.origin}${location.pathname}#data=${data}`;
    await navigator.clipboard.writeText(url);
    copiedId = id;
    setTimeout(() => (copiedId = ''), 1500);
  }

  function termLabel(id: string): string {
    const t = lib.courses[id].course.term;
    return `${shortDate(parseDate(t.start))} – ${shortDate(parseDate(t.end))}`;
  }

  function counts(id: string): string {
    const s = lib.courses[id];
    return `${s.activities.length} activities · ${s.assignments.length} assignments`;
  }

  function remove(id: string) {
    const title = lib.courses[id].course.title;
    if (confirm(`Delete "${title}"? This cannot be undone (export it as YAML first to keep a copy).`)) {
      store.deleteCourse(id);
    }
  }
</script>

<Modal title="My courses" onclose={() => (ui.courses = false)}>
  <div class="space-y-2">
    {#each Object.keys(lib.courses) as id (id)}
      {@const active = id === lib.activeId}
      <div
        class="flex items-center gap-3 rounded-lg border p-3
          {active ? 'border-sky-400 bg-sky-50/60' : 'border-gray-200 hover:bg-gray-50'}"
      >
        <button
          class="min-w-0 flex-1 text-left"
          onclick={() => {
            store.switchCourse(id);
            ui.courses = false;
          }}
        >
          <div class="flex items-center gap-2">
            <span class="truncate font-semibold text-gray-800">
              {lib.courses[id].course.title}
            </span>
            {#if active}
              <span class="rounded-full bg-sky-500 px-2 py-px text-[10px] font-bold text-white">
                open
              </span>
            {/if}
          </div>
          <div class="text-xs text-gray-500">{termLabel(id)} · {counts(id)}</div>
        </button>
        <button
          class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:underline"
          onclick={() => copyLink(id)}
        >
          <Icon name={copiedId === id ? 'check' : 'link'} class="h-3.5 w-3.5" />
          {copiedId === id ? 'copied!' : 'copy link'}
        </button>
        <button
          class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:underline"
          onclick={() => store.duplicateCourse(id)}
        >
          <Icon name="copy" class="h-3.5 w-3.5" />duplicate
        </button>
        <button
          class="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
          onclick={() => remove(id)}
        >
          <Icon name="trash" class="h-3.5 w-3.5" />delete
        </button>
      </div>
    {/each}
  </div>
  <div class="mt-4 flex justify-between">
    <p class="max-w-56 text-[11px] leading-snug text-gray-400">
      Courses are stored in this browser. Use Export → YAML for backups you can keep in git.
    </p>
    <button
      class="self-end rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
      onclick={() => {
        store.addCourse();
        ui.courses = false;
      }}
    >
      + New course
    </button>
  </div>
</Modal>
