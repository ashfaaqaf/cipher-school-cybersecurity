import assert from 'node:assert/strict';
import { SKILL_QUESTIONS, assessmentResult, emptySkillCheck, safeSkillCheck } from './app/assessment.ts';

assert.equal(SKILL_QUESTIONS.length, 12, 'the baseline should stay short enough to finish');
assert.equal(new Set(SKILL_QUESTIONS.map((question) => question.id)).size, SKILL_QUESTIONS.length, 'question ids are unique');
assert.ok(SKILL_QUESTIONS.every((question) => /^\d{2}-\d{1,2}$/.test(question.lessonId)), 'every gap links to a lesson');

const perfect = Object.fromEntries(SKILL_QUESTIONS.map((question) => [question.id, question.correct]));
const perfectResult = assessmentResult(perfect);
assert.equal(perfectResult.score, 100);
assert.equal(perfectResult.correct, SKILL_QUESTIONS.length);
assert.equal(perfectResult.priorityLessons.length, 0);
assert.equal(perfectResult.band.label, 'Strong baseline');

const wrong = Object.fromEntries(SKILL_QUESTIONS.map((question) => [question.id, (question.correct + 1) % question.options.length]));
const wrongResult = assessmentResult(wrong);
assert.equal(wrongResult.score, 0);
assert.equal(wrongResult.band.label, 'Foundation first');
assert.ok(wrongResult.priorityLessons.length > 0);

assert.deepEqual(safeSkillCheck(null), emptySkillCheck());
const repaired = safeSkillCheck({
  answers: { scope: 1, cia: 99, unknown: 0 },
  completedAt: 42,
  attempts: -4,
});
assert.deepEqual(repaired.answers, { scope: 1 });
assert.equal(repaired.completedAt, null);
assert.equal(repaired.attempts, 0);

console.log('assessment: all checks passed');
