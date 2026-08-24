/**
 * The exercise answer matcher.
 *
 * This is the one piece of the app where being slightly wrong is silently
 * cruel: an accept list that is too narrow tells somebody who understood the
 * material perfectly that they are wrong, and there is no way for them to tell
 * whether the fault is theirs or the app's. It was checked by hand once, which
 * is not a check — this makes it repeatable.
 *
 *   node practice.test.ts
 */

import { exercises, isCorrect, normalise } from './app/curriculum/practice.ts';

let failures = 0;

function check(label: string, condition: boolean) {
  if (!condition) {
    console.error('  FAIL:', label);
    failures += 1;
  }
}

/* ---------- normalisation ---------- */

check('lowercases', normalise('SVC_Backup') === 'svc_backup');
check('trims', normalise('  600  ') === '600');
check('collapses runs of space', normalise('prompt   injection') === 'prompt injection');
check('drops trailing punctuation', normalise('no.') === 'no');
check('keeps internal punctuation', normalise('203.0.113.44') === '203.0.113.44');
check('keeps a colon inside a token', normalise('s3:GetObject') === 's3:getobject');

/* ---------- every declared answer is accepted by its own step ---------- */

for (const ex of exercises) {
  ex.steps.forEach((step, i) => {
    const where = `${ex.id} step ${i + 1}`;
    check(`${where}: has at least one accepted answer`, step.accept.length > 0);
    check(`${where}: has a canonical answer`, step.answer.trim().length > 0);
    check(`${where}: explains itself`, step.why.trim().length > 20);
    check(`${where}: offers at least one hint`, step.hints.length > 0);
    for (const a of step.accept) {
      check(`${where}: accepts its own entry ${JSON.stringify(a)}`, isCorrect(step, a));
      check(`${where}: accepts ${JSON.stringify(a)} shouted`, isCorrect(step, a.toUpperCase()));
      check(`${where}: accepts ${JSON.stringify(a)} with padding`, isCorrect(step, `  ${a}  `));
    }
    /* Nothing empty or obviously unrelated may pass. */
    for (const bad of ['', '   ', 'banana', 'i do not know']) {
      check(`${where}: rejects ${JSON.stringify(bad)}`, !isCorrect(step, bad));
    }
  });
}

/* ---------- the set as a whole ---------- */

const lessons = exercises.map((e) => e.lesson);
check('no lesson carries two exercises', new Set(lessons).size === lessons.length);
check('every exercise has a unique id', new Set(exercises.map((e) => e.id)).size === exercises.length);
check('every stage has one', new Set(lessons.map((l) => l.slice(0, 2))).size === 13);

for (const ex of exercises) {
  check(`${ex.id}: has an artefact to read`, ex.artefact.lines.length > 0);
  check(`${ex.id}: says what you are looking at`, ex.artefact.label.trim().length > 0);
  check(`${ex.id}: briefs the task`, ex.brief.trim().length > 40);
  check(`${ex.id}: debriefs afterwards`, ex.debrief.trim().length > 40);
  check(`${ex.id}: asks more than nothing`, ex.steps.length > 0);
}

if (failures) {
  console.error(`practice: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`practice: all checks passed (${exercises.length} exercises)`);
