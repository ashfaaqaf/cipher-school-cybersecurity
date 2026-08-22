'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Dialog focus handling.
 *
 * A modal you can Tab out of is only a modal visually: a keyboard or screen
 * reader user lands behind it, in content that is meant to be inert, with no
 * indication anything is open. This keeps focus inside while the dialog lives
 * and puts it back where it came from on close, so the reading position is not
 * lost every time a lesson is opened.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;

    /* Move focus in, but to the dialog itself rather than its first button —
       landing on "Mark as understood" would read the action before the title. */
    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusableIn(root);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (e.shiftKey && (current === first || current === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      /* Only restore if focus is still inside the dialog being torn down —
         otherwise we would yank it away from wherever the user has since gone. */
      if (previous && root.contains(document.activeElement)) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
