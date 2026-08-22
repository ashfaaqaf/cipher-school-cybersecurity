'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  allLessons,
  cardsForLesson,
  filters,
  glossary,
  sources,
  stages,
  totalHours,
  totalLessons,
  totalQuestions,
  totalReadMins,
  totalWeeks,
  tracks,
  type Lesson,
  type Stage,
} from './curriculum';
import { LessonQuiz, ReviewView } from './Review';
import { CompanionSection, RolesSection } from './Roles';
import { deckStats, schedule, today, type Deck, type Grade } from './srs';
import { useSpeaker } from './voice';
import { applyBackup, downloadBackup, type RestoreResult } from './backup';
import { TodayCard } from './Today';
import { WeekReview } from './Week';
import { buildCorpus, searchIn } from './search';
import { PrintSheet } from './Print';
import { SHORTCUTS, actionFor, isTyping } from './keys';
import { useFocusTrap } from './a11y';
import { hashFor, parseHash, sameRoute, type Route } from './routing';
import {
  CARD_MINS,
  DEFAULT_SETTINGS,
  dayKey,
  prune,
  record,
  studyMinsFor,
  type DayRecord,
  type History,
  type PlanSettings,
} from './plan';

const STORE = 'cipher-school-progress';
const THEME = 'cipher-school-theme';
const DECK = 'cipher-school-srs';
const PLAN = 'cipher-school-plan';

type View = 'learn' | 'review' | 'paths' | 'words' | 'sources';

const views: { id: View; icon: string; label: string }[] = [
  { id: 'learn', icon: '◈', label: 'Learn' },
  { id: 'review', icon: '↻', label: 'Review' },
  { id: 'paths', icon: '⇢', label: 'Paths' },
  { id: 'words', icon: '¶', label: 'Words' },
  { id: 'sources', icon: '❖', label: 'Sources' },
];

/* The curriculum is static, so the search corpus is built once, not per render. */
const CORPUS = buildCorpus(allLessons);

/** Light haptic tap where the device supports it. Silent everywhere else. */
function tap(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* vibration is a nicety, never a requirement */
  }
}

