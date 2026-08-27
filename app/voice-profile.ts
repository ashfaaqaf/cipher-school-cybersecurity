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

export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  return professionalVoiceList(voices)[0] ?? null;
}
