import assert from 'node:assert/strict';
import { MISSIONS, emptyAcademy, emptyMissionRun, missionScore, routeWeeks, safeAcademy } from './app/academy.ts';

const mission = MISSIONS[0];
const perfect = emptyMissionRun();
perfect.answers = Object.fromEntries(mission.questions.map((question) => [question.id, question.correct]));
perfect.report = 'The forward rule and identity log support misuse. Revoke every active session, reset credentials and verify MFA before restoring access.';
const scored = missionScore(mission, perfect);
assert.equal(scored.score, 100);
assert.equal(scored.passed, true);

const guesses = emptyMissionRun();
guesses.answers = Object.fromEntries(mission.questions.map((question) => [question.id, 0]));
guesses.report = 'Maybe bad.';
assert.equal(missionScore(mission, guesses).passed, false, 'short guesses cannot pass a mission');

assert.equal(routeWeeks(80, 8), 10);
assert.equal(routeWeeks(5, 0), 5, 'a corrupt zero-hour plan is clamped');

assert.deepEqual(safeAcademy(null), emptyAcademy());
const repaired = safeAcademy({
  profile: { experience: 'new', role: 'CLOUD', weeklyHours: 999, pace: 'steady', locale: 'en', createdAt: 'ok' },
  missions: { [mission.id]: { answers: { [mission.questions[0].id]: 99 }, report: 42, score: 900, attempts: -5 } },
  capstones: { nope: { checks: 'yes' } },
});
assert.equal(repaired.profile?.weeklyHours, 40, 'profile hours are bounded');
assert.deepEqual(repaired.missions[mission.id].answers, {}, 'out-of-range answers are dropped');
assert.equal(repaired.missions[mission.id].score, 100, 'scores are bounded');
assert.equal(repaired.missions[mission.id].report, '', 'non-text reports are dropped');

console.log('academy: all checks passed');
