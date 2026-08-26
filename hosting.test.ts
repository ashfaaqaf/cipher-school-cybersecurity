import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layout = readFileSync('app/layout.tsx', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const generator = readFileSync('scripts/make-site-files.mjs', 'utf8');

assert.match(layout, /process\.env\.SITE_URL/, 'page metadata must support a second public host');
assert.match(packageJson, /make-site-files\.mjs/, 'production builds must generate host-specific crawler files');
assert.match(generator, /robots\.txt/, 'the host build must generate robots.txt');
assert.match(generator, /sitemap\.xml/, 'the host build must generate sitemap.xml');

console.log('hosting: all checks passed');
