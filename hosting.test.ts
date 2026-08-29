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
assert.match(infinityFreeWorkflow, /SITE_URL" != "https:\/\/cipherschool\.page\.gd"/, 'InfinityFree deployment must reject the wrong public host');
assert.match(infinityFreeWorkflow, /FTP_SERVER" != "ftpupload\.net"/, 'InfinityFree deployment must reject the wrong FTP server');
assert.match(infinityFreeWorkflow, /FTP_USERNAME" != "\$EXPECTED_FTP_USERNAME"/, 'InfinityFree deployment must reject the wrong hosting account');
assert.match(infinityFreeWorkflow, /FTP_REMOTE_DIR" != "\/htdocs"/, 'InfinityFree deployment must require the exact remote root');
assert.doesNotMatch(infinityFreeWorkflow, /mirror[^\n]*--delete/, 'InfinityFree deployment must not delete unknown remote files');
assert.match(infinityFreeWorkflow, /mirror[^\n]*--ignore-time/, 'unchanged static files must not be reuploaded because only their build timestamp changed');
assert.match(infinityFreeWorkflow, /mirror[^\n]*--exclude-glob '\*\.png'/, 'routine releases must not replace InfinityFree-hosted PNGs that the host can temporarily lock');
assert.match(infinityFreeWorkflow, /mirror[^\n]*--exclude-glob sw\.js/, 'the worker must not be uploaded with ordinary assets');
assert.match(infinityFreeWorkflow, /put -O \. out\/cipher-school-icon-192\.png[\s\S]*cls -1 cipher-school-icon-192\.png/, 'a missing Home Screen icon must be repaired and verified');
assert.match(infinityFreeWorkflow, /actions\/upload-artifact@v4/, 'InfinityFree deployment must save a rollback build');
assert.match(infinityFreeWorkflow, /cancel-in-progress: false/, 'InfinityFree deployments must not interrupt an upload halfway through');

const mirrorPosition = infinityFreeWorkflow.indexOf('mirror --reverse');
const entrypointPosition = infinityFreeWorkflow.indexOf('put -O . out/index.html');
const workerPosition = infinityFreeWorkflow.indexOf('put -O . out/sw.js');
assert.ok(mirrorPosition >= 0 && entrypointPosition > mirrorPosition, 'the entry page must be uploaded after its assets');
assert.ok(workerPosition > entrypointPosition, 'the service worker must be uploaded after the current entry page');

console.log('hosting: all checks passed');
