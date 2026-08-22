/**
 * URL routing self-check. Run it with:  node routing.test.ts
 *
 * Hashes are hand-editable and arrive from bookmarks written by older builds,
 * so most of this is about landing somewhere sensible on bad input.
 */
import assert from 'node:assert/strict';
import { DEFAULT_ROUTE, VIEWS, hashFor, isLessonId, parseHash, sameRoute } from './app/routing.ts';

// --- views --------------------------------------------------------------

assert.deepEqual(parseHash(''), DEFAULT_ROUTE, 'no hash is the default view');
assert.deepEqual(parseHash('#'), DEFAULT_ROUTE);
assert.deepEqual(parseHash('#/'), DEFAULT_ROUTE);
assert.deepEqual(parseHash('#/learn'), { view: 'learn', lessonId: null });
assert.deepEqual(parseHash('#/review'), { view: 'review', lessonId: null });
assert.deepEqual(parseHash('#/sources'), { view: 'sources', lessonId: null });

// Both hash styles work, since people hand-edit and older links may lack the slash.
assert.deepEqual(parseHash('#paths'), { view: 'paths', lessonId: null }, 'a bare hash still routes');
assert.deepEqual(parseHash('#/PATHS'), { view: 'paths', lessonId: null }, 'case is forgiven');

for (const v of VIEWS) {
  assert.equal(parseHash(hashFor({ view: v, lessonId: null })).view, v, `${v} round-trips`);
}

// --- lessons ------------------------------------------------------------

assert.deepEqual(parseHash('#/lesson/05-2'), { view: 'learn', lessonId: '05-2' });
assert.deepEqual(parseHash('#/lesson/12-11'), { view: 'learn', lessonId: '12-11' }, 'two-digit lesson numbers');
assert.deepEqual(parseHash('#lesson/00-1'), { view: 'learn', lessonId: '00-1' });

assert.equal(hashFor({ view: 'learn', lessonId: '05-2' }), '#/lesson/05-2');
assert.equal(hashFor({ view: 'learn', lessonId: null }), '', 'the default view has no hash to add');
assert.equal(hashFor({ view: 'words', lessonId: null }), '#/words');
// A lesson is always shown over the Learn tab, so the view part is redundant.
assert.equal(hashFor({ view: 'review', lessonId: '05-2' }), '#/lesson/05-2');

// --- bad input lands somewhere sensible ---------------------------------

const junk = [
  '#/lesson/',
  '#/lesson/nope',
  '#/lesson/5-2',
  '#/lesson/052',
  '#/lesson/05-2-3',
  '#/nonsense',
  '#/lesson/<script>',
  '#////',
  '#/lesson/../../etc/passwd',
];
for (const h of junk) {
  assert.deepEqual(parseHash(h), DEFAULT_ROUTE, `"${h}" falls back rather than breaking`);
}

// Percent-encoding is decoded before matching, so a shared link still works.
assert.deepEqual(parseHash('#%2Flesson%2F05-2'), { view: 'learn', lessonId: '05-2' });

// --- the id shape -------------------------------------------------------

assert.equal(isLessonId('00-1'), true);
assert.equal(isLessonId('12-11'), true);
assert.equal(isLessonId('1-1'), false, 'the stage is always two digits');
assert.equal(isLessonId('00-'), false);
assert.equal(isLessonId(''), false);
assert.equal(isLessonId('00-1 '), false, 'no stray whitespace');

// --- comparison ---------------------------------------------------------

assert.equal(sameRoute({ view: 'learn', lessonId: null }, { view: 'learn', lessonId: null }), true);
assert.equal(sameRoute({ view: 'learn', lessonId: '05-2' }, { view: 'learn', lessonId: '05-3' }), false);
assert.equal(sameRoute({ view: 'learn', lessonId: null }, { view: 'words', lessonId: null }), false);

console.log('routing: all checks passed');
