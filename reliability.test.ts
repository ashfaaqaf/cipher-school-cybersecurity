/** Regression checks for the two causes of blank-looking pages. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('./app/page.tsx', import.meta.url), 'utf8');
const globals = readFileSync(new URL('./app/globals.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./app/shell.css', import.meta.url), 'utf8');
const mobile = readFileSync(new URL('./app/mobile.css', import.meta.url), 'utf8');
const workerBuilder = readFileSync(new URL('./scripts/make-sw.mjs', import.meta.url), 'utf8');

assert.match(page, /new IntersectionObserver/, 'scroll reveals need an intersection observer');
assert.match(page, /new MutationObserver/, 'late-rendered sections need a mutation observer');
assert.match(page, /dataset\.reveal\s*=\s*['"]ready['"]/, 'CSS must only hide reveals after observers are ready');
assert.match(
  page,
  /querySelectorAll<HTMLElement>\(['"]\.reveal:not\(\.in\)['"]\)/,
  'newly mounted reveal elements must be registered',
);
assert.match(
  page,
  /querySelectorAll<HTMLElement>\(['"]\.reveal['"]\)[\s\S]*classList\.add\(['"]in['"]\)/,
  'observer cleanup must leave all content visible',
);
assert.doesNotMatch(
  `${globals}\n${shell}`,
  /^\s*\.reveal\s*\{[^}]*opacity:\s*0/gm,
  'course sections must be visible by default',
);
assert.match(
  shell,
  /:root\[data-reveal='ready'\]:not\(\[data-motion='reduce'\]\) \.reveal:not\(\.in\)/,
  'hidden reveal state must require ready JavaScript and allow reduced-motion opt-out',
);
assert.match(page, /--reveal-delay/, 'simultaneous reveals should receive a controlled stagger');
assert.match(page, /--reveal-x/, 'reveals should receive subtle directional variation');
assert.match(shell, /filter:\s*blur\(5px\)/, 'cinematic reveals should include a bounded depth effect');
assert.match(
  page,
  /className=\{`stage glass reveal\$\{revealed \? ' in' : ''\}/,
  'opening a stage must preserve the visibility class owned by the reveal observer',
);

const takeover = page.slice(page.indexOf('const takeover ='), page.indexOf('const offer ='));
assert.ok(
  takeover.indexOf("addEventListener('controllerchange'") < takeover.indexOf("postMessage('skip-waiting')"),
  'the page must listen for a worker takeover before requesting it',
);
assert.match(
  page,
  /register\('sw\.js', \{ updateViaCache: 'none' \}\)/,
  'service-worker update checks must bypass intermediary HTTP caches',
);
assert.match(
  workerBuilder,
  /keys\.some\(\(key\) => key\.startsWith\('cipher-school-'\) && key !== CACHE\)/,
  'a worker must distinguish an upgrade from a first installation',
);
assert.match(
  workerBuilder,
  /clients\.matchAll\(\{ type: 'window' \}\)[\s\S]*client\.navigate\(client\.url\)/,
  'an upgraded worker must refresh clients that could have missed the page-side takeover event',
);
assert.match(
  workerBuilder,
  /hash\.startsWith\('#\/lesson\/'\)/,
  'an offline update must not interrupt an open lesson',
);
assert.match(workerBuilder, /cache\.addAll\(PRECACHE\)/, 'a service worker update must cache one complete build');
assert.match(workerBuilder, /readFile\(path\.join\(OUT, file\)\)/, 'a release cache key must include built file contents');
assert.doesNotMatch(
  workerBuilder,
  /createHash\(['"]sha256['"]\)\.update\(urls\.join/,
  'file names alone are not a safe release fingerprint',
);
assert.doesNotMatch(
  workerBuilder,
  /c\.put\(START/,
  'an old service worker must not mix new HTML with old hashed app chunks',
);
assert.match(mobile, /display-mode:\s*standalone/, 'installed mobile layout needs a standalone mode');
assert.match(
  mobile,
  /display-mode:\s*standalone[\s\S]*?\.brand\s*\{\s*display:\s*none;/,
  'the installed mobile app must not repeat its Home Screen branding',
);
assert.match(
  mobile,
  /display-mode:\s*standalone[\s\S]*?\.topActions\s*\{[\s\S]*?grid-column:\s*2;/,
  'settings must remain available in the compact installed header',
);

console.log('reliability: all checks passed');
