export type EditorState =
  | null
  | { mode: 'new'; date?: string }
  | { mode: 'activity'; id: string }
  | { mode: 'assignment'; id: string };

export const ui = $state({
  editor: null as EditorState,
  settings: false,
  courses: false,
  webImport: false,
  conflicts: false,
  help: false,
  /** URL shown for manual copying when the clipboard is blocked. */
  copyDialog: null as string | null,
  /** Dark theme active. */
  dark: false,
  /** Keyboard-focused day on the calendar (YYYY-MM-DD), or null. */
  focusDate: null as string | null,
  exporter: false,
  printDialog: false,
  printOpts: {
    calendar: true,
    overview: false,
    cards: false,
  },
});

export function requestPrint() {
  ui.printDialog = false;
  // Let the dialog close and the print view re-render before printing.
  setTimeout(() => window.print(), 100);
}
