export type EditorState =
  | null
  | { mode: 'new'; date?: string }
  | { mode: 'activity'; id: string }
  | { mode: 'assignment'; id: string };

export const ui = $state({
  editor: null as EditorState,
  settings: false,
  courses: false,
  exporter: false,
  printDialog: false,
  printOpts: {
    calendar: true,
    cards: false,
  },
});

export function requestPrint() {
  ui.printDialog = false;
  // Let the dialog close and the print view re-render before printing.
  setTimeout(() => window.print(), 100);
}
