/**
 * Keyboard shortcuts.
 *
 * The decision of what a keypress means is separated from the wiring, because
 * the fiddly part is not binding keys: it is refusing to act. A shortcut that
 * fires while someone is typing their search query, or that steals the browser's
 * own Ctrl+F, is worse than having no shortcut at all.
 */

export type Action =
  | { type: 'search' }
  | { type: 'view'; index: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'close' }
  | { type: 'toggleDone' }
  | { type: 'listen' }
  | { type: 'reveal' }
  | { type: 'grade'; grade: 0 | 1 | 2 | 3 }
  | { type: 'help' };

export type KeyEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export type Context = {
  /** The lesson reader is open. */
  inReader: boolean;
  /** A review session is running. */
  inReview: boolean;
  /** A card is showing its answer, so grading keys are live. */
  revealed: boolean;
  /** Focus is in a text field, so almost nothing should fire. */
  typing: boolean;
  /** Any sheet or dialog is open. */
  sheetOpen: boolean;
};

/** True when the event target is somewhere text is being entered. */
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
}

/**
 * Map a keypress to an action, or null to let the browser have it.
 *
 * Deliberately ignores anything with a modifier: Ctrl+F, Cmd+R and friends
 * belong to the browser, and quietly stealing them is a good way to make an app
 * feel broken.
 */
export function actionFor(e: KeyEvent, ctx: Context): Action | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;

  /* Escape is the one key that works everywhere, including mid-typing. */
  if (e.key === 'Escape') return { type: 'close' };

  if (ctx.typing) return null;

  /*
   * Inside a review session the number row grades rather than switching tabs.
   * and 1 to 4 are swallowed even before the answer is shown, because falling
   * through to tab switching there would throw you out of the session you are
   * halfway through.
   */
  if (ctx.inReview) {
    if (e.key === ' ' || e.key === 'Enter') return { type: 'reveal' };
    if (e.key >= '1' && e.key <= '4') {
      if (!ctx.revealed) return null;
      return { type: 'grade', grade: (Number(e.key) - 1) as 0 | 1 | 2 | 3 };
    }
  }

  if (ctx.inReader) {
    if (e.key === 'j' || e.key === 'ArrowRight') return { type: 'next' };
    if (e.key === 'k' || e.key === 'ArrowLeft') return { type: 'prev' };
    if (e.key === ' ' || e.key === 'Enter') return { type: 'toggleDone' };
    if (e.key === 'l') return { type: 'listen' };
    if (e.key === '?') return { type: 'help' };
    /* Tab switching would yank the reader out from under you. */
    return null;
  }

  if (e.key === '/') return { type: 'search' };
  if (e.key === '?') return { type: 'help' };

  /* Number keys pick a tab, but not while a sheet is covering them. */
  if (!ctx.sheetOpen && e.key >= '1' && e.key <= '5') {
    return { type: 'view', index: Number(e.key) - 1 };
  }

  return null;
}

/** The list rendered in the help sheet. Kept beside the logic so they cannot drift. */
export const SHORTCUTS: { keys: string[]; what: string; when?: string }[] = [
  { keys: ['/'], what: 'Search every word of every lesson' },
  { keys: ['1', '-', '5'], what: 'Switch between Learn, Missions, Review, Paths and Proof' },
  { keys: ['j', 'k'], what: 'Next and previous lesson', when: 'reading' },
  { keys: ['Space'], what: 'Mark understood and move on', when: 'reading' },
  { keys: ['l'], what: 'Listen to the lesson', when: 'reading' },
  { keys: ['Space'], what: 'Show the answer', when: 'reviewing' },
  { keys: ['1', '-', '4'], what: 'Grade it: again, hard, good, easy', when: 'reviewing' },
  { keys: ['Esc'], what: 'Close whatever is open' },
  { keys: ['?'], what: 'Show this list' },
];
