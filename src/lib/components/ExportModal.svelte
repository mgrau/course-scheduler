<script lang="ts">
  import { toMarkdown, toLatex, type TableStyle } from '../exports';
  import { toYaml } from '../yaml-io';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Modal from './Modal.svelte';

  type Tab = 'yaml' | 'markdown' | 'latex';
  let tab = $state<Tab>('yaml');
  let style = $state<TableStyle>('meeting');
  let copied = $state(false);

  const content = $derived(
    tab === 'yaml'
      ? toYaml(store.schedule)
      : tab === 'markdown'
        ? toMarkdown(store.schedule, style)
        : toLatex(store.schedule, style),
  );

  const filename = $derived(
    tab === 'yaml' ? 'schedule.yaml' : tab === 'markdown' ? 'schedule.md' : 'schedule.tex',
  );

  async function copy() {
    await navigator.clipboard.writeText(content);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function download() {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<Modal title="Export" onclose={() => (ui.exporter = false)} wide>
  <div class="mb-3 flex items-center gap-2">
    {#each [['yaml', 'YAML'], ['markdown', 'Markdown'], ['latex', 'LaTeX']] as [id, label] (id)}
      <button
        class="rounded px-3 py-1 text-sm font-medium
          {tab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
        onclick={() => (tab = id as Tab)}>{label}</button
      >
    {/each}
    {#if tab !== 'yaml'}
      <select
        class="ml-auto rounded border border-gray-300 px-2 py-1 text-sm"
        bind:value={style}
      >
        <option value="meeting">One row per class day</option>
        <option value="week">One row per week</option>
      </select>
    {/if}
  </div>

  <textarea
    readonly
    rows="18"
    class="w-full rounded border border-gray-300 bg-gray-50 p-2 font-mono text-xs"
    value={content}
  ></textarea>

  <div class="mt-3 flex justify-end gap-2">
    <button
      class="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button
    >
    <button
      class="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
      onclick={download}>Download {filename}</button
    >
  </div>
</Modal>
