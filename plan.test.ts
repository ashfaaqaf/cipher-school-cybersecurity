/**
 * Study-plan self-check. Run it with:  node plan.test.ts
 *
 * The date handling is the part most likely to be subtly wrong, so most of
 * these assertions are about days and streaks rather than arithmetic.
 */
import assert from 'node:assert/strict';
import {
  CARD_MINS,
  MAX_LESSONS_PER_DAY,
  humanMins,
  studyMinsFor,
  buildPlan,
  dailyBudget,
  dayKey,
  minutesThisWeek,
  prune,
  record,
  shiftDay,
  streak,
  summariseWeek,
  weekWindow,
  type History,
} from './app/plan.ts';

// --- dates --------------------------------------------------------------

assert.equal(dayKey(new Date(2026, 7, 22)), '2026-08-22', 'day keys are zero-padded local dates');
assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');

// Local, not UTC. Late evening in a positive-offset zone must still be today —
// this is the bug that would silently break streaks for anyone east of GMT.
const lateEvening = new Date(2026, 7, 22, 23, 30);
assert.equal(dayKey(lateEvening), '2026-08-22', 'a late evening is still the same local day');

assert.equal(shiftDay('2026-08-22', -1), '2026-08-21');
assert.equal(shiftDay('2026-03-01', -1), '2026-02-28', 'month boundaries roll correctly');
assert.equal(shiftDay('2026-01-01', -1), '2025-12-31', 'year boundaries roll correctly');
assert.equal(shiftDay('2024-03-01', -1), '2024-02-29', 'leap day exists in a leap year');

const week = weekWindow('2026-08-22');
assert.equal(week.length, 7);
assert.equal(week[6], '2026-08-22', 'the window ends today');
assert.equal(week[0], '2026-08-16', 'and starts six days back');

// --- budget -------------------------------------------------------------

assert.equal(dailyBudget({ weeklyHours: 10, daysPerWeek: 5 }), 120, '10h over 5 days is 2h a day');
assert.equal(dailyBudget({ weeklyHours: 7, daysPerWeek: 7 }), 60);
assert.equal(dailyBudget({ weeklyHours: 10, daysPerWeek: 0 }), 600, 'zero days is clamped to one');
assert.equal(dailyBudget({ weeklyHours: 10, daysPerWeek: 99 }), 86, 'more than seven days is clamped');

// --- streaks ------------------------------------------------------------

const active = (n: number): DayRecordLike => ({ lessons: n, cards: 0, mins: n * 7 });
type DayRecordLike = { lessons: number; cards: number; mins: number };

const h: History = {
  '2026-08-18': active(1),
  '2026-08-19': active(2),
  '2026-08-20': active(1),
  '2026-08-22': active(1),
};

assert.equal(streak(h, '2026-08-22'), 1, 'today alone, with a gap yesterday');
assert.equal(streak(h, '2026-08-20'), 3, 'three consecutive days ending today');
assert.equal(streak(h, '2026-08-21'), 3, 'yesterday still counts, since today is not over');
assert.equal(streak(h, '2026-08-25'), 0, 'a two-day gap ends the streak');
assert.equal(streak({}, '2026-08-22'), 0, 'no history is no streak');

// A day recorded with nothing actually done must not hold a streak open.
assert.equal(
  streak({ '2026-08-22': { lessons: 0, cards: 0, mins: 0 } }, '2026-08-22'),
  0,
  'an empty day does not count as activity',
);
assert.equal(streak({ '2026-08-22': { lessons: 0, cards: 3, mins: 1 } }, '2026-08-22'), 1,
  'review alone is activity');

assert.equal(minutesThisWeek(h, '2026-08-22'), 7 + 14 + 7 + 7, 'only the last seven days count');
assert.equal(minutesThisWeek(h, '2026-09-30'), 0, 'a month later, nothing is in the window');

// --- the plan -----------------------------------------------------------

const lessons = [
  { id: 'a', mins: 30 },
  { id: 'b', mins: 30 },
  { id: 'c', mins: 30 },
  { id: 'd', mins: 30 },
];

let p = buildPlan({ budgetMins: 120, dueCards: 40, nextLessons: lessons, doneToday: undefined });
assert.equal(p.cards, 40, 'all due cards are scheduled');
assert.equal(p.lessons.length, 3, '120 minutes less 10 of review leaves three 30-minute lessons');
assert.equal(p.mins, Math.round(40 * CARD_MINS) + 90);
assert.equal(p.complete, false);

// Work already done today reduces what is left.
p = buildPlan({ budgetMins: 120, dueCards: 0, nextLessons: lessons, doneToday: { lessons: 2, cards: 0, mins: 100 } });
assert.equal(p.doneMins, 100);
assert.equal(p.lessons.length, 1, 'only 20 minutes left, so one lesson is still offered');

