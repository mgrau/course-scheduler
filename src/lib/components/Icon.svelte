<script lang="ts">
  // Minimal inline icon set (lucide-style 24px stroke paths).
  const icons: Record<string, string[]> = {
    plus: ['M12 5v14', 'M5 12h14'],
    link: [
      'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
      'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    ],
    check: ['M20 6 9 17l-5-5'],
    library: ['m16 6 4 14', 'M12 6v14', 'M8 8v12', 'M4 4v16'],
    settings: [
      'M21 4h-7',
      'M10 4H3',
      'M21 12h-9',
      'M8 12H3',
      'M21 20h-5',
      'M12 20H3',
      'M14 2v4',
      'M8 10v4',
      'M16 18v4',
    ],
    import: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
    export: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
    grip: ['M4 9h16', 'M4 15h16'],
    undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
    redo: ['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
    sun: [
      'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10',
      'M12 3v1.5',
      'M12 19.5V21',
      'M4.6 4.6l1.1 1.1',
      'M18.3 18.3l1.1 1.1',
      'M3 12h1.5',
      'M19.5 12H21',
      'M4.6 19.4l1.1-1.1',
      'M18.3 5.7l1.1-1.1',
    ],
    moon: ['M12 3a6.4 6.4 0 0 0 8.6 8.6A9 9 0 1 1 12 3Z'],
    warning: [
      'm21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      'M12 9v4',
      'M12 17h.01',
    ],
    clock: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18', 'M12 7.2V12l3.4 2'],
    x: ['M18 6 6 18', 'm6 6 12 12'],
    copy: [
      'M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z',
      'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
    ],
    trash: [
      'M3 6h18',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
      'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      'M10 11v6',
      'M14 11v6',
    ],
    printer: [
      'M6 9V2h12v7',
      'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
      'M6 14h12v8H6z',
    ],
  };

  let { name, class: cls = 'h-4 w-4' }: { name: string; class?: string } = $props();
</script>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="shrink-0 {cls}"
  aria-hidden="true"
>
  {#each icons[name] ?? [] as d (d)}
    <path {d} />
  {/each}
</svg>
