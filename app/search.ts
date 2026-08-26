/**
 * Full-text search across everything a lesson contains.
 *
 * The old search only looked at titles and one-liners, which meant most of the
 * 22,000 words of explanation were unreachable — you could not find the lesson
 * that explains password spraying by searching "spraying", because the phrase
 * only appears in the body.
 *
 * Small enough corpus (110 lessons) that a linear scan per keystroke is fine.
 * An index would be premature; if it ever stops feeling instant, that is the
 * moment to build one.
 */

export type Segment = { text: string; hit: boolean };

export type Hit = {
  lessonId: string;
  stageNumber: string;
  stageTitle: string;
  stageHue: number;
  title: string;
  score: number;
  /** Which part of the lesson matched, for the result label. */
  where: string;
  /** The surrounding text, split so matches can be highlighted. */
  snippet: Segment[];
};

type Field = { name: string; weight: number; text: string };

export type Entry = {
  lessonId: string;
  stageNumber: string;
  stageTitle: string;
  stageHue: number;
  title: string;
  fields: Field[];
};

/**
 * The corpus is passed in rather than imported, so this module stays pure and
 * can be exercised without pulling in the whole curriculum.
 *
 * `exercises` is optional and keyed by lesson id. Without it the corpus is
 * exactly what it always was; with it, searching "nmap" or "spraying" also
 * finds the exercise that makes you do the thing, which was previously the one
 * part of the app search could not reach.
 */
export function buildCorpus(
  lessons: { lesson: { id: string; title: string; oneLine: string; like: string; why: string; doThis: string; check: string; body: string[]; words: { term: string; means: string }[] }; stage: { number: string; title: string; hue: number } }[],
  exercises?: Map<string, { title: string; brief: string; artefact: { lines: string[] }; steps: { ask: string }[] }>,
): Entry[] {
  return lessons.map(({ lesson, stage }) => ({
    lessonId: lesson.id,
    stageNumber: stage.number,
    stageTitle: stage.title,
    stageHue: stage.hue,
    title: lesson.title,
    fields: [
      { name: 'title', weight: 10, text: lesson.title },
      { name: 'the whole idea', weight: 6, text: lesson.oneLine },
      { name: 'jargon', weight: 5, text: lesson.words.map((w) => `${w.term} — ${w.means}`).join(' · ') },
      { name: 'analogy', weight: 3, text: lesson.like },
      { name: 'why it matters', weight: 2, text: lesson.why },
      { name: 'go and do this', weight: 2, text: lesson.doThis },
      { name: 'check yourself', weight: 2, text: lesson.check },
      { name: 'explanation', weight: 1, text: lesson.body.join(' ') },
      ...(exercises?.has(lesson.id)
        ? [
            {
              name: 'exercise',
              weight: 6,
              text: [
                exercises.get(lesson.id)!.title,
                exercises.get(lesson.id)!.brief,
                exercises.get(lesson.id)!.steps.map((s) => s.ask).join(' '),
                exercises.get(lesson.id)!.artefact.lines.join(' '),
              ].join(' '),
            },
          ]
        : []),
    ],
  }));
}

export function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/i)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length > 1);
}

/** Split text around every term match, so the caller can highlight them. */
export function highlight(text: string, list: string[]): Segment[] {
  if (list.length === 0) return [{ text, hit: false }];

  const escaped = list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');

  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), hit: false });
    out.push({ text: m[0], hit: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}

/** A window of text around the first match, cut on word boundaries. */
export function snippetAround(text: string, list: string[], width = 150): string {
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of list) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return text.slice(0, width).trim() + (text.length > width ? '…' : '');

  let start = Math.max(0, at - Math.floor(width / 3));
  let end = Math.min(text.length, start + width);
  /* Avoid slicing a word in half at either edge. */
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space !== -1 && space < at) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > at) end = space;
  }

  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Rank lessons for a query. Every term must appear somewhere in the lesson,
 * so "password spraying" does not return every lesson containing "password".
 */
export function searchIn(corpus: Entry[], query: string, limit = 40): Hit[] {
  const list = terms(query);
  if (list.length === 0) return [];

  const hits: Hit[] = [];

  for (const entry of corpus) {
    let score = 0;
    let best: Field | null = null;
    let matchedAll = true;

    for (const term of list) {
      let bestForTerm = 0;
      let bestField: Field | null = null;
      for (const field of entry.fields) {
        if (field.text.toLowerCase().includes(term) && field.weight > bestForTerm) {
          bestForTerm = field.weight;
          bestField = field;
        }
      }
      if (bestForTerm === 0) {
        matchedAll = false;
        break;
      }
      score += bestForTerm;
      if (!best || bestForTerm > best.weight) best = bestField;
    }

    if (!matchedAll || !best) continue;

    /* Prefer the richest field that actually contains a term for the snippet —
       a title match is a poor snippet, since the title is already shown. */
    const source =
      best.name === 'title'
        ? entry.fields.find((f) => f.name !== 'title' && list.some((t) => f.text.toLowerCase().includes(t))) ?? best
        : best;

    hits.push({
      lessonId: entry.lessonId,
      stageNumber: entry.stageNumber,
      stageTitle: entry.stageTitle,
      stageHue: entry.stageHue,
      title: entry.title,
      score,
      where: source.name,
      snippet: highlight(snippetAround(source.text, list), list),
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.lessonId.localeCompare(b.lessonId)).slice(0, limit);
}
