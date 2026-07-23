<script lang="ts">
  import Calendar from './lib/components/Calendar.svelte';
  import ExportModal from './lib/components/ExportModal.svelte';
  import ItemModal from './lib/components/ItemModal.svelte';
  import PrintDialog from './lib/components/PrintDialog.svelte';
  import PrintView from './lib/components/PrintView.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';
  import Toolbar from './lib/components/Toolbar.svelte';
  import Tray from './lib/components/Tray.svelte';
  import { store } from './lib/store.svelte';
  import { ui } from './lib/ui.svelte';

  // Autosave: JSON.stringify reads the whole schedule deeply, so this effect
  // re-runs on any change anywhere in the state tree.
  $effect(() => {
    JSON.stringify(store.schedule);
    store.persist();
  });
</script>

<div class="screen-only flex h-screen flex-col bg-white text-gray-900">
  <Toolbar />
  <div class="flex flex-1 overflow-hidden">
    <main class="flex-1 overflow-auto">
      <Calendar />
    </main>
    <Tray />
  </div>
</div>

{#if ui.editor}
  <ItemModal />
{/if}
{#if ui.settings}
  <SettingsModal />
{/if}
{#if ui.exporter}
  <ExportModal />
{/if}
{#if ui.printDialog}
  <PrintDialog />
{/if}

<PrintView />
