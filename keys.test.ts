/**
 * Keyboard self-check. Run it with:  node keys.test.ts
 *
 * Most of these assert that a key does NOT do anything, which is the part worth
 * protecting: a shortcut that fires mid-typing or steals Ctrl+F makes an app
 * feel broken in a way that is hard to attribute.
 */
import assert from 'node:assert/strict';
import { SHORTCUTS, actionFor, isTyping, type Context } from './app/keys.ts';

const base: Context = { inReader: false, inReview: false, revealed: false, typing: false, sheetOpen: false };
const ctx = (over: Partial<Context> = {}): Context => ({ ...base, ...over });

// --- modifiers belong to the browser ------------------------------------

for (const mod of ['ctrlKey', 'metaKey', 'altKey'] as const) {
  assert.equal(actionFor({ key: '/', [mod]: true }, ctx()), null, `${mod} + / is the browser's`);
  assert.equal(actionFor({ key: '1', [mod]: true }, ctx()), null, `${mod} + 1 is the browser's`);
  assert.equal(actionFor({ key: 'Escape', [mod]: true }, ctx()), null, `${mod} + Escape is not ours either`);
}

// --- typing suppresses almost everything --------------------------------

assert.equal(actionFor({ key: '/' }, ctx({ typing: true })), null, 'slash is a character while typing');
assert.equal(actionFor({ key: '3' }, ctx({ typing: true })), null, 'digits are characters while typing');
assert.equal(actionFor({ key: 'j' }, ctx({ typing: true, inReader: true })), null, 'j is a letter while typing');
assert.deepEqual(
  actionFor({ key: 'Escape' }, ctx({ typing: true })),
  { type: 'close' },
  'Escape still works while typing — it is how you get out of the field',
);

// --- browsing -----------------------------------------------------------

assert.deepEqual(actionFor({ key: '/' }, ctx()), { type: 'search' });
assert.deepEqual(actionFor({ key: '1' }, ctx()), { type: 'view', index: 0 });
assert.deepEqual(actionFor({ key: '5' }, ctx()), { type: 'view', index: 4 });
assert.equal(actionFor({ key: '6' }, ctx()), null, 'there is no sixth tab');
assert.equal(actionFor({ key: '0' }, ctx()), null);
assert.deepEqual(actionFor({ key: '?' }, ctx()), { type: 'help' });

// A sheet covering the tabs means the number keys should not switch behind it.
assert.equal(actionFor({ key: '2' }, ctx({ sheetOpen: true })), null, 'no tab switching under a sheet');
assert.deepEqual(actionFor({ key: '/' }, ctx({ sheetOpen: true })), { type: 'search' }, 'search still opens');

// --- reading ------------------------------------------------------------

const reading = ctx({ inReader: true, sheetOpen: true });
assert.deepEqual(actionFor({ key: 'j' }, reading), { type: 'next' });
assert.deepEqual(actionFor({ key: 'ArrowRight' }, reading), { type: 'next' });
assert.deepEqual(actionFor({ key: 'k' }, reading), { type: 'prev' });
assert.deepEqual(actionFor({ key: 'ArrowLeft' }, reading), { type: 'prev' });
assert.deepEqual(actionFor({ key: ' ' }, reading), { type: 'toggleDone' });
assert.deepEqual(actionFor({ key: 'l' }, reading), { type: 'listen' });
assert.deepEqual(actionFor({ key: 'Escape' }, reading), { type: 'close' });
assert.equal(actionFor({ key: '2' }, reading), null, 'tabs are unreachable from inside the reader');
assert.equal(actionFor({ key: '/' }, reading), null, 'and so is search, which would be jarring');

// --- reviewing ----------------------------------------------------------

const hidden = ctx({ inReview: true });
const shown = ctx({ inReview: true, revealed: true });

assert.deepEqual(actionFor({ key: ' ' }, hidden), { type: 'reveal' });
assert.equal(actionFor({ key: '1' }, hidden), null, 'you cannot grade a card you have not seen');
assert.deepEqual(actionFor({ key: '1' }, shown), { type: 'grade', grade: 0 }, '1 is "again"');
assert.deepEqual(actionFor({ key: '4' }, shown), { type: 'grade', grade: 3 }, '4 is "easy"');
assert.deepEqual(actionFor({ key: '5' }, shown), { type: 'view', index: 4 }, 'there is no fifth grade');

// --- the typing detector ------------------------------------------------

assert.equal(isTyping({ tagName: 'INPUT' } as unknown as EventTarget), true);
assert.equal(isTyping({ tagName: 'TEXTAREA' } as unknown as EventTarget), true);
assert.equal(isTyping({ tagName: 'SELECT' } as unknown as EventTarget), true);
assert.equal(isTyping({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget), true);
assert.equal(isTyping({ tagName: 'DIV' } as unknown as EventTarget), false);
assert.equal(isTyping({ tagName: 'BUTTON' } as unknown as EventTarget), false);
assert.equal(isTyping(null), false, 'a missing target is not a text field');
assert.equal(isTyping({} as unknown as EventTarget), false, 'nor is something without a tag');

// --- the help list stays honest -----------------------------------------

assert.ok(SHORTCUTS.length >= 8, 'the help sheet lists the shortcuts');
for (const s of SHORTCUTS) {
  assert.ok(s.keys.length > 0 && s.what, 'every entry has keys and a description');
}
const documented = SHORTCUTS.flatMap((s) => s.keys);
for (const key of ['/', 'j', 'k', 'Esc', '?']) {
  assert.ok(documented.includes(key), `${key} is documented`);
}

console.log('keys: all checks passed');
