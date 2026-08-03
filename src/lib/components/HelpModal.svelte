<script lang="ts">
  import { ui } from '../ui.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = mac ? '⌘' : 'Ctrl+';

  const keys: [string, string][] = [
    [`${mod}Z`, 'Undo'],
    [mac ? '⇧⌘Z' : 'Ctrl+Y', 'Redo'],
    ['← → ↑ ↓', 'Move the day focus around the calendar'],
    ['Enter', 'New item on the focused day'],
    ['Esc', 'Close a dialog / clear the day focus'],
    ['?', 'Open this help'],
  ];
</script>

<Modal title="Help" onclose={() => (ui.help = false)}>
  <div class="space-y-4 text-sm">
    <section>
      <h3 class="mb-1.5 font-semibold text-gray-700">Keyboard shortcuts</h3>
      <table class="w-full text-sm">
        <tbody>
          {#each keys as [k, what] (k)}
            <tr>
              <td class="w-24 py-0.5 pr-3">
                <kbd
                  class="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-700"
                  >{k}</kbd
                >
              </td>
              <td class="py-0.5 text-gray-600">{what}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section>
      <h3 class="mb-1.5 font-semibold text-gray-700">Good to know</h3>
      <ul class="list-disc space-y-1 pl-4 text-gray-600">
        <li>Click any day to add an item; drag chips to move them. Assignments have separately
          draggable "assigned →" and "→ due" chips.</li>
        <li>The <b>Unscheduled</b> tray holds undated items; <b>reusable</b> ones stay there and
          drop copies onto the calendar.</li>
        <li>Items on holidays or outside the term get a red ring, and the header shows a warning
          badge listing all conflicts.</li>
        <li>Moving the term start in Settings shifts the whole schedule with it; each class
          meeting can also be limited to a date range (e.g. no classes during exam week).</li>
        <li><b>Copy link</b> packs the entire course into the URL — anyone opening it gets their
          own copy. Export offers YAML, Markdown, HTML (for Canvas), LaTeX, and .ics.</li>
        <li>Everything is saved in this browser only, so export a YAML backup of anything you
          care about.</li>
      </ul>
    </section>

    <a
      class="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      href="https://github.com/mgrau/course-scheduler"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="github" />
      mgrau/course-scheduler on GitHub — source, issues, and ideas welcome
    </a>
  </div>
</Modal>
