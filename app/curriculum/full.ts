/**
 * Everything the light index leaves out: the twenty-two thousand words of
 * explanation, the two hundred and twenty questions and the four hundred
 * definitions.
 *
 * This module is only ever reached through `import('./curriculum/full')`, so
 * none of it is in the first bundle. The app starts prefetching it the moment
 * the browser goes idle, which means that by the time anyone opens a lesson,
 * searches, or starts a review, it is already in memory: the split buys a
 * smaller first load without buying a spinner.
 */

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
import { s12 } from './s12';
import { quizA } from './quiz-a';
import { quizB } from './quiz-b';
import { quizC } from './quiz-c';
import { quizD } from './quiz-d';

export const stages: Stage[] = [s00, s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12];

export const allLessons: { lesson: Lesson; stage: Stage }[] = stages.flatMap((stage) =>
  stage.lessons.map((lesson) => ({ lesson, stage })),
);

export const lessonById = new Map(allLessons.map(({ lesson }) => [lesson.id, lesson]));
export const stageByNumber = new Map(stages.map((stage) => [stage.number, stage]));

/** Flat jargon dictionary, deduplicated by term, for the glossary view. */
export const glossary = [
  ...new Map(
    allLessons
      .flatMap(({ lesson, stage }) => lesson.words.map((w) => ({ ...w, stage: stage.number, lessonId: lesson.id })))
      .map((w) => [w.term.toLowerCase(), w]),
  ).values(),
].sort((a, b) => a.term.localeCompare(b.term));

export const questions: Question[] = [...quizA, ...quizB, ...quizC, ...quizD];

export const questionsByLesson = new Map<string, Question[]>();
for (const q of questions) {
  const list = questionsByLesson.get(q.lesson) ?? [];
  list.push(q);
  questionsByLesson.set(q.lesson, list);
}

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
