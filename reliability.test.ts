/** Regression checks for the two causes of blank-looking pages. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('./app/page.tsx', import.meta.url), 'utf8');
const globals = readFileSync(new URL('./app/globals.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./app/shell.css', import.meta.url), 'utf8');
const workerBuilder = readFileSync(new URL('./scripts/make-sw.mjs', import.meta.url), 'utf8');

assert.doesNotMatch(page, /querySelectorAll\(['"]\.reveal/, 'visibility must not depend on a one-shot DOM scan');
assert.doesNotMatch(
  `${globals}\n${shell}`,
  /\.reveal\s*\{[\s\S]*?opacity:\s*0/,
  'course sections must be visible by default',
);
assert.match(workerBuilder, /cache\.addAll\(PRECACHE\)/, 'a service worker update must cache one complete build');
assert.doesNotMatch(
  workerBuilder,
  /c\.put\(START/,
  'an old service worker must not mix new HTML with old hashed app chunks',
);

console.log('reliability: all checks passed');
