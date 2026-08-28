export const NOTES_STORE = 'cipher-school-notes';
export const NOTE_LIMIT = 4_000;

export type LessonNotes = Record<string, string>;

type NoteLesson = {
  id: string;
  title: string;
  stageNumber: string;
  stageTitle: string;
};

const LESSON_ID = /^\d{2}-\d{1,2}$/;

/** Repair device or backup data before it reaches the lesson editor. */
export function safeNotes(input: unknown): LessonNotes {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  const notes: LessonNotes = {};
  for (const [lessonId, value] of Object.entries(input).slice(0, 500)) {
    if (!LESSON_ID.test(lessonId) || typeof value !== 'string') continue;
    const note = value.slice(0, NOTE_LIMIT);
    if (note.trim()) notes[lessonId] = note;
  }
  return notes;
}

/** Return a new notebook after one lesson note changes. Blank notes disappear. */
export function changeNote(notes: LessonNotes, lessonId: string, value: string): LessonNotes {
  if (!LESSON_ID.test(lessonId)) return notes;
  const next = { ...notes };
  const note = value.slice(0, NOTE_LIMIT);
  if (note.trim()) next[lessonId] = note;
  else delete next[lessonId];
  return next;
}

export function notesMarkdown(notes: LessonNotes, lessons: NoteLesson[], now = new Date()): string {
  const entries = lessons.filter((lesson) => notes[lesson.id]?.trim());
  const lines = [
    '# Cipher School Field Notes',
    '',
    `Exported: ${now.toISOString().slice(0, 10)}`,
    `Lessons with notes: ${entries.length}`,
    '',
  ];

  if (!entries.length) {
    lines.push('No lesson notes yet.');
    return lines.join('\n');
  }

  for (const lesson of entries) {
    lines.push(
      `## Stage ${lesson.stageNumber}: ${lesson.stageTitle}`,
      '',
      `### ${lesson.title}`,
      '',
      notes[lesson.id].trim(),
      '',
    );
  }

  return lines.join('\n').trimEnd();
}
