/**
 * Spaced repetition, SM-2 with the two adjustments everyone ends up making:
 * "hard" shrinks the interval instead of merely slowing its growth, and "easy"
 * gets a bonus multiplier. Intervals are whole days, which is all a study app
 * needs — sub-day scheduling is a feature for people cramming, and cramming is
 * the thing spaced repetition exists to replace.
 */

export type CardState = {
  /** How generous future intervals are. Starts at 2.5, never drops below 1.3. */
  ease: number;
  /** Days until the next review. */
  interval: number;
  /** Consecutive successful reviews. Reset to 0 by a lapse. */
  reps: number;
  /** Epoch day this card is next due. */
  due: number;
  /** How many times it has been forgotten. High lapses means the card is badly written. */
  lapses: number;
};

/** 0 again, 1 hard, 2 good, 3 easy. Four buttons is the most people will reliably use. */
export type Grade = 0 | 1 | 2 | 3;

export const DAY_MS = 86_400_000;
/** Beyond a year the exact number stops meaning anything, so stop growing. */
export const MAX_INTERVAL = 365;
const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function today(now: number = Date.now()): number {
  return Math.floor(now / DAY_MS);
}

export function freshState(day: number): CardState {
  return { ease: START_EASE, interval: 0, reps: 0, due: day, lapses: 0 };
}

/**
 * Grade a card and return its next state. Pure — the caller owns persistence,
 * which keeps this testable without a browser.
 */
export function schedule(prev: CardState | undefined, grade: Grade, day: number = today()): CardState {
  const state = prev ?? freshState(day);

  // SM-2 quality is 0–5; our four buttons map onto the top four.
  const q = grade + 2;
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (grade === 0) {
    // Forgotten. Back to the start of the ladder and shown again in this session.
    return { ease, interval: 0, reps: 0, due: day, lapses: state.lapses + 1 };
  }

  const reps = state.reps + 1;
  let interval: number;
  if (reps === 1) {
    interval = 1;
  } else if (reps === 2) {
    interval = grade === 1 ? 3 : 6;
  } else if (grade === 1) {
    // Hard: shrink rather than grow, but never below a day.
    interval = Math.max(1, Math.round(state.interval * 1.2));
  } else {
    const bonus = grade === 3 ? 1.3 : 1;
    interval = Math.max(1, Math.round(state.interval * ease * bonus));
  }

  interval = Math.min(MAX_INTERVAL, interval);
  return { ease, interval, reps, due: day + interval, lapses: state.lapses };
}

export type Deck = Record<string, CardState>;

/** Cards that are unlocked and due today or earlier, oldest due first. */
export function dueNow(deck: Deck, unlocked: string[], day: number = today()): string[] {
  return unlocked
    .filter((id) => (deck[id]?.due ?? day) <= day)
    .sort((a, b) => (deck[a]?.due ?? -Infinity) - (deck[b]?.due ?? -Infinity));
}

export type DeckStats = {
  /** Unlocked but never reviewed. */
  fresh: number;
  /** Reviewed, next review within a week. */
  learning: number;
  /** Interval of three weeks or more — this is the "locked in" number. */
  known: number;
  due: number;
  /** Epoch day of the soonest upcoming review, when nothing is due now. */
  nextDue: number | null;
};

export function deckStats(deck: Deck, unlocked: string[], day: number = today()): DeckStats {
  let fresh = 0;
  let learning = 0;
  let known = 0;
  let due = 0;
  let nextDue: number | null = null;

  for (const id of unlocked) {
    const s = deck[id];
    if (!s || s.reps === 0) fresh += 1;
    else if (s.interval >= 21) known += 1;
    else learning += 1;

    if (!s || s.due <= day) due += 1;
    else if (nextDue === null || s.due < nextDue) nextDue = s.due;
  }

  return { fresh, learning, known, due, nextDue };
}

/** Human phrasing for the next interval, shown on the grading buttons. */
export function intervalLabel(days: number): string {
  if (days <= 0) return 'now';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}
