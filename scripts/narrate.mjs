/**
 * Generate the narration audio.
 *
 *   node scripts/narrate.mjs --dry              # character count and cost, generates nothing
 *   node scripts/narrate.mjs                    # generate everything missing or changed
 *   node scripts/narrate.mjs --only 00          # one stage
 *   node scripts/narrate.mjs --limit 5          # first five lessons, to sanity-check the voice
 *
 * Output lands in public/audio: one mp3 per lesson plus a manifest holding the
 * section marks, so the player can highlight and skip exactly as it does with
 * the on-device voice. Lessons whose text has not changed are skipped, so a
 * rerun after editing one lesson costs one lesson.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AUDIO_DIR,
  MANIFEST,
  ROOT,
  apiKey,
  buildScript,
  lessonToChunks,
  loadLessons,
  marksFromAlignment,
  readManifest,
  scriptHash,
} from './voice-lib.mjs';

const MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
/* Roughly the published Creator-tier rate. Only used to print an estimate. */
const USD_PER_1K_CHARS = 0.15;

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const val = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? null : args[i + 1];
};

const all = await loadLessons();
const only = val('only');
const limit = val('limit');

let work = only ? all.filter((x) => x.stage === only) : all;
if (limit) work = work.slice(0, Number(limit));

const manifest = await readManifest();
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? manifest.voiceId;

/* Plan first: what would change, and what it would cost. */
const plan = work.map(({ stage, lesson }) => {
  const chunks = lessonToChunks(lesson);
  const script = buildScript(chunks);
  const hash = scriptHash(script, voiceId ?? 'none', MODEL);
  const existing = manifest.lessons?.[lesson.id];
  return { stage, lesson, chunks, script, hash, stale: !existing || existing.hash !== hash };
});

const todo = has('force') ? plan : plan.filter((p) => p.stale);
const chars = todo.reduce((n, p) => n + p.script.length, 0);
const totalChars = plan.reduce((n, p) => n + p.script.length, 0);

console.log(`Lessons in scope : ${plan.length}`);
console.log(`Needing audio    : ${todo.length}`);
console.log(`Characters       : ${chars.toLocaleString()} of ${totalChars.toLocaleString()} total`);
console.log(`Estimated cost   : about $${((chars / 1000) * USD_PER_1K_CHARS).toFixed(2)} at $${USD_PER_1K_CHARS}/1k chars`);
console.log(`Model            : ${MODEL}`);
console.log(`Voice            : ${voiceId ?? '(none set)'}`);

if (has('dry')) {
  console.log('\nDry run — nothing generated.');
  process.exit(0);
}

if (!voiceId) {
  console.error('\nNo voice set. Run scripts/design-voice.mjs first, then export ELEVENLABS_VOICE_ID.');
  process.exit(1);
}

if (todo.length === 0) {
  console.log('\nEverything is already up to date.');
  process.exit(0);
}

const key = apiKey();
await mkdir(AUDIO_DIR, { recursive: true });

manifest.voiceId = voiceId;
manifest.model = MODEL;
manifest.lessons ??= {};

let done = 0;
for (const item of todo) {
  const { lesson, chunks, script, hash } = item;
  process.stdout.write(`  ${lesson.id} ${lesson.title.slice(0, 44).padEnd(46)}`);

  /* One retry, because a single transient 5xx should not lose a whole run. */
  let payload = null;
  for (let attempt = 0; attempt < 2 && !payload; attempt += 1) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({
          text: script,
          model_id: MODEL,
          /* Steady and clear beats expressive for a narrator you listen to for an hour. */
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, speed: 0.98, use_speaker_boost: true },
          apply_text_normalization: 'on',
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${(await res.text()).slice(0, 200)}`);
      payload = await res.json();
    } catch (err) {
      if (attempt === 1) {
        console.log(` failed\n    ${err.message}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!payload) continue;

  const file = `${lesson.id}.mp3`;
  const bytes = Buffer.from(payload.audio_base64, 'base64');
  await writeFile(path.join(AUDIO_DIR, file), bytes);

  const marks = marksFromAlignment(chunks, payload.alignment);
  const ends = payload.alignment?.character_end_times_seconds ?? [];
  manifest.lessons[lesson.id] = {
    file,
    hash,
    dur: Number((ends[ends.length - 1] ?? 0).toFixed(3)),
    bytes: bytes.length,
    marks,
  };

  /* Written after every lesson so an interrupted run keeps what it paid for. */
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));

  done += 1;
  console.log(` ok  ${(bytes.length / 1024).toFixed(0)}KB  ${manifest.lessons[lesson.id].dur.toFixed(0)}s`);
}

const totalBytes = Object.values(manifest.lessons).reduce((n, l) => n + (l.bytes ?? 0), 0);
console.log(`\nGenerated ${done}/${todo.length}.`);
console.log(`Library now ${Object.keys(manifest.lessons).length} lessons, ${(totalBytes / 1024 / 1024).toFixed(1)}MB.`);
console.log(`Manifest: ${path.relative(ROOT, MANIFEST)}`);
