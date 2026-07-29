<script lang="ts">
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Modal from './Modal.svelte';

  // The modal is created fresh each time ui.editor becomes non-null,
  // so initializing local state from it here is safe.
  const st = ui.editor!;
  const editActivity = st && st.mode === 'activity' ? store.activity(st.id) : undefined;
  const editAssignment = st && st.mode === 'assignment' ? store.assignment(st.id) : undefined;
  const isNew = !editActivity && !editAssignment;

  let type = $state<'activity' | 'assignment'>(editAssignment ? 'assignment' : 'activity');
  let title = $state(editActivity?.title ?? editAssignment?.title ?? '');
  let description = $state(editActivity?.description ?? editAssignment?.description ?? '');
  let category = $state(
    editActivity?.category ??
      editAssignment?.category ??
      store.schedule.categories[0]?.name ??
      '',
  );
  let date = $state(editActivity?.date ?? (st?.mode === 'new' ? (st.date ?? '') : ''));
  let reusable = $state(editActivity?.reusable ?? false);
  let assigned = $state(editAssignment?.assigned ?? (st?.mode === 'new' ? (st.date ?? '') : ''));
  let due = $state(editAssignment?.due ?? '');
  let time = $state(editAssignment?.time ?? '');

  function close() {
    ui.editor = null;
  }

  function save() {
    if (!title.trim()) return;
    if (type === 'assignment' && !due) return;
    const common = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
    };
    if (type === 'activity') {
      const data = { ...common, date: date || undefined, reusable: reusable || undefined };
      if (editActivity) Object.assign(editActivity, data);
      else store.addActivity(data);
      // Converted from an assignment? Not supported; keep it simple.
    } else {
      const data = { ...common, assigned: assigned || undefined, due, time: time || undefined };
      if (editAssignment) Object.assign(editAssignment, data);
      else store.addAssignment(data);
    }
    close();
  }

  function del() {
    if (editActivity) store.deleteActivity(editActivity.id);
    if (editAssignment) store.deleteAssignment(editAssignment.id);
    close();
  }
</script>

<Modal title={isNew ? 'New item' : type === 'activity' ? 'Edit activity' : 'Edit assignment'} onclose={close}>
  <form
    class="space-y-3"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    {#if isNew}
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded border px-3 py-1.5 text-sm font-medium
            {type === 'activity'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-gray-500 hover:bg-gray-50'}"
          onclick={() => (type = 'activity')}>Activity</button
        >
        <button
          type="button"
          class="flex-1 rounded border px-3 py-1.5 text-sm font-medium
            {type === 'assignment'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-gray-500 hover:bg-gray-50'}"
          onclick={() => (type = 'assignment')}>Assignment</button
        >
      </div>
    {/if}

    <label class="block text-sm">
      <span class="font-medium text-gray-700">Title</span>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
        bind:value={title}
        required
        autofocus
      />
    </label>

    <label class="block text-sm">
      <span class="font-medium text-gray-700">Description</span>
      <textarea
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
        rows="3"
        bind:value={description}
      ></textarea>
    </label>

    <label class="block text-sm">
      <span class="font-medium text-gray-700">Category</span>
      <select class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5" bind:value={category}>
        <option value="">(none)</option>
        {#each store.schedule.categories as c (c.name)}
          <option value={c.name}>{c.name}</option>
        {/each}
      </select>
    </label>

    {#if type === 'activity'}
      <label class="block text-sm">
        <span class="font-medium text-gray-700">Date</span>
        <span class="ml-1 text-xs text-gray-400">(leave empty to keep unscheduled)</span>
        <input
          type="date"
          class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
          bind:value={date}
        />
      </label>

      <label class="flex items-start gap-2 text-sm">
        <input type="checkbox" class="mt-0.5" bind:checked={reusable} />
        <span>
          <span class="font-medium text-gray-700">Reusable</span>
          <span class="block text-xs text-gray-400">
            Keeps a copy in the unscheduled tray, so it can be added to the calendar as many
            times as you like.
          </span>
        </span>
      </label>
    {:else}
      <div class="grid grid-cols-2 gap-3">
        <label class="block text-sm">
          <span class="font-medium text-gray-700">Assigned</span>
          <input
            type="date"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={assigned}
          />
        </label>
        <label class="block text-sm">
          <span class="font-medium text-gray-700">Due</span>
          <input
            type="date"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
            bind:value={due}
            required
          />
        </label>
      </div>
      <label class="block text-sm">
        <span class="font-medium text-gray-700">Due time</span>
        <input
          type="time"
          class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
          bind:value={time}
        />
      </label>
    {/if}

    <div class="flex justify-between pt-2">
      {#if !isNew}
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          onclick={del}>Delete</button
        >
      {:else}
        <span></span>
      {/if}
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          onclick={close}>Cancel</button
        >
        <button
          type="submit"
          class="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >Save</button
        >
      </div>
    </div>
  </form>
</Modal>
