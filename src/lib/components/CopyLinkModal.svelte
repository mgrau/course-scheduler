<script lang="ts">
  import { ui } from '../ui.svelte';
  import Modal from './Modal.svelte';

  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
</script>

<Modal title="Copy this link" onclose={() => (ui.copyDialog = null)}>
  <p class="mb-2 text-sm text-gray-600">
    Your browser blocked copying automatically. The link is selected below — copy it with
    <kbd class="rounded border border-gray-300 bg-gray-50 px-1 font-mono text-xs">
      {mac ? '⌘C' : 'Ctrl+C'}
    </kbd>.
  </p>
  <!-- svelte-ignore a11y_autofocus -->
  <input
    readonly
    autofocus
    class="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1.5 font-mono text-xs text-gray-700"
    value={ui.copyDialog}
    aria-label="Share link"
    onfocus={(e) => e.currentTarget.select()}
    onclick={(e) => e.currentTarget.select()}
  />
  <div class="mt-3 flex justify-end">
    <button
      class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
      onclick={() => (ui.copyDialog = null)}>Done</button
    >
  </div>
</Modal>
