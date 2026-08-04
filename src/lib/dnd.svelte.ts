import { store } from './store.svelte';

/*
 * Pointer-based drag and drop for calendar chips, replacing HTML5 DnD so it
 * works on touchscreens. Mouse: dragging starts after a few pixels of
 * movement (a plain click still opens the editor). Touch: press and hold
 * ~300ms lifts the chip; moving earlier is treated as a scroll.
 *
 * Drop targets declare themselves with data-drop-date="YYYY-MM-DD" or
 * data-drop-tray; hit-testing uses elementFromPoint, so it works for both
 * the grid and the phone agenda layout.
 */

export interface DragPayload {
  kind: 'activity' | 'assigned' | 'due';
  id: string;
  title: string;
  color: string;
  template: boolean;
}

export const dnd = $state({
  active: null as DragPayload | null,
  x: 0,
  y: 0,
  /** Hovered valid target: a date string, 'tray', or null. */
  over: null as string | null,
});

export function startChipDrag(
  e: PointerEvent,
  payload: DragPayload,
  onSettled: (dragged: boolean) => void,
) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  const isTouch = e.pointerType !== 'mouse';
  const sx = e.clientX;
  const sy = e.clientY;
  let lifted = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  const lift = (x: number, y: number) => {
    lifted = true;
    dnd.active = payload;
    dnd.x = x;
    dnd.y = y;
    document.body.classList.add('dragging');
  };

  const findOver = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    const drop = el?.closest?.('[data-drop-date], [data-drop-tray]');
    if (!drop) return null;
    if (drop.hasAttribute('data-drop-tray')) {
      return payload.kind === 'activity' ? 'tray' : null;
    }
    return drop.getAttribute('data-drop-date');
  };

  const autoscroll = (y: number) => {
    const scroller = document.querySelector('main');
    if (!scroller) return;
    const margin = 110;
    if (y < margin) scroller.scrollTop -= (margin - y) * 0.4;
    else if (y > innerHeight - margin) scroller.scrollTop += (y - (innerHeight - margin)) * 0.4;
  };

  const onMove = (ev: PointerEvent) => {
    if (!lifted) {
      const dist = Math.hypot(ev.clientX - sx, ev.clientY - sy);
      if (!isTouch && dist > 6) lift(ev.clientX, ev.clientY);
      else if (isTouch && dist > 12) cancel(); // the user is scrolling
      return;
    }
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    dnd.over = findOver(ev.clientX, ev.clientY);
    autoscroll(ev.clientY);
  };

  // Once lifted, the page must not scroll under the drag (touch only).
  const blockTouchScroll = (ev: TouchEvent) => {
    if (lifted) ev.preventDefault();
  };

  const finish = (ev: PointerEvent) => {
    const wasLifted = lifted;
    cleanup();
    if (!wasLifted) {
      onSettled(false);
      return;
    }
    const over = findOver(ev.clientX, ev.clientY);
    if (over === 'tray') {
      if (payload.kind === 'activity' && !payload.template) {
        store.moveActivity(payload.id, undefined);
      }
    } else if (over) {
      if (payload.kind === 'activity') store.placeActivity(payload.id, over);
      else store.moveAssignment(payload.id, payload.kind, over);
    }
    onSettled(true);
  };

  const cancel = () => {
    cleanup();
    onSettled(false);
  };

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') cancel();
  };

  function cleanup() {
    clearTimeout(holdTimer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('touchmove', blockTouchScroll);
    window.removeEventListener('keydown', onKey);
    document.body.classList.remove('dragging');
    dnd.active = null;
    dnd.over = null;
  }

  if (isTouch) holdTimer = setTimeout(() => lift(sx, sy), 300);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('touchmove', blockTouchScroll, { passive: false });
  window.addEventListener('keydown', onKey);
}