export default function Home() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('learn');
  const [openStage, setOpenStage] = useState<number | null>(0);
  const [reader, setReader] = useState<{ s: number; l: number } | null>(null);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [theme, setTheme] = useState<'night' | 'day'>('night');
  const [stuck, setStuck] = useState(false);
  const [progress, setProgress] = useState(0);
  const [popped, setPopped] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [deck, setDeck] = useState<Deck>({});
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [restore, setRestore] = useState<RestoreResult | null>(null);
  const [printing, setPrinting] = useState<Stage | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<HTMLDivElement | null>(null);
  const installRef = useRef<HTMLDivElement | null>(null);
  const [history, setHistory] = useState<History>({});
  const [planSettings, setPlanSettings] = useState<PlanSettings>(DEFAULT_SETTINGS);
  const dragFrom = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const speaker = useSpeaker();

  /* ---------- persistence ---------- */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORE);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
      const t = window.localStorage.getItem(THEME);
      if (t === 'day' || t === 'night') setTheme(t);
      const d = window.localStorage.getItem(DECK);
      if (d) setDeck(JSON.parse(d));
      const p = window.localStorage.getItem(PLAN);
      if (p) {
        const parsed = JSON.parse(p) as { settings?: PlanSettings; history?: History };
        if (parsed.settings) setPlanSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (parsed.history) setHistory(prune(parsed.history));
      }
    } catch {
      /* progress simply starts clean when storage is unavailable */
    }
  }, []);

  /* ---------- daily plan ---------- */

  const savePlan = useCallback((settings: PlanSettings, hist: History) => {
    try {
      window.localStorage.setItem(PLAN, JSON.stringify({ settings, history: prune(hist) }));
    } catch {
      /* the session still works without persistence */
    }
  }, []);

  /** Fold a finished piece of work into today's record. */
  const logWork = useCallback(
    (add: Partial<DayRecord>) => {
      setHistory((prev) => {
        const next = record(prev, dayKey(), add);
        savePlan(planSettings, next);
        return next;
      });
    },
    [planSettings, savePlan],
  );

  const changeSettings = useCallback(
    (next: PlanSettings) => {
      setPlanSettings(next);
      savePlan(next, history);
      tap();
    },
    [history, savePlan],
  );

  /* ---------- spaced repetition ---------- */

  /** A card is only in play once you have read the lesson it came from. */
  const unlocked = useMemo(
    () => [...completed].flatMap((lessonId) => cardsForLesson(lessonId).map((c) => c.id)),
    [completed],
  );

  const srs = useMemo(() => deckStats(deck, unlocked, today()), [deck, unlocked]);

  const gradeCard = useCallback((id: string, g: Grade) => {
    setDeck((prev) => {
      const next = { ...prev, [id]: schedule(prev[id], g) };
      try {
        window.localStorage.setItem(DECK, JSON.stringify(next));
      } catch {
        /* the session still works without persistence */
      }
      return next;
    });
    logWork({ cards: 1, mins: CARD_MINS });
    tap(g === 0 ? 18 : 8);
  }, [logWork]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME, theme);
    } catch {
      /* preference is cosmetic; ignore storage failures */
    }
  }, [theme]);

  const save = useCallback((next: Set<string>) => {
    setCompleted(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify([...next]));
    } catch {
      /* the session still works without persistence */
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(completed);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setPopped(id);
        /* Count the stage's study estimate, not the reading time. The plan
           budgets a lesson at roughly two and a half hours because that covers
           the lab and the exercise; logging six minutes against it would leave
           the day's progress bar permanently near zero. Marking a lesson
           understood is a claim to have done that work. */
        const entry = allLessons.find((x) => x.lesson.id === id);
        const mins = entry ? studyMinsFor(entry.stage.hours, entry.stage.lessons.length) : 30;
        logWork({ lessons: 1, mins, ids: [id] });
        tap(12);
        window.setTimeout(() => setPopped(null), 480);
      }
      save(next);
    },
    [completed, save, logWork],
  );

  /* ---------- offline ---------- */

  useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'http:' && window.location.hostname !== 'localhost') return;

    let cancelled = false;
    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        if (cancelled) return;
        if (navigator.serviceWorker.controller) setOfflineReady(true);

        /* A worker already waiting means a newer build is sitting there. */
        if (reg.waiting) {
          waitingRef.current = reg.waiting;
          setUpdateReady(true);
        }

        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state !== 'installed') return;
            if (navigator.serviceWorker.controller) {
              waitingRef.current = next;
              setUpdateReady(true);
            } else {
              setOfflineReady(true);
            }
          });
        });
      })
      .catch(() => {
        /* offline support is an enhancement; the app works without it */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    waitingRef.current?.postMessage('skip-waiting');
    /* The new worker takes control, then the page reloads onto the new build. */
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    setUpdateReady(false);
  }, []);

  /* ---------- backup ---------- */

  const onExport = useCallback(() => {
    const b = downloadBackup();
    setRestore({ ok: true, lessons: b.summary.lessons, cards: b.summary.cards, skipped: [] });
    tap();
  }, []);

  const onImportFile = useCallback(
    async (file: File) => {
      const result = applyBackup(await file.text());
      setRestore(result);
      if (result.ok) {
        /* Re-read from storage rather than trusting local state to match. */
        try {
          setCompleted(new Set(JSON.parse(window.localStorage.getItem(STORE) ?? '[]')));
          setDeck(JSON.parse(window.localStorage.getItem(DECK) ?? '{}'));
          const t = window.localStorage.getItem(THEME);
          if (t === 'day' || t === 'night') setTheme(t);
        } catch {
          /* the restore already succeeded; a read-back failure is cosmetic */
        }
        tap(16);
      }
    },
    [],
  );

  useFocusTrap(readerRef, reader !== null);
  useFocusTrap(helpRef, helpOpen);
  useFocusTrap(voiceRef, voiceOpen);
  useFocusTrap(installRef, installOpen);

  /* ---------- url ---------- */

  /*
   * Hash routing, so a lesson can be bookmarked and shared and the back button
   * does something sensible. Reading the hash is the only source of truth on
   * load; after that the app writes to it.
   */
  const applyRoute = useCallback((route: Route) => {
    setView(route.view);
    if (!route.lessonId) {
      /* No lesson in the URL means no lesson open — otherwise pressing back
         out of a lesson clears the address bar and leaves the reader sitting
         there, which reads as the back button being broken. */
      setReader(null);
      return;
    }
    const si = stages.findIndex((st) => st.lessons.some((x) => x.id === route.lessonId));
    if (si === -1) return;
    setOpenStage(si);
    setReader({ s: si, l: stages[si].lessons.findIndex((x) => x.id === route.lessonId) });
  }, []);

  useEffect(() => {
    applyRoute(parseHash(window.location.hash));
    const onHash = () => applyRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [applyRoute]);

  /* Write the current state back, replacing rather than pushing so the back
     button leaves the app instead of walking every lesson you opened. */
  useEffect(() => {
    const lessonId = reader ? stages[reader.s].lessons[reader.l].id : null;
    const next: Route = { view, lessonId };
    if (sameRoute(next, parseHash(window.location.hash))) return;
    const url = `${window.location.pathname}${window.location.search}${hashFor(next)}`;
    window.history.replaceState(null, '', url || window.location.pathname);
  }, [view, reader]);

  /* ---------- print ---------- */

  /*
   * Render the sheet first, then print — calling window.print() in the same tick
   * prints the previous frame, which is a blank page.
   *
   * A timeout rather than requestAnimationFrame on purpose: rAF is throttled to
   * nothing in a background or hidden tab, which would leave the button dead
   * with no way to tell why.
   */
  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 60);
    return () => window.clearTimeout(id);
  }, [printing]);

  /* ---------- scroll chrome ---------- */

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setStuck(y > 12);
        const span = document.body.scrollHeight - window.innerHeight;
        setProgress(span > 0 ? Math.min(1, y / span) : 0);
        /* Drives the ambient parallax in CSS — one property write per frame. */
        document.documentElement.style.setProperty('--scroll', String(Math.min(3, y / window.innerHeight)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* ---------- keyboard ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = actionFor(
        { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, shiftKey: e.shiftKey },
        {
          inReader: reader !== null,
          inReview: false,
          revealed: false,
          typing: isTyping(e.target),
          sheetOpen: reader !== null || installOpen || voiceOpen || helpOpen,
        },
      );
      if (!action) return;

      switch (action.type) {
        case 'search':
          e.preventDefault();
          setView('learn');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.setTimeout(() => searchRef.current?.focus(), 120);
          break;
        case 'view':
          e.preventDefault();
          goto(views[action.index].id);
          break;
        case 'next':
          e.preventDefault();
          step(1);
          break;
        case 'prev':
          e.preventDefault();
          step(-1);
          break;
        case 'toggleDone':
          if (current) {
            e.preventDefault();
            toggle(current.lesson.id);
          }
          break;
        case 'listen':
          e.preventDefault();
          listen();
          break;
        case 'help':
          e.preventDefault();
          setHelpOpen(true);
          break;
        case 'close':
          if (helpOpen) setHelpOpen(false);
          else if (voiceOpen) setVoiceOpen(false);
          else if (installOpen) setInstallOpen(false);
          else if (reader) closeReader();
          else if (isTyping(e.target)) (e.target as HTMLElement).blur();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ---------- reveal on scroll ---------- */

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [view, openStage, query, filter]);

  /* ---------- body lock while a sheet is open ---------- */

  const sheetOpen = reader !== null || installOpen;
  useEffect(() => {
    document.body.classList.toggle('locked', sheetOpen);
    return () => document.body.classList.remove('locked');
  }, [sheetOpen]);

  /* ---------- derived ---------- */

  const doneCount = completed.size;
  const pct = Math.round((doneCount / totalLessons) * 100);

  const visibleStages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stages.filter((stage) => {
      if (filter !== 'ALL' && !stage.tags.includes(filter)) return false;
      if (!q) return true;
      return (
        stage.title.toLowerCase().includes(q) ||
        stage.subtitle.toLowerCase().includes(q) ||
        stage.plain.toLowerCase().includes(q) ||
        stage.lessons.some(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.oneLine.toLowerCase().includes(q) ||
            l.words.some((w) => w.term.toLowerCase().includes(q)),
        )
      );
    });
  }, [query, filter]);

  /** Full-text hits, used instead of the stage list whenever there is a query. */
  const hits = useMemo(() => (view === 'learn' ? searchIn(CORPUS, query) : []), [query, view]);

  const visibleWords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((w) => w.term.toLowerCase().includes(q) || w.means.toLowerCase().includes(q));
  }, [query]);

  const stageDone = useCallback(
    (stage: Stage) => stage.lessons.filter((l) => completed.has(l.id)).length,
    [completed],
  );

  /** The lesson to suggest next: first unfinished, in course order. */
  const nextUp = useMemo(() => allLessons.find(({ lesson }) => !completed.has(lesson.id)), [completed]);

  /* ---------- reader ---------- */

  const current = reader ? { stage: stages[reader.s], lesson: stages[reader.s].lessons[reader.l] } : null;
  const flatIndex = reader ? allLessons.findIndex((x) => x.lesson.id === current!.lesson.id) : -1;

  const openReader = useCallback((s: number, l: number) => {
    setDragY(0);
    setClosing(false);
    setReader({ s, l });
  }, []);

  const closeReader = useCallback(() => {
    speaker.stop();
    setClosing(true);
    window.setTimeout(() => {
      setReader(null);
      setClosing(false);
      setDragY(0);
    }, 300);
  }, [speaker]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const target = flatIndex + dir;
      if (target < 0 || target >= allLessons.length) return;
      const { lesson } = allLessons[target];
      const s = stages.findIndex((st) => st.lessons.some((x) => x.id === lesson.id));
      const l = stages[s].lessons.findIndex((x) => x.id === lesson.id);
      setDragY(0);
      speaker.stop();
      setReader({ s, l });
      document.querySelector('.sheetBody')?.scrollTo({ top: 0 });
    },
    [flatIndex, speaker],
  );

  /** Jump straight to a lesson by id — the role requirement chips use this. */
  const openById = useCallback(
    (lessonId: string) => {
      const si = stages.findIndex((st) => st.lessons.some((x) => x.id === lessonId));
      if (si === -1) return;
      const li = stages[si].lessons.findIndex((x) => x.id === lessonId);
      setOpenStage(si);
      openReader(si, li);
    },
    [openReader],
  );

  /** Read the open lesson aloud, from the top or from wherever narration stopped. */
  const listen = useCallback(() => {
    if (!current) return;
    if (speaker.speaking) {
      if (speaker.paused) speaker.resume();
      else speaker.pause();
      return;
    }
    speaker.play(current.lesson);
  }, [current, speaker]);

  useEffect(() => {
    if (!reader) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReader();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reader, closeReader, step]);

  /* drag the grabber to dismiss, the way an iOS sheet behaves */
  const onGrabStart = (e: ReactPointerEvent) => {
    dragFrom.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onGrabMove = (e: ReactPointerEvent) => {
    if (dragFrom.current === null) return;
    setDragY(Math.max(0, e.clientY - dragFrom.current));
  };
  const onGrabEnd = () => {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    if (dragY > 110) closeReader();
    else setDragY(0);
  };

  /* ---------- stage hue drives the whole palette ---------- */

  const activeHue = current ? current.stage.hue : openStage !== null ? stages[openStage]?.hue : 210;
  const rootStyle = { '--hue': String(activeHue ?? 210) } as CSSProperties;

  const goto = (id: View) => {
    setView(id);
    tap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app" style={rootStyle}>

      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--grow)" />
          </linearGradient>
        </defs>
      </svg>

      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="shell">
        {/* ---------------- top bar ---------------- */}
        <header className={stuck ? 'topbar stuck' : 'topbar'}>
          <div className="topRow">
            <div className="brand">
              <div className="mark">CS</div>
              <div>
                <div className="brandName">Cipher School</div>
                <div className="brandSub">Beginner → researcher</div>
              </div>
            </div>
            <div className="topActions">
              <button
                className="iconBtn"
                onClick={() => {
                  setTheme(theme === 'night' ? 'day' : 'night');
                  tap();
                }}
                aria-label={theme === 'night' ? 'Switch to light reading mode' : 'Switch to dark mode'}
                title="Reading mode"
              >
                {theme === 'night' ? '☀' : '☾'}
              </button>
              {speaker.supported && (
                <button className="iconBtn" onClick={() => setVoiceOpen(true)} aria-label="Narration settings" title="Narration">
                  ⌁
                </button>
              )}
              <button className="iconBtn" onClick={() => setInstallOpen(true)} aria-label="Add to iPhone" title="Add to iPhone">
                ⌂
              </button>
            </div>
          </div>

          <div className="island" role="status" aria-live="polite">
            <span className="pulse" aria-hidden="true" />
            <div className="islandText">
              {doneCount === 0 ? (
                <>Ready when you are — <b>start with stage 00</b></>
              ) : nextUp ? (
                <>
                  <b>{doneCount}</b> of {totalLessons} done · next: {nextUp.lesson.title}
                </>
              ) : (
                <><b>All {totalLessons} lessons complete.</b> Go build something.</>
              )}
            </div>
            <div className="islandBar" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="progressLine" aria-hidden="true">
            <i style={{ transform: `scaleX(${progress})` }} />
          </div>
        </header>

        {/* ---------------- hero ---------------- */}
        <main id="main">
        <section className="hero">
          <div className="heroCopy">
          <span className="eyebrow">◆ Everything, in plain language</span>
          <h1>
            Learn cybersecurity <em>from zero</em> to genuinely expert.
          </h1>
          <p className="lede">
            {stages.length} stages. {totalLessons} written lessons — not a list of topics, but the actual explanation, in words a
            beginner can follow. Every idea gets a plain meaning, an everyday comparison, a jargon decoder, and something
            to go and do.
          </p>

          <div className="heroActions">
            <button
              className="btn primary"
              onClick={() => {
                if (nextUp) {
                  const s = stages.findIndex((st) => st.lessons.some((x) => x.id === nextUp.lesson.id));
                  const l = stages[s].lessons.findIndex((x) => x.id === nextUp.lesson.id);
                  setOpenStage(s);
                  openReader(s, l);
                }
                tap();
              }}
            >
              {doneCount === 0 ? 'Start lesson one' : 'Continue where you left off'} <span aria-hidden="true">→</span>
            </button>
            <button className="btn ghost" onClick={() => goto('paths')}>
              Pick a career path
            </button>
          </div>

          </div>

          <div className="heroSide">
          <div className="stats">
            <div className="stat glass">
              <div className="statNum">{totalLessons}</div>
              <div className="statLabel">Written lessons</div>
            </div>
            <div className="stat glass">
              <div className="statNum">{glossary.length}</div>
              <div className="statLabel">Terms decoded</div>
            </div>
            <div className="stat glass">
              <div className="statNum">{Math.round(totalReadMins / 60)}h</div>
              <div className="statLabel">Reading time</div>
            </div>
            <div className="stat glass">
              <div className="statNum">{totalHours}</div>
              <div className="statLabel">Hours with practice</div>
            </div>
          </div>

          <div className="ringWrap glass">
            <div className="ring">
              <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">
                <circle className="ringTrack" cx="37" cy="37" r="31" />
                <circle
                  className="fill"
                  cx="37"
                  cy="37"
                  r="31"
                  strokeDasharray={2 * Math.PI * 31}
                  strokeDashoffset={2 * Math.PI * 31 * (1 - doneCount / totalLessons)}
                />
              </svg>
              <div className="ringPct">{pct}%</div>
            </div>
            <div className="ringInfo">
              <h3>Your progress</h3>
              <p>
                {doneCount} of {totalLessons} lessons · saved on this device only, nothing is uploaded anywhere.
              </p>
              <div className="dataRow">
                <button className="dataBtn" onClick={onExport}>
                  ↓ Back up
                </button>
                <button className="dataBtn" onClick={() => fileRef.current?.click()}>
                  ↑ Restore
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onImportFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
              {restore && (
                <p className={restore.ok ? 'dataNote ok' : 'dataNote bad'}>
                  {restore.ok
                    ? `Saved — ${restore.lessons} lesson${restore.lessons === 1 ? '' : 's'}, ${
                        restore.cards
                      } review card${restore.cards === 1 ? '' : 's'}.${
                        restore.skipped.length ? ` Skipped: ${restore.skipped.join('; ')}.` : ''
                      }`
                    : restore.error}
                </p>
              )}
            </div>
          </div>
          </div>
        </section>

        {/* ---------------- learn ---------------- */}
        {view === 'learn' && (
          <section id="learn">
            <TodayCard
              history={history}
              settings={planSettings}
              setSettings={changeSettings}
              completed={completed}
              dueCards={srs.due}
              onOpen={openById}
              onReview={() => goto('review')}
            />

            <div className="sectionHead reveal">
              <div className="kicker">The roadmap</div>
              <h2>{stages.length} stages, in order</h2>
              <p className="sectionNote">
                Do them in sequence if you are new. Each stage recolours the app — a different colour per stage helps
                your memory keep them separate. Tap any lesson to read it.
              </p>
            </div>

            <div className="searchRow reveal">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search every word — press /"
                  aria-label="Search the curriculum"
                  type="search"
                />
              </label>
            </div>

            <div className="chips reveal" role="tablist" aria-label="Filter by theme">
              {filters.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  className={filter === f ? 'chip on' : 'chip'}
                  onClick={() => {
                    setFilter(f);
                    tap();
                  }}
                >
                  {f === 'ALL' ? 'All stages' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {query.trim() && (
              <div className="results">
                <div className="resultsHead">
                  {hits.length === 0
                    ? `Nothing matches "${query.trim()}".`
                    : `${hits.length} lesson${hits.length === 1 ? ' mentions' : 's mention'} "${query.trim()}"`}
                </div>
                {hits.map((hit) => (
                  <button
                    className="result"
                    key={hit.lessonId}
                    style={{ '--hue': String(hit.stageHue) } as CSSProperties}
                    onClick={() => openById(hit.lessonId)}
                  >
                    <div className="resultTop">
                      <span className="resultStage">{hit.stageNumber}</span>
                      <span className="resultTitle">{hit.title}</span>
                      {completed.has(hit.lessonId) && <span className="resultDone">OK</span>}
                    </div>
                    <div className="resultSnippet">
                      <span className="resultWhere">{hit.where}</span>
                      {hit.snippet.map((seg, i) =>
                        seg.hit ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>,
                      )}
                    </div>
                  </button>
                ))}
                {hits.length === 0 && (
                  <div className="emptyText" style={{ marginTop: 8 }}>
                    Search covers every word of every lesson, including the explanations and the jargon decoder. Try a
                    shorter phrase.
                  </div>
                )}
              </div>
            )}

            <div className="stageList" style={{ marginTop: 14, display: query.trim() ? 'none' : undefined }}>
              {visibleStages.length === 0 && (
                <div className="empty">
                  <div className="emptyTitle">Nothing matches that</div>
                  <div className="emptyText">Try a shorter word, or clear the filter.</div>
                </div>
              )}

              {visibleStages.map((stage) => {
                const idx = stages.indexOf(stage);
                const done = stageDone(stage);
                const open = openStage === idx;
                const complete = done === stage.lessons.length;
                return (
                  <article
                    key={stage.number}
                    className={`stage glass reveal${open ? ' open' : ''}${complete ? ' done' : ''}`}
                    style={{ '--hue': String(stage.hue) } as CSSProperties}
                  >
                    <button
                      className="stageBtn"
                      onClick={() => {
                        setOpenStage(open ? null : idx);
                        tap();
                      }}
                      aria-expanded={open}
                    >
                      <div className="stageNum">{stage.number}</div>
                      <div className="stageMain">
                        <div className="stageTitle">{stage.title}</div>
                        <div className="stageSub">{stage.subtitle}</div>
                        <div className="stageMeta">
                          <span className="tag level">{stage.level}</span>
                          <span className="tag">{stage.weeks}w</span>
                          <span className="tag">{stage.hours}h</span>
                          {stage.tags.map((t) => (
                            <span className="tag" key={t}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="stageRight">
                        <span className="stageCount">
                          {done}/{stage.lessons.length}
                        </span>
                        <span className="miniBar" aria-hidden="true">
                          <i style={{ width: `${(done / stage.lessons.length) * 100}%` }} />
                        </span>
                        <span className="caret" aria-hidden="true">
                          ▾
                        </span>
                      </div>
                    </button>

                    <div className="stageBody">
                      <div className="stageBodyInner">
                        <div className="stagePad">
                          <p className="plain">
                            <b>In plain words: </b>
                            {stage.plain}
                          </p>

                          <div className="lessons">
                            {stage.lessons.map((lesson, li) => {
                              const isDone = completed.has(lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className={isDone ? 'lesson done' : 'lesson'}
                                  onClick={() => openReader(idx, li)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      openReader(idx, li);
                                    }
                                  }}
                                >
                                  <button
                                    className={popped === lesson.id ? 'tick pop' : 'tick'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggle(lesson.id);
                                    }}
                                    aria-label={isDone ? `Mark ${lesson.title} unread` : `Mark ${lesson.title} done`}
                                    aria-pressed={isDone}
                                  >
                                    ✓
                                  </button>
                                  <div className="lessonMain">
                                    <div className="lessonTitle">{lesson.title}</div>
                                    <div className="lessonOne">{lesson.oneLine}</div>
                                  </div>
                                  <span className="lessonMins">{lesson.mins}m</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="blocks">
                            <div className="block">
                              <div className="blockLabel">What you will be able to do</div>
                              <div className="blockText">{stage.outcome}</div>
                            </div>
                            <div className="block">
                              <div className="blockLabel">Build this</div>
                              <div className="blockText">{stage.project}</div>
                            </div>
                            <div className="block">
                              <div className="blockLabel">You are ready to move on when</div>
                              <div className="blockText">{stage.checkpoint}</div>
                            </div>
                          </div>

                          <div className="links">
                            {stage.resources.map((r) => (
                              <a key={r.href} className="link" href={r.href} target="_blank" rel="noreferrer">
                                {r.label} ↗
                              </a>
                            ))}
                            <button className="link" onClick={() => setPrinting(stage)}>
                              ⎙ Print or save as PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="safety reveal">
              <div className="safetyTitle">⚠ Practise legally, always</div>
              <div className="safetyText">
                Only test systems you own, systems you have written permission to test, or labs built for practice.
                Scanning or accessing anything else is a crime in most countries, even with good intentions and even if
                nothing breaks. Every offensive technique in this course has a free, legal place to practise it — those
                links are inside each stage.
              </div>
            </div>
          </section>
        )}

        {/* ---------------- review ---------------- */}
        {view === 'review' && (
          <section id="review" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Spaced repetition</div>
              <h2>Lock it in</h2>
              <p className="sectionNote">
                Reading a lesson once teaches you almost nothing. {totalQuestions} questions and {glossary.length} terms
                come back at growing intervals — just before you would have forgotten them, which is exactly when
                recalling something makes it permanent.
              </p>
            </div>
            <WeekReview history={history} settings={planSettings} onOpen={openById} />

            <ReviewView deck={deck} unlocked={unlocked} onGrade={gradeCard} speak={speaker.supported ? speaker.say : undefined} />
          </section>
        )}

        {/* ---------------- paths ---------------- */}
        {view === 'paths' && (
          <section id="paths" className="band">
            <RolesSection completed={completed} onOpen={openById} />

            <div className="sectionHead reveal" style={{ marginTop: 40 }}>
              <div className="kicker">Career paths</div>
              <h2>Eight ways through</h2>
              <p className="sectionNote">
                Security is not one job. These are the real role families and the stage order that gets you to each one.
                Stage 00 is compulsory for all of them.
              </p>
            </div>
            <div className="trackGrid">
              {tracks.map((t) => (
                <article key={t.code} className="track glass reveal" style={{ '--hue': String(t.hue) } as CSSProperties}>
                  <div className="trackTop">
                    <span className="trackCode">{t.code}</span>
                    <span className="trackTitle">{t.title}</span>
                  </div>
                  <div className="trackPath">{t.path}</div>
                  <div className="trackNote">{t.note}</div>
                </article>
              ))}
            </div>

            <CompanionSection />
          </section>
        )}

        {/* ---------------- glossary ---------------- */}
        {view === 'words' && (
          <section id="words" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Jargon decoder</div>
              <h2>{glossary.length} words, in human</h2>
              <p className="sectionNote">
                Every term this course uses, explained without using more jargon to explain it. This is the page to come
                back to when someone says something that sounds like a spell.
              </p>
            </div>

            <div className="searchRow reveal">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Look up a word…"
                  aria-label="Search the glossary"
                  type="search"
                />
              </label>
            </div>

            <div className="glossList">
              {visibleWords.length === 0 && (
                <div className="empty">
                  <div className="emptyTitle">No match</div>
                  <div className="emptyText">Try part of the word instead of all of it.</div>
                </div>
              )}
              {visibleWords.map((w) => (
                <button key={w.term} className="glossItem reveal" onClick={() => openById(w.lessonId)}>
                  <div className="glossTerm">{w.term}</div>
                  <div className="glossMeans">{w.means}</div>
                  <div className="glossStage">Stage {w.stage} · read the lesson →</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- sources ---------------- */}
        {view === 'sources' && (
          <section id="sources" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Where this comes from</div>
              <h2>Primary sources</h2>
              <p className="sectionNote">
                This curriculum is built on published standards and free labs, not opinion. Go to the originals — they
                are better than any summary, including this one.
              </p>
            </div>
            <div className="sourceGrid">
              {sources.map((s) => (
                <a key={s.href} className="source reveal" href={s.href} target="_blank" rel="noreferrer">
                  <div className="sourceTop">
                    <span className="sourceName">{s.name}</span>
                    <span className="sourceKind">{s.kind}</span>
                  </div>
                  <div className="sourceWhy">{s.why}</div>
                </a>
              ))}
            </div>

            <div className="safety reveal" style={{ background: 'var(--glass)', borderColor: 'var(--rim)' }}>
              <div className="safetyTitle" style={{ color: 'var(--ink)' }}>
                An honest limit
              </div>
              <div className="safetyText">
                Nobody masters all of cybersecurity — the field is far too large, and anyone claiming otherwise is
                selling something. This course is built for broad foundations plus one deep speciality. That shape is
                what actually gets hired, and it is what stage 10 is for.
              </div>
            </div>

            <footer className="foot">
              <p>
                Cipher School · {totalLessons} lessons · {totalWeeks} weeks of structured study · progress stored only in
                this browser.
              </p>
              <p>Built as an open study aid. Curriculum grounded in NIST, MITRE and OWASP publications.</p>
            </footer>
          </section>
        )}
        </main>
      </div>

      {/* ---------------- new build available ---------------- */}
      {updateReady && (
        <div className="updateBar glass" role="status">
          <span className="updateText">A newer version of the course is ready.</span>
          <button className="updateBtn" onClick={applyUpdate}>
            Refresh
          </button>
        </div>
      )}

      {/* ---------------- dock ---------------- */}
      <nav className="dock" aria-label="Sections">
        {views.map((v) => (
          <button
            key={v.id}
            className={view === v.id ? 'dockBtn on' : 'dockBtn'}
            onClick={() => goto(v.id)}
            aria-current={view === v.id ? 'page' : undefined}
          >
            <span className="dockIcon" aria-hidden="true">
              {v.icon}
              {v.id === 'review' && srs.due > 0 && <b className="dockBadge">{srs.due > 99 ? '99+' : srs.due}</b>}
            </span>
            <span className="dockLabel">{v.label}</span>
          </button>
        ))}
      </nav>

      {/* ---------------- lesson reader ---------------- */}
      {reader && current && (
        <>
          <div className={closing ? 'scrim out' : 'scrim'} onClick={closeReader} aria-hidden="true" />
          <div
            ref={readerRef}
            className={closing ? 'sheet out' : 'sheet'}
            style={{
              '--hue': String(current.stage.hue),
              transform: dragY ? `translateY(${dragY}px)` : undefined,
              transition: dragY ? 'none' : undefined,
            } as CSSProperties}
            role="dialog"
            aria-modal="true"
            aria-label={current.lesson.title}
          >
            <div
              className="grabber"
              onPointerDown={onGrabStart}
              onPointerMove={onGrabMove}
              onPointerUp={onGrabEnd}
              onPointerCancel={onGrabEnd}
            >
              <i />
            </div>

            <div className="sheetHead">
              <div className="sheetCrumb">
                Stage {current.stage.number} · {current.stage.title}
              </div>
              <h3 className="sheetTitle">{current.lesson.title}</h3>
              <div className="sheetMeta">
                Lesson {flatIndex + 1} of {totalLessons} · about {current.lesson.mins} minutes to read
              </div>
            </div>

            {speaker.supported && (
              <div className={speaker.speaking ? 'player on' : 'player'}>
                <button className="playBtn" onClick={listen} aria-label={speaker.speaking && !speaker.paused ? 'Pause' : 'Listen'}>
                  {speaker.speaking && !speaker.paused ? '❙❙' : '▶'}
                </button>
                <div className="playInfo">
                  {speaker.speaking ? (
                    <>
                      <div className="playLabel">{speaker.chunks[speaker.index]?.label ?? 'Reading'}</div>
                      <div className="playTrack" aria-hidden="true">
                        <i style={{ width: `${((speaker.index + 1) / Math.max(1, speaker.total)) * 100}%` }} />
                      </div>
                    </>
                  ) : (
                    <div className="playLabel">
                      Listen to this lesson
                      {speaker.hasAudioFor(current.lesson.id) && speaker.preferStudio && (
                        <span className="studioTag">studio voice</span>
                      )}
                    </div>
                  )}
                </div>
                {speaker.speaking && (
                  <>
                    <button className="playMini" onClick={() => speaker.jump(-1)} aria-label="Back">
                      ↺
                    </button>
                    <button className="playMini" onClick={() => speaker.jump(1)} aria-label="Skip">
                      ↻
                    </button>
                    <button className="playMini" onClick={speaker.stop} aria-label="Stop">
                      ✕
                    </button>
                  </>
                )}
                <button className="playMini" onClick={() => setVoiceOpen(true)} aria-label="Voice settings">
                  ⚙
                </button>
              </div>
            )}

            <div className="sheetBody">
              <LessonBody lesson={current.lesson} activeLabel={speaker.speaking ? speaker.chunks[speaker.index]?.label : undefined} />
              <LessonQuiz lessonId={current.lesson.id} onGrade={gradeCard} />
            </div>

            <div className="sheetFoot">
              <button className="navBtn" onClick={() => step(-1)} disabled={flatIndex <= 0} aria-label="Previous lesson">
                ‹
              </button>
              <button
                className={completed.has(current.lesson.id) ? 'btn done' : 'btn primary'}
                onClick={() => {
                  toggle(current.lesson.id);
                  if (!completed.has(current.lesson.id) && flatIndex < allLessons.length - 1) {
                    window.setTimeout(() => step(1), 320);
                  }
                }}
              >
                {completed.has(current.lesson.id) ? '✓ Done — tap to undo' : 'Mark as understood'}
              </button>
              <button
                className="navBtn"
                onClick={() => step(1)}
                disabled={flatIndex >= allLessons.length - 1}
                aria-label="Next lesson"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------------- narration settings ---------------- */}
      {voiceOpen && (
        <>
          <div className="scrim" onClick={() => setVoiceOpen(false)} aria-hidden="true" />
          <div ref={voiceRef} className="sheet" role="dialog" aria-modal="true" aria-label="Narration settings">
            <div className="grabber" onPointerDown={() => setVoiceOpen(false)}>
              <i />
            </div>
            <div className="sheetHead">
              <div className="sheetCrumb">Listen instead of reading</div>
              <h3 className="sheetTitle">Narration</h3>
              <div className="sheetMeta">
                {speaker.voices.length} voice{speaker.voices.length === 1 ? '' : 's'} available on this device
              </div>
            </div>
            <div className="sheetBody">
              {speaker.hasStudio && (
                <div className="readCard key">
                  <div className="readLabel">Narrator</div>
                  <div className="rateRow" style={{ gridAutoFlow: 'row' }}>
                    <button
                      className={speaker.preferStudio ? 'ratePill on' : 'ratePill'}
                      onClick={() => speaker.setPreferStudio(true)}
                    >
                      Studio voice · {speaker.studioCount} lessons
                    </button>
                    <button
                      className={!speaker.preferStudio ? 'ratePill on' : 'ratePill'}
                      onClick={() => speaker.setPreferStudio(false)}
                    >
                      This device
                    </button>
                  </div>
                </div>
              )}

              <div className="readCard key">
                <div className="readLabel">Speed</div>
                <div className="rateRow">
                  {[0.8, 1, 1.2, 1.5, 1.8].map((r) => (
                    <button
                      key={r}
                      className={Math.abs(speaker.rate - r) < 0.01 ? 'ratePill on' : 'ratePill'}
                      onClick={() => speaker.setRate(r)}
                    >
                      {r}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="readCard">
                <div className="readLabel">Device voice{speaker.hasStudio ? ' (used as fallback)' : ''}</div>
                <div className="voiceList">
                  {speaker.voices.length === 0 && (
                    <div className="cardPrompt">
                      No voices reported yet. On some browsers they appear only after the first playback — press Listen
                      once and come back.
                    </div>
                  )}
                  {speaker.voices.map((v) => (
                    <button
                      key={v.voiceURI}
                      className={speaker.voiceURI === v.voiceURI ? 'voiceRow on' : 'voiceRow'}
                      onClick={() => {
                        speaker.setVoiceURI(v.voiceURI);
                        speaker.say('Narration set. Ready when you are.');
                      }}
                    >
                      <span className="voiceName">{v.name}</span>
                      <span className="voiceLang">{v.lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="readCard check">
                <div className="readLabel">A note on the voice</div>
                <div className="readText">
                  The studio narrator is an original synthetic voice designed from a written brief — a calm, precise
                  British narrator. It is not a clone of any performer, and no film audio was used to make it. Studio
                  audio is generated ahead of time and served as ordinary files, so no API key ever reaches your
                  browser and it keeps working offline.
                  {' '}
                  Anything without studio audio falls back to the voices installed on this device. On iPhone, Settings →
                  Accessibility → Spoken Content → Voices downloads much better ones. iOS stops narration when the
                  screen locks.
                </div>
              </div>
            </div>
            <div className="sheetFoot">
              <button className="btn primary" onClick={() => setVoiceOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------------- keyboard help ---------------- */}
      {helpOpen && (
        <>
          <div className="scrim" onClick={() => setHelpOpen(false)} aria-hidden="true" />
          <div ref={helpRef} className="sheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div className="grabber" onPointerDown={() => setHelpOpen(false)}>
              <i />
            </div>
            <div className="sheetHead">
              <div className="sheetCrumb">Faster on a keyboard</div>
              <h3 className="sheetTitle">Shortcuts</h3>
            </div>
            <div className="sheetBody">
              <div className="keyList">
                {SHORTCUTS.map((s, i) => (
                  <div className="keyRow" key={i}>
                    <span className="keyCombo">
                      {s.keys.map((k, n) =>
                        k === '–' ? (
                          <span className="keyDash" key={n}>
                            –
                          </span>
                        ) : (
                          <kbd key={n}>{k}</kbd>
                        ),
                      )}
                    </span>
                    <span className="keyWhat">
                      {s.what}
                      {s.when && <em className="keyWhen"> · while {s.when}</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sheetFoot">
              <button className="btn primary" onClick={() => setHelpOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </>
      )}

      {printing && <PrintSheet stage={printing} />}

      {/* ---------------- install sheet ---------------- */}
      {installOpen && (
        <>
          <div className="scrim" onClick={() => setInstallOpen(false)} aria-hidden="true" />
          <div ref={installRef} className="sheet" role="dialog" aria-modal="true" aria-label="Add to iPhone">
            <div className="grabber" onPointerDown={() => setInstallOpen(false)}>
              <i />
            </div>
            <div className="sheetHead">
              <div className="sheetCrumb">Works offline once added</div>
              <h3 className="sheetTitle">Put this on your Home Screen</h3>
            </div>
            <div className="sheetBody">
              <div className="readCard key">
                <div className="readLabel">iPhone and iPad</div>
                <div className="readText">
                  In Safari, tap the Share button, scroll down and choose <b>Add to Home Screen</b>, then tap Add. It
                  opens full screen with no browser bars, like a normal app.
                </div>
              </div>
              <div className="readCard">
                <div className="readLabel">Android</div>
                <div className="readText">In Chrome, open the menu and choose Add to Home screen.</div>
              </div>
              <div className={offlineReady ? 'readCard do' : 'readCard'}>
                <div className="readLabel">Offline</div>
                <div className="readText">
                  {offlineReady
                    ? 'Saved for offline use. Every lesson, question and term works with no signal — on a bus, on a plane, anywhere.'
                    : 'Caching in the background. Once it finishes, the whole course works with no connection at all.'}
                </div>
              </div>

              <div className="readCard">
                <div className="readLabel">Desktop</div>
                <div className="readText">
                  In Chrome or Edge, use the install icon in the address bar. Your progress lives in the browser, so each
                  device keeps its own.
                </div>
              </div>
            </div>
            <div className="sheetFoot">
              <button className="btn primary" onClick={() => setInstallOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The reading view for one lesson. Order matters: idea, comparison, detail, jargon, why, do, check. */
function LessonBody({ lesson, activeLabel }: { lesson: Lesson; activeLabel?: string }) {
  /* While narration runs, the section being spoken is marked so the eye can follow it. */
  const lit = (label: string) => (activeLabel === label ? ' reading' : '');

  return (
    <>
      <div className={`readCard key${lit('The whole idea')}`}>
        <div className="readLabel">The whole idea</div>
        <div className="readText">{lesson.oneLine}</div>
      </div>

      <div className={`readCard like${lit('Think of it like')}`}>
        <div className="readLabel">Think of it like</div>
        <div className="readText">{lesson.like}</div>
      </div>

      <div className="prose">
        {lesson.body.map((p, i) => (
          <p key={i} className={activeLabel === `Explanation ${i + 1}` ? 'reading' : undefined}>
            {p}
          </p>
        ))}
      </div>

      <div className={`readCard${lit('Jargon decoder')}`} style={{ marginTop: 18 }}>
        <div className="readLabel">Jargon decoder</div>
        <div className="wordList" style={{ marginTop: 8 }}>
          {lesson.words.map((w) => (
            <div className="word" key={w.term}>
              <div className="wordTerm">{w.term}</div>
              <div className="wordMeans">{w.means}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`readCard why${lit('Why this matters')}`}>
        <div className="readLabel">Why this matters</div>
        <div className="readText">{lesson.why}</div>
      </div>

      <div className={`readCard do${lit('Go and do this')}`}>
        <div className="readLabel">Go and do this</div>
        <div className="readText">{lesson.doThis}</div>
      </div>

      <div className={`readCard check${lit('Check yourself')}`}>
        <div className="readLabel">Check yourself</div>
        <div className="readText">{lesson.check}</div>
      </div>
    </>
  );
}
