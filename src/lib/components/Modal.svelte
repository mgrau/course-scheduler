<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    onclose,
    wide = false,
    children,
  }: { title: string; onclose: () => void; wide?: boolean; children: Snippet } = $props();

  function backdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
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
    aria-label={title}
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
