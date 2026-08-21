/**
 * Scheduler self-check. Run it with:  node srs.test.ts
 * (Node 24 strips the types itself, so there is no test framework to install.)
 */
import assert from 'node:assert/strict';
import { deckStats, dueNow, intervalLabel, schedule, type CardState, type Deck } from './app/srs.ts';

const DAY = 0;

// A brand-new card graded "good" comes back tomorrow, then in six days.
let s: CardState = schedule(undefined, 2, DAY);
assert.equal(s.interval, 1, 'first good review is 1 day');
assert.equal(s.due, DAY + 1);
s = schedule(s, 2, DAY + 1);
assert.equal(s.interval, 6, 'second good review is 6 days');

// From there intervals grow by the ease factor.
const third = schedule(s, 2, DAY + 7);
assert.equal(third.interval, Math.round(6 * third.ease), 'mature intervals multiply by ease');
assert.ok(third.interval > 6, 'a remembered card should wait longer next time');

// "Easy" must outpace "good", and "hard" must fall behind it.
assert.ok(schedule(s, 3, DAY + 7).interval > third.interval, 'easy earns a bonus');
assert.ok(schedule(s, 1, DAY + 7).interval < third.interval, 'hard shrinks the interval');

// Forgetting resets the ladder, counts a lapse, and requeues the card immediately.
const lapsed = schedule(third, 0, DAY + 30);
assert.equal(lapsed.reps, 0, 'a lapse resets the streak');
assert.equal(lapsed.interval, 0);
assert.equal(lapsed.due, DAY + 30, 'a forgotten card comes back in this session');
assert.equal(lapsed.lapses, 1);

// Ease drifts down when a card keeps being hard, but never past the floor.
let hard: CardState | undefined;
for (let i = 0; i < 40; i += 1) hard = schedule(hard, 0, DAY);
assert.equal(hard!.ease, 1.3, 'ease bottoms out at 1.3 rather than going negative');

// Intervals are capped so nothing schedules itself past a year.
let long: CardState | undefined;
let d = DAY;
for (let i = 0; i < 20; i += 1) {
  long = schedule(long, 3, d);
  d += long.interval;
}
assert.ok(long!.interval <= 365, 'interval is capped at a year');

// Only unlocked cards are ever queued, and never-seen cards count as due.
const deck: Deck = { a: { ease: 2.5, interval: 10, reps: 3, due: DAY + 5, lapses: 0 } };
assert.deepEqual(dueNow(deck, ['a'], DAY), [], 'a card scheduled ahead is not due');
assert.deepEqual(dueNow(deck, ['a'], DAY + 5), ['a'], 'it is due on its due day');
assert.deepEqual(dueNow(deck, ['a', 'b'], DAY), ['b'], 'an unseen unlocked card is due immediately');
assert.deepEqual(dueNow(deck, [], DAY), [], 'locked cards never appear');

// Stats separate what is genuinely known from what is still being learned.
const stats = deckStats(
  { known: { ease: 2.5, interval: 30, reps: 5, due: DAY + 30, lapses: 0 }, ...deck },
  ['known', 'a', 'b'],
  DAY,
);
assert.equal(stats.known, 1);
assert.equal(stats.learning, 1);
assert.equal(stats.fresh, 1);
assert.equal(stats.due, 1, 'only the unseen card is due');
assert.equal(stats.nextDue, DAY + 5, 'next review is the soonest scheduled card');

assert.equal(intervalLabel(0), 'now');
assert.equal(intervalLabel(1), '1d');
assert.equal(intervalLabel(45), '2mo');

console.log('srs: all checks passed');
