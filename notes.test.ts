import assert from 'node:assert/strict';
import { NOTE_LIMIT, changeNote, notesMarkdown, safeNotes } from './app/notes.ts';

assert.deepEqual(safeNotes(null), {});
assert.deepEqual(
  safeNotes({ '00-1': 'A useful observation', invalid: 'drop this', '00-2': 42, '00-3': '   ' }),
  { '00-1': 'A useful observation' },
);
assert.equal(safeNotes({ '00-1': 'x'.repeat(NOTE_LIMIT + 50) })['00-1'].length, NOTE_LIMIT);

let notes = changeNote({}, '00-1', 'First note');
assert.equal(notes['00-1'], 'First note');
notes = changeNote(notes, '00-1', '');
assert.deepEqual(notes, {}, 'clearing an editor removes the stored note');
assert.deepEqual(changeNote({}, '../bad', 'no'), {}, 'invalid lesson ids are ignored');

const markdown = notesMarkdown(
  { '00-1': 'Authentication proves identity.', '01-1': 'Packets carry data.' },
  [
    { id: '00-1', title: 'Identity first', stageNumber: '00', stageTitle: 'Start here' },
    { id: '01-1', title: 'Packets', stageNumber: '01', stageTitle: 'Networks' },
  ],
  new Date('2026-08-28T12:00:00Z'),
);
assert.match(markdown, /Exported: 2026-08-28/);
assert.match(markdown, /Lessons with notes: 2/);
assert.match(markdown, /## Stage 00: Start here/);
assert.match(markdown, /Authentication proves identity\./);

console.log('notes: all checks passed');
