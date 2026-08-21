/**
 * Design an original synthetic narrator from a text description, listen to the
 * candidates, then save the one you want.
 *
 *   node scripts/design-voice.mjs                 # generate 3 candidates
 *   node scripts/design-voice.mjs --keep 2        # save candidate 2 permanently
 *   node scripts/design-voice.mjs --describe "…"  # your own description
 *
 * This creates a NEW voice from a written brief. It is not a clone of any
 * performer, and nothing from any film is used as input — that route is both a
 * copyright problem and a personality-rights one, and it is not available here.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AUDIO_DIR, ROOT, apiKey, call } from './voice-lib.mjs';

const DRAFTS = path.join(ROOT, '.voice-drafts');

/* A written brief for the register: unhurried, precise, quietly amused. */
const DEFAULT_BRIEF =
  'A calm, refined British male voice in his forties. Warm baritone, unhurried and ' +
  'precise, with immaculate received pronunciation. He speaks like a trusted advisor ' +
  'briefing someone he respects: measured pacing, clean consonants, no theatricality, ' +
  'a faint undertone of dry wit held in reserve. Composed and reassuring even when the ' +
  'subject is serious. Studio quality, no background noise.';

/* Sample text should exercise the register you actually need. */
const SAMPLE =
  'Confidentiality means only the right people can see it. Integrity means nobody changed ' +
  'it behind your back. Availability means you can reach it when you need it. Every control ' +
  'you will ever deploy exists to protect one of those three promises. If you can name which ' +
  'one broke, you already know where to start looking.';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? true;
};

const key = apiKey();

async function design() {
  const description = flag('describe') || DEFAULT_BRIEF;
  console.log('Designing candidates from the brief…\n');

  const out = await call('/text-to-voice/design', {
    key,
    body: {
      voice_description: description,
      model_id: 'eleven_ttv_v3',
      text: SAMPLE,
      loudness: 0.5,
      guidance_scale: 6,
    },
  });

  await mkdir(DRAFTS, { recursive: true });
  const index = [];

  for (const [i, preview] of (out.previews ?? []).entries()) {
    const file = path.join(DRAFTS, `candidate-${i + 1}.mp3`);
    await writeFile(file, Buffer.from(preview.audio_base_64, 'base64'));
    index.push({ n: i + 1, generated_voice_id: preview.generated_voice_id, file });
    console.log(`  ${i + 1}. ${path.relative(ROOT, file)}  (${preview.duration_secs?.toFixed?.(1) ?? '?'}s)`);
  }

  await writeFile(path.join(DRAFTS, 'candidates.json'), JSON.stringify({ description, index }, null, 2));
  console.log('\nListen to them, then keep the one you want:\n  node scripts/design-voice.mjs --keep <number>');
}

async function keep(n) {
  const { description, index } = JSON.parse(await readFile(path.join(DRAFTS, 'candidates.json'), 'utf8'));
  const pick = index.find((c) => c.n === Number(n));
  if (!pick) {
    console.error(`No candidate ${n}. Run without --keep first.`);
    process.exit(1);
  }

  const voice = await call('/text-to-voice', {
    key,
    body: {
      voice_name: 'Cipher School Narrator',
      voice_description: description,
      generated_voice_id: pick.generated_voice_id,
    },
  });

  console.log(`\nSaved. voice_id: ${voice.voice_id}\n`);
  console.log('Set it for generation:');
  console.log(`  export ELEVENLABS_VOICE_ID=${voice.voice_id}`);
  console.log('  node scripts/narrate.mjs --dry     # see the cost first');
  await mkdir(AUDIO_DIR, { recursive: true });
}

const which = flag('keep');
await (which ? keep(which) : design());
