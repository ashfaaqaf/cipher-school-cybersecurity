import type { Lesson, Question, Stage } from './types';
import { s00 } from './s00';
import { s01 } from './s01';
import { s02 } from './s02';
import { s03 } from './s03';
import { s04 } from './s04';
import { s05 } from './s05';
import { s06 } from './s06';
import { s07 } from './s07';
import { s08 } from './s08';
import { s09 } from './s09';
import { s10 } from './s10';
import { s11 } from './s11';
import { quizA } from './quiz-a';
import { quizB } from './quiz-b';
import { quizC } from './quiz-c';

export type { Lesson, Stage, Word, Level, Question } from './types';

export const stages: Stage[] = [s00, s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11];

export const filters = ['ALL', 'FOUNDATIONS', 'BUILD', 'OFFENSE', 'DEFENSE', 'CLOUD', 'RESEARCH', 'LEADERSHIP'];

export const tracks = [
  {
    code: 'BLUE',
    title: 'SOC analyst → Detection engineer',
    path: '00 → 01 → 02 → 04 → 07 → 08 → 09 → 11',
    note: 'Pick this if you like patterns, evidence and making fast calls under pressure.',
    hue: 155,
  },
  {
    code: 'RED',
    title: 'Penetration tester → Red team',
    path: '00 → 01 → 02 → 03 → 04 → 05 → 06 → 10 → 11',
    note: 'Pick this if you like creative problem-solving and writing that convinces people.',
    hue: 350,
  },
  {
    code: 'APP',
    title: 'AppSec → Product security',
    path: '00 → 02 → 03 → 04 → 05 → 09 → 11',
    note: 'Pick this if you like code, architecture and helping builders get it right.',
    hue: 25,
  },
  {
    code: 'CLOUD',
    title: 'Cloud security engineer',
    path: '00 → 01 → 02 → 04 → 07 → 09 → 11',
    note: 'Pick this if you enjoy identity, automation and very large systems.',
    hue: 200,
  },
  {
    code: 'DFIR',
    title: 'Incident response → Malware analyst',
    path: '00 → 01 → 02 → 03 → 07 → 08 → 10 → 11',
    note: 'Pick this if you like timelines, puzzles and deep system behaviour.',
    hue: 275,
  },
  {
    code: 'GRC',
    title: 'Governance, risk → Security leader',
    path: '00 → 02 → 04 → 07 → 09 → 11',
    note: 'Pick this if you connect technical reality to business decisions.',
    hue: 45,
  },
  {
    code: 'RESEARCH',
    title: 'Vulnerability researcher',
    path: '00 → 01 → 02 → 03 → 05 → 06 → 08 → 10 → 11',
    note: 'Pick this if you enjoy unknowns, experiments and original work.',
    hue: 300,
  },
];

