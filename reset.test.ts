import assert from 'node:assert/strict';
import { CIPHER_STORAGE_KEYS, clearCipherSchoolStorage } from './app/reset.ts';

const removed: string[] = [];
clearCipherSchoolStorage({ removeItem: (key: string) => void removed.push(key) });

assert.deepEqual(removed, [...CIPHER_STORAGE_KEYS], 'factory reset clears every Cipher School store');
assert.equal(new Set(removed).size, removed.length, 'no storage key is cleared twice');
assert.ok(removed.includes('cipher-school-progress'), 'lesson progress is included');
assert.ok(removed.includes('cipher-school-srs'), 'review history is included');
assert.ok(removed.includes('cipher-school-academy'), 'missions and capstones are included');
assert.ok(removed.includes('cipher-school-tool-labs'), 'tool lab checklist is included');

console.log('reset: all checks passed');
