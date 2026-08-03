<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    onclose,
    wide = false,
    children,
  }: { title: string; onclose: () => void; wide?: boolean; children: Snippet } = $props();

  let panel = $state<HTMLElement | undefined>();

  function backdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
  }

  // Focus management: focus moves into the dialog on open (unless a field
  // inside autofocused itself), Tab is trapped within it, and focus returns
  // to the opener on close.
  $effect(() => {
    const opener = document.activeElement as HTMLElement | null;
    if (panel && !panel.contains(document.activeElement)) {
      (panel.querySelector<HTMLElement>('[autofocus]') ?? panel).focus();
    }
    return () => opener?.focus?.();
  });

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapTab(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || current === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="screen-only fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
  onclick={backdropClick}
>
  <div
    class="w-full {wide ? 'max-w-2xl' : 'max-w-lg'} rounded-xl bg-white p-5 shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    bind:this={panel}
    onkeydown={trapTab}
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{title}</h2>
      <button
        class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onclick={onclose}
        aria-label="Close">✕</button
      >
    </div>
    {@render children()}
  </div>
</div>