// Meeting the budget completes the day.
p = buildPlan({ budgetMins: 120, dueCards: 0, nextLessons: lessons, doneToday: { lessons: 4, cards: 0, mins: 130 } });
assert.equal(p.complete, true, 'over budget means done');
assert.equal(p.lessons.length, 0, 'and nothing more is suggested');

// A short day still moves the course forward rather than being review-only.
p = buildPlan({ budgetMins: 15, dueCards: 8, nextLessons: lessons, doneToday: undefined });
assert.equal(p.lessons.length, 1, 'at least one lesson is always offered while budget remains');

// A long absence must not present an unusable wall of review.
p = buildPlan({ budgetMins: 120, dueCards: 500, nextLessons: lessons, doneToday: undefined });
assert.equal(p.cards, 60, 'a review backlog is capped');

// Finishing the course leaves review only, and that is not a failure state.
p = buildPlan({ budgetMins: 120, dueCards: 12, nextLessons: [], doneToday: undefined });
assert.deepEqual(p.lessons, []);
assert.equal(p.cards, 12);
assert.equal(p.complete, false, 'there is still review to do');

// Nothing due and nothing left really is done.
p = buildPlan({ budgetMins: 120, dueCards: 0, nextLessons: [], doneToday: undefined });
assert.equal(p.complete, true);

// However big the budget, a plan stays a plan rather than becoming a backlog.
const many = Array.from({ length: 30 }, (_, i) => ({ id: `x${i}`, mins: 5 }));
p = buildPlan({ budgetMins: 600, dueCards: 0, nextLessons: many, doneToday: undefined });
assert.equal(p.lessons.length, MAX_LESSONS_PER_DAY, 'a day is capped at a startable number of lessons');

// --- honest lesson length -----------------------------------------------

// Stage 00 is 20 hours across 8 lessons: 150 minutes each, not the 6 minutes it
// takes to read one. Budgeting on reading time is what produced a twelve-lesson
// day, which is not a plan anybody starts.
assert.equal(studyMinsFor(20, 8), 150, 'study time comes from the stage hours, not reading time');
assert.equal(studyMinsFor(45, 8), 338);
assert.equal(studyMinsFor(10, 0), 600, 'no divide-by-zero on an empty stage');

assert.equal(humanMins(36), '36 min');
assert.equal(humanMins(89), '89 min');
assert.equal(humanMins(120), '2h');
assert.equal(humanMins(150), '2h 30m');

// --- recording ----------------------------------------------------------

let hist: History = {};
hist = record(hist, '2026-08-22', { lessons: 1, mins: 7 });
hist = record(hist, '2026-08-22', { cards: 12, mins: 3 });
assert.deepEqual(hist['2026-08-22'], { lessons: 1, cards: 12, mins: 10 }, 'sessions accumulate');
assert.equal(Object.keys(hist).length, 1, 'and stay on one day');

// Lesson ids accumulate without duplicating, so a toggle does not inflate the week.
let withIds: History = {};
withIds = record(withIds, '2026-08-22', { lessons: 1, mins: 150, ids: ['00-1'] });
withIds = record(withIds, '2026-08-22', { lessons: 1, mins: 150, ids: ['00-1', '00-2'] });
assert.deepEqual(withIds['2026-08-22'].ids, ['00-1', '00-2'], 'ids are deduplicated');

// --- the weekly review --------------------------------------------------

const weekHist: History = {
  '2026-08-10': { lessons: 2, cards: 0, mins: 300 },              // the week before
  '2026-08-17': { lessons: 1, cards: 10, mins: 160, ids: ['00-1'] },
  '2026-08-19': { lessons: 2, cards: 20, mins: 320, ids: ['00-2', '00-3'] },
  '2026-08-22': { lessons: 0, cards: 5, mins: 2 },
};

const sum = summariseWeek(weekHist, '2026-08-22');
assert.equal(sum.lessons, 3, 'lessons across the window are totalled');
assert.equal(sum.cards, 35);
assert.equal(sum.mins, 482);
assert.equal(sum.activeDays, 3, 'three of the seven days had activity');
assert.deepEqual(sum.lessonIds, ['00-1', '00-2', '00-3'], 'and it can name them');
assert.equal(sum.prevMins, 300, 'the previous seven days are counted separately');

// A record from before ids existed must not break the summary.
assert.deepEqual(summariseWeek({ '2026-08-22': { lessons: 1, cards: 0, mins: 30 } }, '2026-08-22').lessonIds, [],
  'older records simply contribute no names');

const quiet = summariseWeek({}, '2026-08-22');
assert.deepEqual(quiet, { mins: 0, lessons: 0, cards: 0, activeDays: 0, lessonIds: [], prevMins: 0 });

const old = prune({ '2020-01-01': active(1), '2026-08-22': active(1) }, '2026-08-22');
assert.deepEqual(Object.keys(old), ['2026-08-22'], 'history older than a year is dropped');

console.log('plan: all checks passed');
