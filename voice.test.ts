import assert from 'node:assert/strict';
import { isNoveltyVoice, pickDefaultVoice, professionalVoiceList, voiceQualityLabel } from './app/voice-profile.ts';

const voice = (
  name: string,
  lang = 'en-US',
  options: { local?: boolean; default?: boolean } = {},
) => ({
  name,
  lang,
  localService: options.local ?? true,
  default: options.default ?? false,
  voiceURI: `voice:${name}`,
}) as SpeechSynthesisVoice;

const natural = voice('Microsoft Aria Online (Natural)', 'en-US', { local: false });
const siri = voice('Siri Voice 1');
const standard = voice('Plain English');
const novelty = voice('Zarvox');
const french = voice('Amelie', 'fr-FR');

assert.equal(voiceQualityLabel(natural), 'Natural');
assert.equal(isNoveltyVoice(novelty), true);
assert.equal(pickDefaultVoice([standard, natural])?.name, natural.name, 'a natural voice should win automatic selection');
assert.equal(pickDefaultVoice([natural, siri])?.name, siri.name, 'an exposed Siri system voice should receive first priority');
assert.deepEqual(
  professionalVoiceList([novelty, french, standard, natural]).map((item) => item.name),
  [natural.name, standard.name],
  'the visible list should keep professional English voices and remove novelty characters',
);
assert.deepEqual(
  professionalVoiceList([french]).map((item) => item.name),
  [french.name],
  'another language must remain available when no English voice exists',
);

console.log('voice: all checks passed');
