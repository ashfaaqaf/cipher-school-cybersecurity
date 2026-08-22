/**
 * Search self-check. Run it with:  node search.test.ts
 *
 * The pure helpers are tested directly; the ranked search is tested against the
 * real curriculum, because the thing worth checking is that searching for a
 * phrase buried in a lesson body actually finds that lesson.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCorpus, highlight, searchIn, snippetAround, terms } from './app/search.ts';

/* Stage files are loaded one by one: Node cannot resolve TypeScript's
   extensionless "./s00" specifiers inside the curriculum index. */
const stages = [];
for (let i = 0; i < 13; i += 1) {
  const name = `s${String(i).padStart(2, '0')}`;
  const mod = await import(pathToFileURL(path.resolve('app/curriculum', `${name}.ts`)).href);
  stages.push(mod[name]);
}
const corpus = buildCorpus(stages.flatMap((stage) => stage.lessons.map((lesson) => ({ lesson, stage }))));
const searchLessons = (q, limit) => searchIn(corpus, q, limit);

// --- tokenising ---------------------------------------------------------

assert.deepEqual(terms('password spraying'), ['password', 'spraying']);
assert.deepEqual(terms('  SQL   Injection  '), ['sql', 'injection'], 'case and spacing are normalised');
assert.deepEqual(terms('a'), [], 'single characters are dropped as too noisy');
assert.deepEqual(terms(''), []);
assert.deepEqual(terms('!!! ???'), [], 'punctuation alone yields nothing');
assert.deepEqual(terms('C2 ATT&CK'), ['c2', 'att', 'ck'], 'ampersands split, which is fine for matching');
assert.deepEqual(terms('log4shell'), ['log4shell'], 'digits inside a word are kept');

// --- highlighting -------------------------------------------------------

let segs = highlight('The cat sat on the cat mat', ['cat']);
assert.equal(segs.filter((s) => s.hit).length, 2, 'every occurrence is marked');
assert.equal(segs.map((s) => s.text).join(''), 'The cat sat on the cat mat', 'the text survives intact');

segs = highlight('SQL injection', ['sql']);
assert.equal(segs[0].text, 'SQL', 'matching is case-insensitive but preserves original case');
assert.equal(segs[0].hit, true);

assert.deepEqual(highlight('nothing here', ['zzz']), [{ text: 'nothing here', hit: false }]);
assert.deepEqual(highlight('plain', []), [{ text: 'plain', hit: false }]);

// A term with regex metacharacters must not blow up the pattern.
assert.doesNotThrow(() => highlight('a+b (c)', ['a+b', '(c)']), 'special characters are escaped');

// Longer terms win, so an overlapping shorter one does not fragment the match.
segs = highlight('injection', ['inject', 'injection']);
assert.equal(segs.find((s) => s.hit)?.text, 'injection', 'the longest match is preferred');

// --- snippets -----------------------------------------------------------

const long = 'A '.repeat(200) + 'needle' + ' B'.repeat(200);
let snip = snippetAround(long, ['needle']);
assert.ok(snip.includes('needle'), 'the match is inside the window');
assert.ok(snip.length < 200, 'and the window is short');
assert.ok(snip.startsWith('…'), 'text cut at the front is marked');
assert.ok(snip.endsWith('…'), 'text cut at the end is marked');

snip = snippetAround('short text', ['zzz']);
assert.equal(snip, 'short text', 'no match and short text returns the whole thing unmarked');

// --- searching the real curriculum --------------------------------------

// The point of the whole feature: a phrase that only exists in a lesson body.
let hits = searchLessons('password spraying');
assert.ok(hits.length > 0, 'a body-only phrase must be findable');
assert.ok(
  hits.some((h) => h.lessonId === '06-4'),
  `spraying is explained in 06-4 — got ${hits.map((h) => h.lessonId).join(', ')}`,
);
assert.ok(hits[0].snippet.some((s) => s.hit), 'the top hit has something highlighted');

// A title match should rank its lesson first.
hits = searchLessons('Kerberoasting');
assert.equal(hits[0].lessonId, '06-6', 'the lesson about Active Directory ranks first');

// Every term must appear, so multi-word queries narrow rather than widen.
const broad = searchLessons('access');
const narrow = searchLessons('broken access control');
assert.ok(narrow.length < broad.length, 'adding terms narrows the result set');
assert.ok(narrow.length > 0, 'but a real phrase still returns something');

// A jargon term defined in the decoder is findable.
hits = searchLessons('nonce');
assert.ok(hits.length > 0, 'glossary terms are searchable');

// Nonsense returns nothing rather than everything.
assert.deepEqual(searchLessons('qwertyuiopasdfgh'), []);
assert.deepEqual(searchLessons(''), [], 'an empty query returns nothing, not the whole course');
assert.deepEqual(searchLessons('   '), []);

// Results are ordered and capped.
hits = searchLessons('security', 5);
assert.ok(hits.length <= 5, 'the limit is respected');
for (let i = 1; i < hits.length; i += 1) {
  assert.ok(hits[i - 1].score >= hits[i].score, 'results are sorted by score');
}

// Every hit carries what the UI needs to render it.
for (const h of searchLessons('injection', 5)) {
  assert.ok(h.title && h.stageNumber && h.where, 'hits carry their labels');
  assert.ok(h.snippet.length > 0, 'and a snippet');
  assert.equal(typeof h.stageHue, 'number', 'and the stage hue for colouring');
}

// A title-only match should still show a useful snippet from elsewhere,
// because repeating the title back as the snippet tells the reader nothing.
const titleHit = searchLessons('Kerberoasting')[0];
assert.notEqual(titleHit.where, 'title', 'the snippet comes from a field other than the title');

console.log('search: all checks passed');
