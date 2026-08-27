import assert from 'node:assert/strict';
import {
  filterProfessionalVoices,
  isNoveltyVoice,
  pickDefaultVoice,
  professionalVoiceList,
  voiceGender,
  voiceQualityLabel,
} from './app/voice-profile.ts';

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
const female = voice('Microsoft Aria Online (Natural)');
const male = voice('Microsoft Ryan Online (Natural)');
const unspecified = voice('Siri Voice 1');

assert.equal(voiceQualityLabel(natural), 'Natural');
assert.equal(isNoveltyVoice(novelty), true);
assert.equal(voiceGender(female), 'female');
assert.equal(voiceGender(male), 'male');
assert.equal(voiceGender(unspecified), 'unknown');
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
assert.deepEqual(
  filterProfessionalVoices([female, male, unspecified], 'female').map((item) => item.name),
  [female.name],
  'the female filter should keep only clearly identified female voices',
);
assert.deepEqual(
  filterProfessionalVoices([female, male, unspecified], 'male').map((item) => item.name),
  [male.name],
  'the male filter should keep only clearly identified male voices',
);

console.log('voice: all checks passed');
