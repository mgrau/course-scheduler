<script lang="ts" module>
  let nextId = 0;

  const pad = (n: number) => String(n).padStart(2, '0');

  /** "13:05" → "1:05 PM" */
  export function to12(v: string): string {
    if (!v) return '';
    const [h, m] = v.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return v;
    return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  }

  /** Accepts "10", "1030", "10:30", "130pm", "11:59 PM" … → "23:59" | null */
  export function parseTime(raw: string): string | null {
    const s = raw.trim().toLowerCase().replace(/[\s.]/g, '');
    if (!s) return null;

    // Peel off am/pm first, so "130pm" reads as 1:30 rather than hour 13.
    const suffix = /(am?|pm?)$/.exec(s);
    const mer = suffix?.[1][0];
    const body = suffix ? s.slice(0, suffix.index) : s;

    let h: number;
    let min: number;
    if (body.includes(':')) {
      const [a, b] = body.split(':');
      h = Number(a);
      min = b === '' ? 0 : Number(b);
    } else if (/^\d{1,2}$/.test(body)) {
      h = Number(body);
      min = 0;
    } else if (/^\d{3}$/.test(body)) {
      h = Number(body[0]);
      min = Number(body.slice(1));
    } else if (/^\d{4}$/.test(body)) {
      h = Number(body.slice(0, 2));
      min = Number(body.slice(2));
    } else {
      return null;
    }

    if (!Number.isInteger(h) || !Number.isInteger(min) || min > 59 || h < 0) return null;
    if (mer) {
      if (h < 1 || h > 12) return null;
      if (mer === 'p' && h !== 12) h += 12;
      if (mer === 'a' && h === 12) h = 0;
    } else if (h > 23) return null;
    return `${pad(h)}:${pad(min)}`;
  }

  // Shared suggestion list: every 5 minutes through the teaching day.
  const SUGGESTIONS: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 5) SUGGESTIONS.push(to12(`${pad(h)}:${pad(m)}`));
  }
</script>

<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    value = $bindable(''),
    wrapper = '',
    class: cls = 'w-full rounded border border-gray-300 px-2 py-1',
    placeholder = '10:00 AM',
  }: {
    value?: string;
    /** Layout classes for the field's wrapper (width, margins). */
    wrapper?: string;
    /** Look of the input itself. */
    class?: string;
    placeholder?: string;
  } = $props();

  const id = `time-${nextId++}`;
  let text = $state(to12(value));
  let seen = value;
  let open = $state(false);
  let root: HTMLElement;
  let list = $state<HTMLElement | undefined>();

  // Pick up changes made elsewhere (import, reorder, another course).
  $effect(() => {
    if (value !== seen) {
      seen = value;
      text = to12(value);
    }
  });

  function commit() {
    const parsed = parseTime(text);
    // Clearing the field clears the time; anything unreadable snaps back.
    if (parsed === null && text.trim() !== '') {
      text = to12(value);
      return;
    }
    value = parsed ?? '';
    seen = value;
    text = to12(value);
  }

  function pick(t: string) {
    text = t;
    commit();
    open = false;
  }

  function toggle() {
    open = !open;
    if (open) {
      // Bring the current time (or the nearest hour) into view.
      requestAnimationFrame(() => {
        const target = list?.querySelector('[data-current]') ?? list?.querySelector('[data-hour]');
        target?.scrollIntoView({ block: 'center' });
      });
    }
  }

  function onWindowPointerDown(e: PointerEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="relative {wrapper}" bind:this={root}>
  <input
    type="text"
    class="{cls} pr-7"
    {placeholder}
    role="combobox"
    aria-label="Time"
    aria-autocomplete="list"
    aria-expanded={open}
    aria-controls={id}
    bind:value={text}
    onblur={commit}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
        open = false;
      } else if (e.key === 'Escape') {
        open = false;
      } else if (e.key === 'ArrowDown' && !open) {
        toggle();
      }
    }}
  />
  <button
    type="button"
    class="absolute inset-y-0 right-0 flex items-center pr-1.5 text-gray-400 hover:text-gray-700"
    aria-label="Pick a time"
    tabindex="-1"
    onclick={toggle}
  >
    <Icon name="clock" class="h-4 w-4" />
  </button>

  {#if open}
    <!-- Keep focus in the input so blur-commit never races the click. -->
    <ul
      {id}
      bind:this={list}
      role="listbox"
      class="absolute z-30 mt-1 max-h-56 w-32 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      onmousedown={(e) => e.preventDefault()}
    >
      {#each SUGGESTIONS as t (t)}
        <li>
          <button
            type="button"
            role="option"
            aria-selected={t === to12(value)}
            data-current={t === to12(value) ? '' : undefined}
            data-hour={t.startsWith('12:00') ? '' : undefined}
            class="block w-full px-2 py-1 text-left text-sm hover:bg-sky-50 {t === to12(value)
              ? 'bg-sky-100 font-semibold text-sky-900'
              : 'text-gray-700'}"
            onclick={() => pick(t)}
          >
            {t}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
