'use client';

/**
 * Progress lives in localStorage and nowhere else: no account, no server,
 * nothing uploaded. That is the right default for a study app, and it has one
 * consequence people discover the hard way: clearing your browser deletes
 * everything. This is the escape hatch.
 *
 * A restore file comes from outside the app, so it is validated rather than
 * trusted. Not because a study backup is a juicy target, but because "we parsed
 * it and assigned it" is the same mistake as every deserialisation bug in
 * lesson 05-5, and it would be a poor look here of all places.
 */

const KEYS = {
  progress: 'cipher-school-progress',
  deck: 'cipher-school-srs',
  theme: 'cipher-school-theme',
  voice: 'cipher-school-voice',
  plan: 'cipher-school-plan',
  practised: 'cipher-school-practised',
  academy: 'cipher-school-academy',
  accessibility: 'cipher-school-accessibility',
} as const;

const FORMAT = 'cipher-school-backup';
const VERSION = 4;

/** Guards against a hostile or corrupt file eating memory or the UI. */
const LIMITS = { lessons: 5000, cards: 20000, fileBytes: 2_000_000 };

export type Backup = {
  format: typeof FORMAT;
  version: number;
  exported: string;
  summary: { lessons: number; cards: number };
  data: {
    progress: string[];
    deck: Record<string, unknown>;
    theme: string | null;
    voice: unknown;
    /** Added in version 2. Absent in older backups, which still restore. */
    plan?: unknown;
    /** Added in version 3: exercise evidence, profile, missions and capstones. */
    practised?: string[];
    academy?: unknown;
    /** Added in version 4: reading comfort, motion and contrast preferences. */
    accessibility?: unknown;
  };
};

export type RestoreResult =
  | { ok: true; lessons: number; cards: number; skipped: string[] }
  | { ok: false; error: string };

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null; // a corrupt key should not sink the whole export
  }
}

export function buildBackup(): Backup {
  const progress = read(KEYS.progress);
  const deck = read(KEYS.deck);
  const lessons = Array.isArray(progress) ? progress.filter((x) => typeof x === 'string') : [];
  const cards = deck && typeof deck === 'object' ? (deck as Record<string, unknown>) : {};

  return {
    format: FORMAT,
    version: VERSION,
    exported: new Date().toISOString(),
    summary: { lessons: lessons.length, cards: Object.keys(cards).length },
    data: {
      progress: lessons,
      deck: cards,
      theme: window.localStorage.getItem(KEYS.theme),
      voice: read(KEYS.voice),
      plan: read(KEYS.plan),
      practised: Array.isArray(read(KEYS.practised)) ? (read(KEYS.practised) as string[]) : [],
      academy: read(KEYS.academy),
      accessibility: read(KEYS.accessibility),
    },
  };
}

/** A filename with the date in it, because people end up with several. */
export function backupFilename(now = new Date()): string {
  return `cipher-school-progress-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(): Backup {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFilename();
  a.click();
  /* Revoking immediately can cancel the download in some browsers. */
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return backup;
}

/**
 * Validate and apply a restore file. Returns what was accepted and what was
 * skipped, rather than throwing: the caller shows the user both.
 */
export function applyBackup(text: string): RestoreResult {
  if (text.length > LIMITS.fileBytes) {
    return { ok: false, error: 'That file is far larger than a progress backup should be.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That is not a valid JSON file.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'That file is not a Cipher School backup.' };
  }

  const b = parsed as Partial<Backup>;
  if (b.format !== FORMAT) {
    return { ok: false, error: 'That file is not a Cipher School backup.' };
  }
  if (typeof b.version !== 'number' || b.version > VERSION) {
    return { ok: false, error: 'That backup was made by a newer version of the app.' };
  }
  if (!b.data || typeof b.data !== 'object') {
    return { ok: false, error: 'That backup has no data in it.' };
  }

  const skipped: string[] = [];

  /* Progress: strings only, deduplicated, capped. */
  const rawProgress = Array.isArray(b.data.progress) ? b.data.progress : [];
  const lessons = [...new Set(rawProgress.filter((x): x is string => typeof x === 'string'))].slice(
    0,
    LIMITS.lessons,
  );
  if (rawProgress.length !== lessons.length) skipped.push('some progress entries were not valid');

  /* Deck: only entries that actually look like a schedule. */
  const rawDeck = b.data.deck && typeof b.data.deck === 'object' ? b.data.deck : {};
  const deck: Record<string, unknown> = {};
  let dropped = 0;
  for (const [id, value] of Object.entries(rawDeck).slice(0, LIMITS.cards)) {
    const v = value as Record<string, unknown> | null;
    const valid =
      v &&
      typeof v === 'object' &&
      typeof v.ease === 'number' &&
      typeof v.interval === 'number' &&
      typeof v.reps === 'number' &&
      typeof v.due === 'number' &&
      Number.isFinite(v.ease) &&
      Number.isFinite(v.due);
    if (valid) deck[id] = value;
    else dropped += 1;
  }
  if (dropped) skipped.push(`${dropped} review card${dropped === 1 ? '' : 's'} were malformed`);

  try {
    window.localStorage.setItem(KEYS.progress, JSON.stringify(lessons));
    window.localStorage.setItem(KEYS.deck, JSON.stringify(deck));
    if (b.data.theme === 'day' || b.data.theme === 'night') {
      window.localStorage.setItem(KEYS.theme, b.data.theme);
    }
    if (b.data.voice && typeof b.data.voice === 'object') {
      window.localStorage.setItem(KEYS.voice, JSON.stringify(b.data.voice));
    }
    /* Absent in version 1 backups, which is fine: the streak restarts. */
    if (b.data.plan && typeof b.data.plan === 'object') {
      window.localStorage.setItem(KEYS.plan, JSON.stringify(b.data.plan));
    }
    if (Array.isArray(b.data.practised)) {
      const practised = [...new Set(b.data.practised.filter((x): x is string => typeof x === 'string'))].slice(0, LIMITS.lessons);
      window.localStorage.setItem(KEYS.practised, JSON.stringify(practised));
    }
    if (b.data.academy && typeof b.data.academy === 'object' && !Array.isArray(b.data.academy)) {
      window.localStorage.setItem(KEYS.academy, JSON.stringify(b.data.academy));
    }
    if (b.data.accessibility && typeof b.data.accessibility === 'object' && !Array.isArray(b.data.accessibility)) {
      const access = b.data.accessibility as Record<string, unknown>;
      window.localStorage.setItem(KEYS.accessibility, JSON.stringify({
        comfortableReading: access.comfortableReading === true,
        reduceMotion: access.reduceMotion === true,
        strongContrast: access.strongContrast === true,
      }));
    }
  } catch {
    return { ok: false, error: 'This browser would not let the app save the restored data.' };
  }

  return { ok: true, lessons: lessons.length, cards: Object.keys(deck).length, skipped };
}
