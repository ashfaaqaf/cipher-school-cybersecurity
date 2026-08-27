/** Voice names vary by operating system. These markers describe high quality
 * system voices without pretending a proprietary assistant voice is available
 * to the browser. */
const NATURAL_MARKERS = ['natural', 'neural', 'premium', 'enhanced', 'siri'];
const PREFERRED = [
  'siri',
  'samantha',
  'ava',
  'allison',
  'serena',
  'susan',
  'daniel',
  'arthur',
  'oliver',
  'microsoft aria',
  'microsoft sonia',
  'microsoft ryan',
  'microsoft guy',
  'google uk english',
  'google us english',
];
const NOVELTY = [
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'deranged',
  'good news',
  'hysterical',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
];

const FEMALE_MARKERS = [
  'female',
  'woman',
  'samantha',
  'ava',
  'allison',
  'serena',
  'susan',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'victoria',
  'zira',
  'aria',
  'jenny',
  'sara',
  'sonia',
  'natasha',
  'emma',
  'libby',
  'michelle',
];
const MALE_MARKERS = [
  ' male',
  'man',
  'daniel',
  'arthur',
  'oliver',
  'alex',
  'aaron',
  'fred',
  'ralph',
  'guy',
  'ryan',
  'mark',
  'david',
  'george',
  'christopher',
  'eric',
  'roger',
  'stefan',
];

export type VoiceGender = 'female' | 'male' | 'unknown';
export type VoiceFilter = 'all' | Exclude<VoiceGender, 'unknown'>;

const voiceName = (voice: SpeechSynthesisVoice) => `${voice.name} ${voice.lang}`.toLowerCase();

export function isNoveltyVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voiceName(voice);
  return NOVELTY.some((marker) => name.includes(marker));
}

export function voiceQualityLabel(voice: SpeechSynthesisVoice): 'Natural' | 'Recommended' | 'System' {
  const name = voiceName(voice);
  if (NATURAL_MARKERS.some((marker) => name.includes(marker))) return 'Natural';
  if (PREFERRED.some((marker) => name.includes(marker)) || voice.default) return 'Recommended';
  return 'System';
}

/** The Web Speech API has no gender field. Only classify names that carry a
 * clear device-supplied marker; everything else stays available under All. */
export function voiceGender(voice: SpeechSynthesisVoice): VoiceGender {
  const name = voiceName(voice);
  if (FEMALE_MARKERS.some((marker) => name.includes(marker))) return 'female';
  if (MALE_MARKERS.some((marker) => name.includes(marker))) return 'male';
  return 'unknown';
}

export function voiceGenderLabel(voice: SpeechSynthesisVoice): 'Female' | 'Male' | 'Unspecified' {
  const gender = voiceGender(voice);
  if (gender === 'female') return 'Female';
  if (gender === 'male') return 'Male';
  return 'Unspecified';
}

export function rankVoice(voice: SpeechSynthesisVoice): number {
  const name = voiceName(voice);
  const hit = PREFERRED.findIndex((marker) => name.includes(marker));
  let score = hit === -1 ? 100 : hit;
  if (NATURAL_MARKERS.some((marker) => name.includes(marker))) score -= 80;
  if (voice.lang.toLowerCase().startsWith('en-gb')) score -= 18;
  else if (voice.lang.toLowerCase().startsWith('en')) score -= 14;
  if (voice.default) score -= 4;
  if (voice.localService) score -= 2;
  if (isNoveltyVoice(voice)) score += 1000;
  return score;
}

export function professionalVoiceList(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const cleanEnglish = english.filter((voice) => !isNoveltyVoice(voice));
  const cleanAnyLanguage = voices.filter((voice) => !isNoveltyVoice(voice));
  const candidates = cleanEnglish.length
    ? cleanEnglish
    : english.length
      ? english
      : cleanAnyLanguage.length
        ? cleanAnyLanguage
        : voices;
  return [...candidates].sort((a, b) => rankVoice(a) - rankVoice(b) || a.name.localeCompare(b.name));
}

export function filterProfessionalVoices(
  voices: SpeechSynthesisVoice[],
  filter: VoiceFilter,
): SpeechSynthesisVoice[] {
  const professional = professionalVoiceList(voices);
  return filter === 'all' ? professional : professional.filter((voice) => voiceGender(voice) === filter);
}

export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  return professionalVoiceList(voices)[0] ?? null;
}
