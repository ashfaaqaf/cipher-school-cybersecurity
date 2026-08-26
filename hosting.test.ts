import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layout = readFileSync('app/layout.tsx', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const generator = readFileSync('scripts/make-site-files.mjs', 'utf8');
const infinityFreeWorkflow = readFileSync('.github/workflows/infinityfree.yml', 'utf8');

assert.match(layout, /process\.env\.SITE_URL/, 'page metadata must support a second public host');
assert.match(packageJson, /make-site-files\.mjs/, 'production builds must generate host-specific crawler files');
assert.match(generator, /robots\.txt/, 'the host build must generate robots.txt');
assert.match(generator, /sitemap\.xml/, 'the host build must generate sitemap.xml');
assert.match(infinityFreeWorkflow, /INFINITYFREE_ENABLED == 'true'/, 'InfinityFree deployment must be opt-in');
assert.match(infinityFreeWorkflow, /SITE_URL: \$\{\{ vars\.INFINITYFREE_SITE_URL \}\}/, 'InfinityFree must receive its own canonical origin');
assert.match(infinityFreeWorkflow, /mirror --reverse --delete/, 'InfinityFree deployment must remove stale build files');
assert.match(infinityFreeWorkflow, /htdocs\|\/htdocs\|\*\/htdocs/, 'InfinityFree deployment must reject unsafe remote roots');

console.log('hosting: all checks passed');
