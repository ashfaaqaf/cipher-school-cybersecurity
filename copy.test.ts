/** Guard the direct, human copy style used across the course. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'app');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const sources = sourceFiles(root).map((file) => readFileSync(file, 'utf8')).join('\n');
const roles = readFileSync(path.join(root, 'curriculum', 'roles.ts'), 'utf8');
const roleView = readFileSync(path.join(root, 'Roles.tsx'), 'utf8');
const manifest = readFileSync(path.join(path.dirname(root), 'public', 'manifest.webmanifest'), 'utf8');
const publicCopy = `${sources}\n${manifest}`;

assert.doesNotMatch(publicCopy, /[—–]/, 'public copy must not use long dash punctuation');
assert.doesNotMatch(
  publicCopy,
  /\b(?:honest(?:ly|y)?|simply|crucial|robust|leverage|delve|tapestry|realm|game-changing|seamless|transformative|ever-evolving|comprehensive|ultimately|moreover|furthermore|groundbreaking|revolutionary)\b/i,
  'course copy must avoid the blocked filler-word list',
);

for (const requirement of [
  'Basic understanding of networking, web technologies, and OWASP Top 10',
  'Familiarity with tools such as Burp Suite, OWASP ZAP, Nmap, or similar',
  'Strong analytical skills and willingness to learn',
  'Nice to have: knowledge of cloud security (Azure/AWS)',
]) {
  assert.match(roles, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing advert requirement: ${requirement}`);
}

assert.match(roleView, /Internship skill sprint/, 'the advert requirements need a visible guided path');
assert.match(roleView, /Open next lesson/, 'the guided path needs a direct continuation action');
assert.match(roleView, /Practise a case/, 'the guided path needs an applied practice action');
for (const tool of ['Burp Suite', 'OWASP ZAP', 'Nmap']) {
  assert.match(roleView, new RegExp(tool), `${tool} needs a visible lab checklist`);
}
assert.match(roleView, /cipher-school-tool-labs/, 'tool lab progress needs device-local persistence');
assert.match(
  publicCopy,
  /https:\/\/www\.instagram\.com\/ashfaaqaf\?igsi=MW0zdjM0dmdvcnB1ZA%3D%3D&utm_source=qr/,
  'the creator footer must use Ashfaaq’s supplied Instagram profile link',
);
assert.match(publicCopy, /aria-label="Open ashfaaqaf on Instagram"/, 'the creator Instagram link must have an accessible name');

console.log('copy: all checks passed');
