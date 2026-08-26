/**
 * Everything in Cipher School is one of these shapes. Lessons are written in
 * plain language on purpose: if you cannot explain an idea clearly, you
 * have not learned yet.
 */

export type Word = {
  /** The jargon you will meet in the wild. */
  term: string;
  /** What it actually means, said like a human. */
  means: string;
};

export type Lesson = {
  id: string;
  title: string;
  /** The entire lesson compressed into one sentence. */
  oneLine: string;
  /** An everyday comparison, so the idea has something to hold on to. */
  like: string;
  /** Short paragraphs. Each one should survive being read out loud. */
  body: string[];
  /** Jargon decoder for this lesson. */
  words: Word[];
  /** Why a real person should care. */
  why: string;
  /** Something to actually do, today, safely. */
  doThis: string;
  /** Ask yourself this. If you cannot answer it, read again. */
  check: string;
  /** Realistic reading time in minutes. */
  mins: number;
};

export type Level = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type Stage = {
  number: string;
  title: string;
  /** Plain-language promise: what you will be able to do afterwards. */
  subtitle: string;
  level: Level;
  tags: string[];
  weeks: number;
  hours: number;
  /** The stage's own colour, used for memory-anchoring across the app. */
  hue: number;
  /** One sentence a twelve-year-old would understand. */
  plain: string;
  outcome: string;
  project: string;
  checkpoint: string;
  lessons: Lesson[];
  resources: { label: string; href: string }[];
};

export type Question = {
  id: string;
  /** The lesson this question belongs to, so it unlocks with that lesson. */
  lesson: string;
  ask: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Shown after answering, right or wrong. Getting it wrong is the useful moment. */
  why: string;
};
