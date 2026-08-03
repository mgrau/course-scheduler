<script lang="ts">
  import { toHtml, toMarkdown, toLatex, type TableStyle } from '../exports';
  import { toIcs } from '../ics';
  import { slugify } from '../model';
  import { encodeShare } from '../share';
  import { toYaml } from '../yaml-io';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import Modal from './Modal.svelte';

  type Tab = 'yaml' | 'markdown' | 'html' | 'latex' | 'ics';
  let tab = $state<Tab>('yaml');
  let style = $state<TableStyle>('meeting');
  let copied = $state(false);
  let linkCopied = $state(false);
  let richCopied = $state(false);

  const content = $derived(
    tab === 'yaml'
      ? toYaml(store.schedule)
      : tab === 'markdown'
        ? toMarkdown(store.schedule, style)
        : tab === 'html'
          ? toHtml(store.schedule, style)
          : tab === 'latex'
            ? toLatex(store.schedule, style)
            : toIcs(store.schedule),
  );

  const EXT: Record<Tab, string> = {
    yaml: 'yaml',
    markdown: 'md',
    html: 'html',
    latex: 'tex',
    ics: 'ics',
  };
  const filename = $derived(
    `${slugify(store.schedule.course.title) || 'schedule'}.${EXT[tab]}`,
  );

  /** Rich copy: pasting into Canvas's editor drops the table in already rendered. */
  async function copyFormatted() {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([content], { type: 'text/html' }),
        'text/plain': new Blob([content], { type: 'text/plain' }),
      }),
    ]);
    richCopied = true;
    setTimeout(() => (richCopied = false), 1500);
  }

  async function copyIcsLink() {
    const data = await encodeShare(store.schedule);
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}#ics=${data}`);
    linkCopied = true;
    setTimeout(() => (linkCopied = false), 1500);
  }

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
    {#each [['yaml', 'YAML'], ['markdown', 'Markdown'], ['html', 'HTML'], ['latex', 'LaTeX'], ['ics', 'Calendar (.ics)']] as [id, label] (id)}
      <button
        class="rounded px-3 py-1 text-sm font-medium
          {tab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
        onclick={() => (tab = id as Tab)}>{label}</button
      >
    {/each}
    {#if tab === 'markdown' || tab === 'html' || tab === 'latex'}
      <select
        class="ml-auto rounded border border-gray-300 px-2 py-1 text-sm"
        bind:value={style}
      >
        <option value="meeting">One row per class day</option>
        <option value="week">One row per week</option>
      </select>
    {/if}
  </div>

  {#if tab === 'html'}
    <p class="mb-2 text-xs text-gray-500">
      Plain table markup with inline styles, ready for Canvas: use "Copy formatted" and paste
      straight into the rich-content editor, or "Copy" the source into its HTML view.
    </p>
  {/if}

  {#if tab === 'ics'}
    <p class="mb-2 text-xs text-gray-500">
      Class meetings become repeating events (holidays excluded), activities become all-day
      events, and assignments appear on their due date. Import the file into any calendar app —
      or share an .ics link: opening it downloads this file.
    </p>
  {/if}

  <textarea
    readonly
    rows="18"
    class="w-full rounded border border-gray-300 bg-gray-50 p-2 font-mono text-xs"
    value={content}
  ></textarea>

  <div class="mt-3 flex justify-end gap-2">
    {#if tab === 'ics'}
      <button
        class="mr-auto rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        onclick={copyIcsLink}>{linkCopied ? 'Link copied!' : 'Copy .ics link'}</button
      >
    {/if}
    {#if tab === 'html'}
      <button
        class="mr-auto rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        onclick={copyFormatted}>{richCopied ? 'Copied!' : 'Copy formatted'}</button
      >
    {/if}
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
