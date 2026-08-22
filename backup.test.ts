/**
 * Restore-path self-check. Run it with:  node backup.test.ts
 *
 * A restore file arrives from outside the app, so most of these assertions are
 * about refusing bad input rather than accepting good input.
 */
import assert from 'node:assert/strict';

/* A minimal localStorage, so the module can run outside a browser. */
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const { applyBackup, buildBackup, backupFilename } = await import('./app/backup.ts');

const good = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    format: 'cipher-school-backup',
    version: 1,
    exported: '2026-08-22T00:00:00.000Z',
    summary: { lessons: 2, cards: 1 },
    data: {
      progress: ['00-1', '00-2'],
      deck: { 'q:00-1-a': { ease: 2.5, interval: 6, reps: 2, due: 20700, lapses: 0 } },
      theme: 'night',
      voice: { rate: 1.2 },
    },
    ...over,
  });

// --- the happy path -----------------------------------------------------

store.clear();
let r = applyBackup(good());
assert.ok(r.ok, 'a well-formed backup should restore');
assert.equal(r.lessons, 2);
assert.equal(r.cards, 1);
assert.deepEqual(r.skipped, [], 'nothing should be skipped in a clean file');
assert.deepEqual(JSON.parse(store.get('cipher-school-progress')!), ['00-1', '00-2']);
assert.equal(store.get('cipher-school-theme'), 'night');

// A round trip must survive intact.
const round = buildBackup();
assert.equal(round.summary.lessons, 2, 'export should see what restore wrote');
assert.equal(round.summary.cards, 1);
store.clear();
assert.ok(applyBackup(JSON.stringify(round)).ok, 'our own export must be restorable');

// --- refusing bad input -------------------------------------------------

const reject = (input: string, why: string) => {
  const res = applyBackup(input);
  assert.equal(res.ok, false, `should reject: ${why}`);
};

reject('not json at all', 'unparsable text');
reject('[1,2,3]', 'a top-level array');
reject('null', 'null');
reject('"a string"', 'a bare string');
reject(JSON.stringify({ format: 'something-else', version: 1, data: {} }), 'a foreign format');
reject(good({ version: 99 }), 'a version newer than this app understands');
reject(good({ data: undefined }), 'no data section');
reject('{"format":"cipher-school-backup","version":1,"data":{}}'.padEnd(2_000_100, ' '), 'an absurdly large file');

// --- partial damage is repaired, not fatal ------------------------------

store.clear();
r = applyBackup(good({
  data: {
    progress: ['00-1', 42, null, '00-1', '00-2'],   // wrong types and a duplicate
    deck: {
      'q:ok': { ease: 2.5, interval: 6, reps: 2, due: 20700, lapses: 0 },
      'q:bad': { ease: 'lots' },                     // not a schedule
      'q:worse': null,
    },
    theme: 'chartreuse',                             // not a theme we have
    voice: 'not an object',
  },
}));
assert.ok(r.ok, 'a partly damaged file should still restore what is valid');
assert.equal(r.lessons, 2, 'non-strings dropped and the duplicate collapsed');
assert.equal(r.cards, 1, 'only the well-formed card survived');
assert.equal(r.skipped.length, 2, 'both kinds of damage should be reported');
assert.equal(store.get('cipher-school-theme'), undefined, 'an unknown theme is ignored, not stored');
assert.equal(store.get('cipher-school-voice'), undefined, 'a non-object voice setting is ignored');

// --- exporting from nothing ---------------------------------------------

store.clear();
const empty = buildBackup();
assert.equal(empty.summary.lessons, 0, 'a fresh install exports cleanly');
assert.ok(applyBackup(JSON.stringify(empty)).ok, 'an empty backup is still a valid backup');

// --- filename -----------------------------------------------------------

assert.equal(backupFilename(new Date('2026-08-22T13:00:00Z')), 'cipher-school-progress-2026-08-22.json');

console.log('backup: all checks passed');
