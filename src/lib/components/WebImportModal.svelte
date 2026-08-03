<script lang="ts">
  import { parseDate, shortDate } from '../dates';
  import { shiftSchedule } from '../model';
  import { store } from '../store.svelte';
  import { ui } from '../ui.svelte';
  import { fetchPageText, parseDatedLines, type FoundDate } from '../webimport';
  import Modal from './Modal.svelte';

  let url = $state('');
  let pasted = $state('');
  let loading = $state(false);
  let error = $state('');
  let found = $state<FoundDate[]>([]);
  let scanned = $state(false);

  function close() {
    ui.webImport = false;
  }

  async function fetchUrl() {
    loading = true;
    error = '';
    try {
      const text = await fetchPageText(url.trim());
      scan(text);
      if (!found.length) error = 'No dates found on that page — try pasting its text below.';
    } catch (e) {
      error = `${e instanceof Error ? e.message : e} — copy the page's text and paste it below instead.`;
    } finally {
      loading = false;
    }
  }

  function scan(text: string) {
    found = parseDatedLines(text);
    scanned = true;
  }

  function fmtRange(f: FoundDate): string {
    const a = shortDate(parseDate(f.start));
    return f.end === f.start ? a : `${a} – ${shortDate(parseDate(f.end))}`;
  }

  const applyCount = $derived(found.filter((f) => f.role !== 'ignore').length);

  function apply() {
    const s = store.schedule;
    // A new term start shifts the whole schedule with it (same behavior as
    // editing the start date in Settings), so scheduled items keep their
    // position relative to the first day of class.
    const startEntry = found.find((f) => f.role === 'start' || f.role === 'term');
    if (startEntry) {
      const days = Math.round(
        (parseDate(startEntry.start).getTime() - parseDate(s.course.term.start).getTime()) /
          86400000,
      );
      if (days !== 0) shiftSchedule(s, days);
    }
    // Then pin the exact end date, which only resizes the term.
    for (const f of found) {
      if (f.role === 'end' || f.role === 'term') s.course.term.end = f.end;
    }
    for (const f of found) {
      if (f.role !== 'holiday') continue;
      // Pages list the whole year; only holidays touching this term matter.
      if (f.end < s.course.term.start || f.start > s.course.term.end) continue;
      const dup = s.holidays.some((h) => h.start === f.start && h.end === f.end);
      if (!dup) s.holidays.push({ start: f.start, end: f.end, label: f.label });
    }
    close();
  }
</script>

<Modal title="Import dates from a website" onclose={close} wide>
  <div class="space-y-3 text-sm">
    <p class="text-xs text-gray-500">
      Point this at an academic calendar page — every line with a date is offered below, and you
      choose what each one means. Nothing changes until you press Apply.
    </p>

    <div class="flex gap-2">
      <input
        class="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5"
        placeholder="https://your-university.edu/academic-calendar…"
        bind:value={url}
        onkeydown={(e) => e.key === 'Enter' && fetchUrl()}
      />
      <button
        class="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        onclick={fetchUrl}
        disabled={loading || !url.trim()}
      >
        {loading ? 'Fetching…' : 'Fetch'}
      </button>
    </div>

    <details>
      <summary class="cursor-pointer text-xs text-gray-500">
        …or paste the page's text here (always works)
      </summary>
      <textarea
        class="mt-1 w-full rounded border border-gray-300 p-2 font-mono text-xs"
        rows="5"
        placeholder="Select-all and copy the calendar page, then paste it here."
        bind:value={pasted}
        oninput={() => scan(pasted)}
      ></textarea>
    </details>

    {#if error}
      <p class="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">{error}</p>
    {/if}

    {#if found.length}
      <div class="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-gray-50 text-left text-gray-500">
            <tr>
              <th class="px-2 py-1.5 font-medium">Found</th>
              <th class="px-2 py-1.5 font-medium">Date(s)</th>
              <th class="w-36 px-2 py-1.5 font-medium">Import as</th>
            </tr>
          </thead>
          <tbody>
            {#each found as f, i (i)}
              <tr class="border-t border-gray-200 {f.role === 'ignore' ? 'opacity-50' : ''}">
                <td class="px-2 py-1">{f.label}</td>
                <td class="whitespace-nowrap px-2 py-1">{fmtRange(f)}</td>
                <td class="px-2 py-1">
                  <select
                    class="w-full rounded border border-gray-300 px-1 py-0.5"
                    bind:value={f.role}
                  >
                    <option value="ignore">—</option>
                    <option value="holiday">Holiday</option>
                    <option value="start">Term start</option>
                    <option value="end">Term end</option>
                    <option value="term">Term start + end</option>
                  </select>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if scanned}
      <p class="text-xs text-gray-500">No dated lines found yet.</p>
    {/if}

    <div class="flex justify-end gap-2 pt-1">
      <button class="rounded px-3 py-1.5 text-gray-600 hover:bg-gray-100" onclick={close}>
        Cancel
      </button>
      <button
        class="rounded-lg bg-blue-600 px-4 py-1.5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        onclick={apply}
        disabled={applyCount === 0}
      >
        Apply {applyCount || ''} item{applyCount === 1 ? '' : 's'}
      </button>
    </div>
  </div>
</Modal>
