<script lang="ts">
  import { dayOrder } from '../dates';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Modal from './Modal.svelte';

  const s = $derived(store.schedule);

  function toggleDay(meeting: { days: string[] }, day: string) {
    if (meeting.days.includes(day)) meeting.days = meeting.days.filter((d) => d !== day);
    else meeting.days = [...meeting.days, day];
  }
</script>

<Modal title="Schedule settings" onclose={() => (ui.settings = false)} wide>
  <div class="space-y-6 text-sm">
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
            <input
              type="time"
              class="rounded border border-gray-300 px-1.5 py-1"
              bind:value={meeting.start}
            />
            –
            <input
              type="time"
              class="rounded border border-gray-300 px-1.5 py-1"
              bind:value={meeting.end}
            />
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
      <div class="space-y-2">
        {#each s.holidays as h, i (i)}
          <div class="flex flex-wrap items-center gap-2">
            <input
              class="w-40 rounded border border-gray-300 px-2 py-1"
              placeholder="Label"
              bind:value={h.label}
            />
            <input
              type="date"
              class="rounded border border-gray-300 px-1.5 py-1"
              bind:value={h.start}
            />
            –
            <input
              type="date"
              class="rounded border border-gray-300 px-1.5 py-1"
              bind:value={h.end}
            />
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
      <div class="space-y-2">
        {#each s.categories as c, i (i)}
          <div class="flex items-center gap-2">
            <input type="color" class="h-7 w-10 cursor-pointer" bind:value={c.color} />
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
