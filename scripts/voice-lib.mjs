/**
 * Shared bits for the narration scripts.
 *
 * The API key is read from the environment and never written anywhere. This
 * site is a static export served from GitHub Pages — there is no server to
 * proxy a request through, so a key in the client bundle would be a key
 * published to the world. Audio is therefore generated ahead of time and
 * shipped as ordinary files.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { forSpeech } from '../app/pronounce.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
export const MANIFEST = path.join(AUDIO_DIR, 'manifest.json');

export const API = 'https://api.elevenlabs.io/v1';

export function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.error(
      'ELEVENLABS_API_KEY is not set.\n' +
        'Locally:  export ELEVENLABS_API_KEY=...   (do not commit it, .env is gitignored)\n' +
        'In CI:    add it as a repository secret and pass it through to the step.',
    );
    process.exit(1);
  }
  return key;
}

export async function call(endpoint, { method = 'POST', body, key } = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${method} ${endpoint} -> ${res.status} ${res.statusText}\n${detail.slice(0, 500)}`);
  }
  return res.json();
}

/**
 * Read the curriculum without compiling TypeScript: the lesson files are plain
 * data, and Node 24 strips types on import. Kept in one place so both scripts
 * see exactly what the app sees.
 */
export async function loadLessons() {
  /*
   * The stage files are imported one by one rather than through index.ts:
   * Node cannot resolve TypeScript's extensionless "./s00" specifiers, but each
   * stage file only imports its types, and type-only imports are erased.
   * pathToFileURL because a bare Windows path is not a valid ESM specifier.
   */
  const stages = [];
  for (let i = 0; i < 12; i += 1) {
    const name = `s${String(i).padStart(2, '0')}`;
    const mod = await import(pathToFileURL(path.join(ROOT, 'app', 'curriculum', `${name}.ts`)).href);
    stages.push(mod[name]);
  }
  return stages.flatMap((stage) => stage.lessons.map((lesson) => ({ stage: stage.number, lesson })));
}

/**
 * Must stay identical to lessonToChunks in app/voice.ts, or the marks drift.
 * The same speech rewriting is applied, so generated audio and the device voice
 * pronounce every acronym, path and identifier the same way.
 */
export function lessonToChunks(lesson) {
  const raw = [
    { label: 'Title', text: lesson.title },
    { label: 'The whole idea', text: lesson.oneLine },
    { label: 'Think of it like', text: lesson.like },
    ...lesson.body.map((p, i) => ({ label: `Explanation ${i + 1}`, text: p })),
    { label: 'Jargon decoder', text: lesson.words.map((w) => `${w.term}. ${w.means}`).join(' ') },
    { label: 'Why this matters', text: lesson.why },
    { label: 'Go and do this', text: lesson.doThis },
    { label: 'Check yourself', text: lesson.check },
  ];
  return raw.map((c) => ({ ...c, text: forSpeech(c.text) }));
}

/**
 * Join chunks into one narration. A pause between sections makes it listenable,
 * and the separator is counted when locating chunk boundaries in the alignment.
 */
export const SEP = '\n\n';

export function buildScript(chunks) {
  return chunks.map((c) => c.text).join(SEP);
}

/** Character offset where each chunk begins in the joined script. */
export function chunkOffsets(chunks) {
  const offsets = [];
  let at = 0;
  for (const c of chunks) {
    offsets.push(at);
    at += c.text.length + SEP.length;
  }
  return offsets;
}

/**
 * Turn ElevenLabs character timings into a mark per section, so the player can
 * highlight the paragraph being spoken and skip between sections.
 */
export function marksFromAlignment(chunks, alignment) {
  const starts = alignment?.character_start_times_seconds ?? [];
  const offsets = chunkOffsets(chunks);
  return chunks.map((c, i) => ({
    label: c.label,
    t: Number((starts[Math.min(offsets[i], starts.length - 1)] ?? 0).toFixed(3)),
  }));
}

/** Changing a lesson's words changes its hash, which is what triggers a regeneration. */
export function scriptHash(script, voiceId, modelId) {
  return createHash('sha256').update(`${voiceId}|${modelId}|${script}`).digest('hex').slice(0, 16);
}

export async function readManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    return { voiceId: null, model: null, lessons: {} };
  }
}
