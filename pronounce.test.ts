/**
 * Pronunciation self-check. Run it with:  node pronounce.test.ts
 * The ordering here is the fragile part — phrase rules must run before acronym
 * spelling, and longer spoken keys before their own substrings.
 */
import assert from 'node:assert/strict';
import { forSpeech } from './app/pronounce.ts';

const has = (input: string, expected: string) => {
  const out = forSpeech(input);
  assert.ok(out.includes(expected), `"${input}"\n  got:      ${out}\n  expected: …${expected}…`);
};

// Acronyms get spelled out, so engines stop reading them as words.
has('An SSRF bug is severe.', 'S S R F');
has('Use TLS everywhere.', 'T L S');
has('XSS and CSRF differ.', 'X S S');

// Words that are genuinely said as words must not be spelled out.
has('NIST publishes it.', 'nist');
has('The OWASP Top 10 list.', 'oh-wasp');
has('A SIEM collects logs.', 'sim');
assert.ok(!forSpeech('The SOC triages alerts.').includes('S O C'), 'SOC is a word, not letters');

// Longer keys win over the substrings inside them.
has('MITRE ATT&CK is a catalogue.', 'MItre attack');
assert.ok(!forSpeech('MITRE ATT&CK').includes('and C K'), 'the ampersand rule must not split ATT&CK');

// Paths, commands and identifiers.
has('Look in /var/log for it.', 'slash var slash log');
has('Run chmod 755 on it.', 'ch mod 7 5 5');
has('A filename containing ../ escapes.', 'dot dot slash');
has('CVE-2021-44228 is Log4Shell.', 'C V E 2021 44228');
has('CVE-2021-44228 is Log4Shell.', 'log four shell');
has('Connect to 192.168.1.10 now.', '192 dot 168 dot 1 dot 10');
has('Event 4624 is a logon.', 'forty six twenty four');

// Symbols that engines skip entirely.
has('Stage 00 → 01 → 02', ', then ');
has('Piped with | into grep', ' pipe ');
has('It grew 40% last year.', '40 percent');

// Version-ish tokens read as versions, and specific ones keep their shape.
has('MITRE ATT&CK v18 shipped.', 'version 18');
has('We use IPv6 here.', 'I P version six');
has('WPA3 improves on WPA2.', 'W P A three');

// Names people mispronounce.
has('Kerberoasting abuses Kerberos.', 'KURberos');
has('Reusing a nonce breaks it.', 'nonss');
has('Open it in Ghidra.', 'GEE dra');
has('Kubernetes RBAC is strict.', 'koo ber NET eez');
has('Kubernetes RBAC is strict.', 'R B A C');

// The 3-2-1 backup rule must not become a subtraction.
has('Follow 3-2-1-1-0 for backups.', 'three, two, one, one, zero');

// Plurals of spelled acronyms stay readable.
has('Several APIs exist.', "A P I's");

// Whitespace is tidy and punctuation is not orphaned.
const tidy = forSpeech('An SSRF bug — really — is severe.');
assert.ok(!/\s{2,}/.test(tidy), 'no double spaces');
assert.ok(!/\s+[,.]/.test(tidy), 'no space before punctuation');

// Plain prose with no jargon must come back essentially unchanged.
const plain = 'Security is the job of keeping valuable things safe.';
assert.equal(forSpeech(plain), plain, 'ordinary sentences are left alone');

console.log('pronounce: all checks passed');
