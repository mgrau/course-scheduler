<script lang="ts">
  import { flip } from 'svelte/animate';
  import { addDays, dayOrder, fmtDate, parseDate } from '../dates';
  import type { Holiday } from '../types';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import TimeInput from './TimeInput.svelte';

  const s = $derived(store.schedule);

  function toggleDay(meeting: { days: string[] }, day: string) {
    if (meeting.days.includes(day)) meeting.days = meeting.days.filter((d) => d !== day);
    else meeting.days = [...meeting.days, day];
  }

  function move(arr: unknown[], i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const [item] = arr.splice(i, 1);
    arr.splice(j, 0, item);
  }

  /*
   * Live reordering: pressing a grip picks the row up, and moving the pointer
   * splices it through the list so the rows visibly shuffle under the cursor.
   * Row bands are measured once at pick-up, so the FLIP animation that plays
   * during a swap can't feed back into the hit-testing.
   */
  type ListKind = 'cat' | 'hol';
  let dragKind = $state<ListKind | null>(null);
  let dragIndex = $state(-1);
  const lists: Partial<Record<ListKind, HTMLElement>> = {};
  let bands: number[] = [];
  let listTop = 0;

  const listOf = (kind: ListKind) => (kind === 'cat' ? s.categories : s.holidays);

  function startDrag(e: PointerEvent, kind: ListKind, i: number) {
    const container = lists[kind];
    if (!container) return;
    e.preventDefault();
    const box = container.getBoundingClientRect();
    listTop = box.top;
    bands = [...container.children].map((el) => el.getBoundingClientRect().bottom - box.top);
    dragKind = kind;
    dragIndex = i;
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragKind) return;
    const y = e.clientY - listTop;
    let target = bands.findIndex((bottom) => y < bottom);
    if (target === -1) target = bands.length - 1;
    if (target !== dragIndex && target >= 0) {
      // Element type doesn't matter here — the rows are only being reordered.
      const arr = listOf(dragKind) as unknown[];
      const [item] = arr.splice(dragIndex, 1);
      arr.splice(target, 0, item);
      dragIndex = target;
    }
  }

  function endDrag() {
    dragKind = null;
    dragIndex = -1;
  }

  const lifted = (kind: ListKind, i: number) => dragKind === kind && dragIndex === i;

  /** A holiday is single-day until it's given a different end date. */
  function setStart(h: Holiday, value: string) {
    const single = h.start === h.end;
    h.start = value;
    if (single || h.end < value) h.end = value;
  }

  function makeMultiDay(h: Holiday) {
    h.end = fmtDate(addDays(parseDate(h.start), 1));
  }
</script>