export const sources = [
  { name: 'NIST CSF 2.0', kind: 'RISK', href: 'https://www.nist.gov/cyberframework', why: 'The six-function lifecycle: Govern, Identify, Protect, Detect, Respond, Recover.' },
  { name: 'NICE Framework', kind: 'CAREERS', href: 'https://niccs.cisa.gov/workforce-development/nice-framework', why: 'Work roles described through real tasks, knowledge and skills.' },
  { name: 'MITRE ATT&CK v18', kind: 'ADVERSARIES', href: 'https://attack.mitre.org/', why: 'Observed adversary behaviour, now with detection strategies and analytics.' },
  { name: 'OWASP Top 10: 2025', kind: 'APPSEC', href: 'https://owasp.org/Top10/', why: 'Current web risk baseline, including the new supply chain category.' },
  { name: 'OWASP Top 10 for LLMs', kind: 'AI', href: 'https://genai.owasp.org/llm-top-10/', why: 'Prompt injection, excessive agency and the rest of the GenAI risk set.' },
  { name: 'Web Security Academy', kind: 'LABS', href: 'https://portswigger.net/web-security', why: 'Free, legal, interactive web security labs. The best place to practise stage 05.' },
  { name: 'pwn.college', kind: 'LABS', href: 'https://pwn.college/', why: 'Free university-grade systems security curriculum from Arizona State.' },
  { name: 'OverTheWire', kind: 'LABS', href: 'https://overthewire.org/wargames/', why: 'Beginner-friendly command line and security wargames.' },
  { name: 'TryHackMe', kind: 'LABS', href: 'https://tryhackme.com/', why: 'Guided beginner rooms with a gentle learning curve.' },
  { name: 'NIST SP 800-61r3', kind: 'INCIDENTS', href: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', why: 'Incident response guidance realigned to CSF 2.0 in 2025.' },
  { name: 'NIST SSDF 800-218', kind: 'DEVSECOPS', href: 'https://csrc.nist.gov/pubs/sp/800/218/final', why: 'Secure software practices across the development lifecycle.' },
  { name: 'Kubernetes checklist', kind: 'CLOUD', href: 'https://kubernetes.io/docs/concepts/security/security-checklist/', why: 'The official baseline for cluster security decisions.' },
  { name: 'MITRE ATLAS', kind: 'AI', href: 'https://atlas.mitre.org/', why: 'Adversarial techniques against AI-enabled systems.' },
  { name: 'CISA KEV catalogue', kind: 'VULNS', href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', why: 'What is actually being exploited right now — better than severity alone.' },
  { name: 'CVSS v4.0', kind: 'VULNS', href: 'https://www.first.org/cvss/v4.0/', why: 'The standard way to communicate vulnerability severity.' },
  { name: 'NIST PQC standards', kind: 'CRYPTO', href: 'https://csrc.nist.gov/projects/post-quantum-cryptography', why: 'FIPS 203, 204 and 205 — the post-quantum migration you will live through.' },
];

export const allLessons: { lesson: Lesson; stage: Stage }[] = stages.flatMap((stage) =>
  stage.lessons.map((lesson) => ({ lesson, stage })),
);

export const totalLessons = allLessons.length;
export const totalHours = stages.reduce((sum, stage) => sum + stage.hours, 0);
export const totalWeeks = stages.reduce((sum, stage) => sum + stage.weeks, 0);
export const totalWords = stages.reduce(
  (sum, stage) => sum + stage.lessons.reduce((n, l) => n + l.words.length, 0),
  0,
);
export const totalReadMins = stages.reduce(
  (sum, stage) => sum + stage.lessons.reduce((n, l) => n + l.mins, 0),
  0,
);

/** Flat jargon dictionary, deduplicated by term, for the glossary view. */
export const glossary = [
  ...new Map(
    allLessons
      .flatMap(({ lesson, stage }) => lesson.words.map((w) => ({ ...w, stage: stage.number, lessonId: lesson.id })))
      .map((w) => [w.term.toLowerCase(), w]),
  ).values(),
].sort((a, b) => a.term.localeCompare(b.term));

export const questions: Question[] = [...quizA, ...quizB, ...quizC];

export const questionsByLesson = new Map<string, Question[]>();
for (const q of questions) {
  const list = questionsByLesson.get(q.lesson) ?? [];
  list.push(q);
  questionsByLesson.set(q.lesson, list);
}

export const totalQuestions = questions.length;

/**
 * One review card. Two kinds, because they train different things:
 * a question tests whether you understood, a term tests whether you can recall.
 */
export type Card =
  | { kind: 'quiz'; id: string; lesson: string; question: Question }
  | { kind: 'term'; id: string; lesson: string; term: string; means: string };

export const cards: Card[] = [
  ...questions.map((question) => ({ kind: 'quiz' as const, id: `q:${question.id}`, lesson: question.lesson, question })),
  ...glossary.map((w) => ({ kind: 'term' as const, id: `w:${w.term}`, lesson: w.lessonId, term: w.term, means: w.means })),
];

export const cardsById = new Map(cards.map((c) => [c.id, c]));

/** Cards belonging to one lesson, questions before terms. */
export function cardsForLesson(lessonId: string): Card[] {
  return cards.filter((c) => c.lesson === lessonId);
}
