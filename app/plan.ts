/**
 * The daily plan.
 *
 * 110 lessons is a backlog, not a habit. This turns a weekly hour budget into
 * one concrete answer to "what do I do today": a named list of lessons plus
 * whatever review is due, and keeps a streak so returning is visible.
 *
 * Pure functions with the date passed in, so the whole thing is testable
 * without waiting for tomorrow.
 */

export type DayRecord = {
  lessons: number;
  cards: number;
  mins: number;
  /** Which lessons, so the weekly review can name them. Absent in older records. */
  ids?: string[];
};
export type History = Record<string, DayRecord>;

export type PlanSettings = {
  /** Hours a week you intend to study. */
  weeklyHours: number;
  /** How many days a week you intend to sit down. */
  daysPerWeek: number;
};

export const DEFAULT_SETTINGS: PlanSettings = { weeklyHours: 10, daysPerWeek: 5 };

/** Roughly how long one review card takes, in minutes. */
export const CARD_MINS = 0.25;

/**
 * A plan is never longer than this, however large the budget. A list of twelve
 * things is a backlog wearing a plan's clothing, and nobody starts one.
 */
export const MAX_LESSONS_PER_DAY = 4;

/**
 * How long a lesson really takes.
 *
 * Lesson.mins is reading time: six to ten minutes. The stage's own hour
 * estimate covers the reading plus the lab, the notes and the exercise, and
 * that is the number a study plan has to budget against. Planning on reading
 * time alone produces a cheerful list of twelve lessons a day and a course
 * nobody finishes.
 */
export function studyMinsFor(stageHours: number, lessonsInStage: number): number {
  return Math.round((stageHours * 60) / Math.max(1, lessonsInStage));
}

/** "2h 30m" reads better than "150 minutes" once past an hour or so. */
export function humanMins(mins: number): string {
  if (mins < 90) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Local date, not UTC. toISOString would roll the day over at the wrong moment
 * for anyone not on GMT: in Colombo that is 5:30am, which would silently break
 * the streak of anyone studying late.
 */
export function dayKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

export function dailyBudget({ weeklyHours, daysPerWeek }: PlanSettings): number {
  const days = Math.max(1, Math.min(7, daysPerWeek));
  return Math.round((weeklyHours * 60) / days);
}

/**
 * Consecutive days of activity ending today or yesterday.
 *
 * Yesterday still counts, because a streak that breaks at midnight punishes
 * people for not having studied yet on a day that is still in progress.
 */
export function streak(history: History, today: string = dayKey()): number {
  const active = (k: string) => {
    const r = history[k];
    return Boolean(r && (r.lessons > 0 || r.cards > 0));
  };

  let cursor = active(today) ? today : shiftDay(today, -1);
  if (!active(cursor)) return 0;

  let count = 0;
  while (active(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

/** The last seven day keys, oldest first, for the week strip. */
export function weekWindow(today: string = dayKey()): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
}

export function minutesThisWeek(history: History, today: string = dayKey()): number {
  return weekWindow(today).reduce((sum, k) => sum + (history[k]?.mins ?? 0), 0);
}

export type PlanInput = {
  budgetMins: number;
  /** Cards due now. */
  dueCards: number;
  /** Upcoming lessons in course order, with their reading times. */
  nextLessons: { id: string; mins: number }[];
  /** What has already been done today. */
  doneToday: DayRecord | undefined;
};

export type Plan = {
  /** Lesson ids to read today. */
  lessons: string[];
  /** Cards to review today. */
  cards: number;
  /** Estimated minutes for what remains. */
  mins: number;
  /** Minutes already done today. */
  doneMins: number;
  budgetMins: number;
  /** True when the budget is already met. */
  complete: boolean;
};

/**
 * Build today's plan.
 *
 * Review comes before new reading, always. Cards are scheduled to arrive just
 * before they would be forgotten, so a skipped review costs more than a skipped
 * lesson, and nothing is more discouraging than a review backlog nobody
 * cleared because there was always a new chapter to start.
 */
export function buildPlan({ budgetMins, dueCards, nextLessons, doneToday }: PlanInput): Plan {
  const doneMins = doneToday?.mins ?? 0;
  const remaining = Math.max(0, budgetMins - doneMins);

  /* Cap a review backlog so a fortnight away does not present 300 cards. */
  const cards = Math.min(dueCards, 60);
  const cardMins = Math.round(cards * CARD_MINS);

  let left = remaining - cardMins;
  const lessons: string[] = [];
  let lessonMins = 0;

  for (const lesson of nextLessons) {
    if (lessons.length >= MAX_LESSONS_PER_DAY) break;
    /* Always offer one lesson if any budget is left, so a short day still
       moves the course forward rather than being review-only. */
    if (lessons.length > 0 && lesson.mins > left) break;
    if (left <= 0) break;
    lessons.push(lesson.id);
    lessonMins += lesson.mins;
    left -= lesson.mins;
  }

  const mins = cardMins + lessonMins;
  return {
    lessons,
    cards,
    mins,
    doneMins,
    budgetMins,
    complete: remaining <= 0 || (cards === 0 && lessons.length === 0),
  };
}

/** Fold one session into the history. */
export function record(history: History, day: string, add: Partial<DayRecord>): History {
  const prev = history[day] ?? { lessons: 0, cards: 0, mins: 0 };
  /* Deduplicated, because completing then un-completing then completing again
     should not make the week look busier than it was. */
  const ids = [...new Set([...(prev.ids ?? []), ...(add.ids ?? [])])];
  return {
    ...history,
    [day]: {
      lessons: prev.lessons + (add.lessons ?? 0),
      cards: prev.cards + (add.cards ?? 0),
      mins: prev.mins + (add.mins ?? 0),
      ...(ids.length ? { ids } : {}),
    },
  };
}

export type WeekSummary = {
  mins: number;
  lessons: number;
  cards: number;
  /** Days out of seven with any activity. */
  activeDays: number;
  /** Lesson ids finished this week, in the order they were finished. */
  lessonIds: string[];
  /** Minutes in the seven days before this one, for the comparison. */
  prevMins: number;
};

/** Everything the weekly review screen needs, in one pass. */
export function summariseWeek(history: History, today: string = dayKey()): WeekSummary {
  const days = weekWindow(today);
  let mins = 0;
  let lessons = 0;
  let cards = 0;
  let activeDays = 0;
  const lessonIds: string[] = [];

  for (const key of days) {
    const r = history[key];
    if (!r) continue;
    mins += r.mins;
    lessons += r.lessons;
    cards += r.cards;
    if (r.lessons > 0 || r.cards > 0) activeDays += 1;
    for (const id of r.ids ?? []) if (!lessonIds.includes(id)) lessonIds.push(id);
  }

  const prevMins = weekWindow(shiftDay(today, -7)).reduce((sum, k) => sum + (history[k]?.mins ?? 0), 0);
  return { mins, lessons, cards, activeDays, lessonIds, prevMins };
}

/** Keep the history from growing without bound: a year is plenty. */
export function prune(history: History, today: string = dayKey()): History {
  const cutoff = shiftDay(today, -365);
  return Object.fromEntries(Object.entries(history).filter(([k]) => k >= cutoff));
}