{#snippet grip(kind: 'cat' | 'hol', arr: unknown[], i: number)}
  <button
    type="button"
    class="shrink-0 cursor-grab touch-none rounded px-0.5 py-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
    aria-label="Drag to reorder (or use the arrow keys)"
    onpointerdown={(e) => startDrag(e, kind, i)}
    onkeydown={(e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(arr, i, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(arr, i, 1);
      }
    }}
  >
    <Icon name="grip" class="h-4 w-4" />
  </button>
{/snippet}

<svelte:window onpointermove={onPointerMove} onpointerup={endDrag} onpointercancel={endDrag} />

<Modal title="Schedule settings" onclose={() => (ui.settings = false)} wide>
  <div class="space-y-6 text-sm {dragKind ? 'select-none' : ''}">
    <section>
      <h3 class="mb-2 font-semibold text-gray-700">Course</h3>
      <label class="block">
        <span class="text-xs text-gray-500">Title</span>
        <input
          class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5"
          bind:value={s.course.title}
        />
      </label>
      <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label class="block">
          <span class="text-xs text-gray-500">Term start</span>
          <input
            type="date"
            class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={s.course.term.start}
          />
        </label>
        <label class="block">
          <span class="text-xs text-gray-500">Term end</span>
          <input
            type="date"
            class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={s.course.term.end}
          />
        </label>
        <label class="block">
          <span class="text-xs text-gray-500">Calendar view</span>
          <select
            class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={s.view}
          >
            <option value="7day">Full week</option>
            <option value="5day">Weekdays only</option>
          </select>
        </label>
        <label class="block">
          <span class="text-xs text-gray-500">Week starts on</span>
          <select
            class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={s.weekStart}
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>
        </label>
      </div>
    </section>

    <section>
      <h3 class="mb-2 font-semibold text-gray-700">Class meetings</h3>
      <div class="space-y-2">
        {#each s.meetings as meeting, i (i)}
          <div class="flex flex-wrap items-center gap-2 rounded border border-gray-200 p-2">
            <div class="flex gap-1">
              {#each dayOrder(s.weekStart) as day (day)}
                <button
                  type="button"
                  class="rounded px-1.5 py-0.5 text-xs font-medium
                    {meeting.days.includes(day)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}"
                  onclick={() => toggleDay(meeting, day)}>{day}</button
                >
              {/each}
            </div>
            <TimeInput wrapper="w-28" bind:value={meeting.start} />
            –
            <TimeInput wrapper="w-28" bind:value={meeting.end} placeholder="10:50 AM" />
            <input
              class="w-24 rounded border border-gray-300 px-2 py-1"
              placeholder="Label"
              bind:value={meeting.label}
            />
            <button
              type="button"
              class="ml-auto text-xs text-red-500 hover:underline"
              onclick={() => s.meetings.splice(i, 1)}>remove</button
            >
          </div>
        {/each}
      </div>
      <button
        type="button"
        class="mt-2 text-xs font-medium text-blue-600 hover:underline"
        onclick={() => s.meetings.push({ days: [], start: '10:00', end: '10:50', label: '' })}
        >+ Add meeting</button
      >
    </section>

    <section>
      <h3 class="mb-2 font-semibold text-gray-700">Holidays &amp; cancellations</h3>
      <div class="space-y-2" bind:this={lists.hol}>
        {#each s.holidays as h, i (h)}
          <div
            class="flex flex-wrap items-center gap-2 rounded px-1 py-0.5 {lifted('hol', i)
              ? 'relative z-10 bg-sky-50 shadow-md ring-1 ring-sky-300'
              : ''}"
            animate:flip={{ duration: 160 }}
          >
            {@render grip('hol', s.holidays, i)}
            <input
              class="w-40 rounded border border-gray-300 px-2 py-1"
              placeholder="Label"
              bind:value={h.label}
            />
            <input
              type="date"
              class="rounded border border-gray-300 px-1.5 py-1"
              value={h.start}
              oninput={(e) => setStart(h, e.currentTarget.value)}
            />
            {#if h.start !== h.end}
              <span class="text-gray-400">–</span>
              <input
                type="date"
                class="rounded border border-gray-300 px-1.5 py-1"
                min={h.start}
                bind:value={h.end}
              />
              <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Make this a single day"
                aria-label="Make this a single day"
                onclick={() => (h.end = h.start)}
              >
                <Icon name="x" class="h-3 w-3" />
              </button>
            {:else}
              <button
                type="button"
                class="text-xs font-medium text-blue-600 hover:underline"
                onclick={() => makeMultiDay(h)}>+ end date</button
              >
            {/if}
            <button
              type="button"
              class="ml-auto text-xs text-red-500 hover:underline"
              onclick={() => s.holidays.splice(i, 1)}>remove</button
            >
          </div>
        {/each}
      </div>
      <button
        type="button"
        class="mt-2 text-xs font-medium text-blue-600 hover:underline"
        onclick={() => {
          const d = s.course.term.start;
          s.holidays.push({ start: d, end: d, label: 'Holiday' });
        }}>+ Add holiday</button
      >
    </section>

    <section>
      <h3 class="mb-2 font-semibold text-gray-700">Categories</h3>
      <div class="space-y-2" bind:this={lists.cat}>
        {#each s.categories as c, i (c)}
          <div
            class="flex items-center gap-2 rounded px-1 py-0.5 {lifted('cat', i)
              ? 'relative z-10 bg-sky-50 shadow-md ring-1 ring-sky-300'
              : ''}"
            animate:flip={{ duration: 160 }}
          >
            {@render grip('cat', s.categories, i)}
            <input
              type="color"
              class="w-10 cursor-pointer self-stretch rounded-md"
              bind:value={c.color}
            />
            <input class="w-40 rounded border border-gray-300 px-2 py-1" bind:value={c.name} />
            <button
              type="button"
              class="ml-auto text-xs text-red-500 hover:underline"
              onclick={() => s.categories.splice(i, 1)}>remove</button
            >
          </div>
        {/each}
      </div>
      <button
        type="button"
        class="mt-2 text-xs font-medium text-blue-600 hover:underline"
        onclick={() => s.categories.push({ name: 'new category', color: '#2dd4bf' })}
        >+ Add category</button
      >
    </section>
  </div>
</Modal>
