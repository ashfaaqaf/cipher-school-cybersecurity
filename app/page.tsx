'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { flushSync } from 'react-dom';
import brandIcon from './brand-icon.png';
import { Hero } from './Hero';
import {
  allLessons,
  cardIdsByLesson,
  practiceLessons,
  filters,
  glossaryCount,
  sources,
  stages,
  totalHours,
  totalLessons,
  totalQuestions,
  totalReadMins,
  totalWeeks,
  tracks,
  type FullLesson,
  type FullStage,
  type Stage,
} from './curriculum';
import { loadFull, prefetchCurriculum, useFull, usePractice } from './curriculum/load';
import dynamic from 'next/dynamic';

const LessonQuiz = dynamic(() => import('./Review').then((m) => m.LessonQuiz), { ssr: false });
const ReviewView = dynamic(() => import('./Review').then((m) => m.ReviewView), { ssr: false });
const RolesSection = dynamic(() => import('./Roles').then((m) => m.RolesSection), { ssr: false });
const PracticeBlock = dynamic(() => import('./Practice').then((m) => m.PracticeBlock), { ssr: false });
const EvidenceSheet = dynamic(() => import('./Evidence').then((m) => m.EvidenceSheet), { ssr: false });
const CompanionSection = dynamic(() => import('./Roles').then((m) => m.CompanionSection), { ssr: false });
const SkillCheck = dynamic(() => import('./SkillCheck').then((m) => m.SkillCheck), { ssr: false });
import { deckStats, schedule, today, type Deck, type Grade } from './srs';
import { useSpeaker } from './voice';
import { voiceGenderLabel, voiceQualityLabel } from './voice-profile';
import { applyBackup, downloadBackup, type RestoreResult } from './backup';
import { TodayCard } from './Today';
import { WeekReview } from './Week';
import { buildCorpus, searchIn } from './search';
import { PrintSheet } from './Print';
import { CapabilityBoundary, FreshnessPanel, MissionsView, ProofView, RouteBuilder, useAcademy } from './AcademyViews';
import { SettingsView, type AccessibilitySettings } from './Settings';
import { clearCipherSchoolStorage } from './reset';
import { CAPSTONES, MISSIONS, downloadText } from './academy';
import { NavFlyout, type FlyMenu } from './NavFlyout';
import {
  NOTE_LIMIT,
  NOTES_STORE,
  changeNote,
  notesMarkdown,
  safeNotes,
  type LessonNotes,
} from './notes';
import { SHORTCUTS, actionFor, isTyping } from './keys';
import { useFocusTrap } from './a11y';
import { hashFor, parseHash, sameRoute, type Route, type View } from './routing';
import { InterfaceIcon, type InterfaceIcon as InterfaceIconName } from './icons';
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
const UPDATED = 'cipher-school-updated';
const PRACTISED = 'cipher-school-practised';
/** What one hands-on exercise is worth to the daily plan. */
const PRACTICE_MINS = 10;
const PLAN = 'cipher-school-plan';
const ACCESSIBILITY = 'cipher-school-accessibility';
const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  comfortableReading: false,
  reduceMotion: false,
  strongContrast: false,
};

function safeAccessibility(input: unknown): AccessibilitySettings {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  return {
    comfortableReading: value.comfortableReading === true,
    reduceMotion: value.reduceMotion === true,
    strongContrast: value.strongContrast === true,
  };
}

const views: { id: Exclude<View, 'settings'>; icon: InterfaceIconName; label: string }[] = [
  { id: 'learn', icon: 'learn', label: 'Learn' },
  { id: 'missions', icon: 'missions', label: 'Missions' },
  { id: 'review', icon: 'review', label: 'Review' },
  { id: 'paths', icon: 'paths', label: 'Paths' },
  { id: 'proof', icon: 'proof', label: 'Proof' },
  { id: 'words', icon: 'words', label: 'Glossary' },
  { id: 'sources', icon: 'sources', label: 'Sources' },
];

/** Everything the main menu lists: the seven sections, then settings. */
const MENU: { id: View; label: string }[] = [
  ...views.map(({ id, label }) => ({ id, label })),
  { id: 'settings', label: 'Settings' },
];

/**
 * A change of page cross-fades through the View Transitions API where the
 * browser has it, the way a native app moves between screens rather than
 * swapping one for the other in a single frame. Where the API is missing, or
 * motion is reduced (by this app's own setting or the system's), the change
 * is instant. `after` runs once the new page is in the DOM, which is
 * what a scroll position has to wait for.
 */
function withTransition(change: () => void, after?: () => void) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  const reduce =
    document.documentElement.dataset.motion === 'reduce' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = () => {
    flushSync(change);
    after?.();
  };
  if (doc.startViewTransition && !reduce) doc.startViewTransition(run);
  else run();
}

type LessonStep = 'understand' | 'recall' | 'apply' | 'capture';

const LESSON_STEPS: { id: LessonStep; label: string; note: string }[] = [
  { id: 'understand', label: 'Understand', note: 'Build the mental model' },
  { id: 'recall', label: 'Recall', note: 'Answer from memory' },
  { id: 'apply', label: 'Apply', note: 'Use the idea safely' },
  { id: 'capture', label: 'Capture', note: 'Save what matters' },
];

/*
 * The corpus needs every word of every lesson, so it is built the first time
 * the heavy half of the curriculum is in memory, once, not per render, and
 * not before anyone has typed anything.
 */
let CORPUS: ReturnType<typeof buildCorpus> | null = null;

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
  /*
   * Which stages have ever been opened. A closed stage renders its heading and
   * nothing else: rendering all 110 lesson rows up front put 1300 elements on
   * the page and made hydration pay for twelve stages nobody had opened. Once a
   * stage has been opened its rows stay mounted, so closing it still animates.
   */
  const [everOpen, setEverOpen] = useState<Set<number>>(() => new Set([0]));
  const [reader, setReader] = useState<{ s: number; l: number } | null>(null);
  const [activeLessonStep, setActiveLessonStep] = useState<LessonStep>('understand');
  const [query, setQuery] = useState('');
  /*
   * Searching scans every word of all 110 lessons, which is a few milliseconds
   * on a laptop and rather more on a phone. Deferring it means the keystroke
   * paints immediately and the results land a frame later, rather than every
   * character waiting on the scan and the re-render behind it.
   */
  const search = useDeferredValue(query);
  const [filter, setFilter] = useState('ALL');
  const [theme, setTheme] = useState<'night' | 'day'>('night');
  /*
   * First visit follows the operating system. It cannot be read during the
   * first render: this page is prerendered to static HTML at build time, and a
   * machine that has no idea what your display settings are would bake the
   * wrong answer in and mismatch on hydration. A stored choice always wins.
   */
  useEffect(() => {
    try {
      if (window.localStorage.getItem(THEME)) return;
    } catch {
      /* unreadable storage just means no stored preference */
    }
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) setTheme('day');
  }, []);
  const headerRef = useRef<HTMLElement | null>(null);
  /* The phone menu, and the two pieces of the header it needs to measure. */
  const [menuOpen, setMenuOpen] = useState(false);
  /* The header dropdown: which section's panel is open, and the last one, so
     its content stays put while the panel closes. */
  const [fly, setFly] = useState<View | null>(null);
  const lastFly = useRef<View | null>(null);
  const flyTimer = useRef(0);
  const [missionFocus, setMissionFocus] = useState<string | undefined>();
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  /* The prose, the questions and the definitions. Null only until the idle
     prefetch lands, which is well before anyone has clicked into a lesson. */
  const full = useFull();
  /* The exercises, once their module has landed, so search can reach them. */
  const practiceIndex = usePractice();
  const [popped, setPopped] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [deck, setDeck] = useState<Deck>({});
  /** Lessons whose hands-on exercise has been finished. Feeds the evidence sheet. */
  const [practised, setPractised] = useState<Set<string>>(new Set());
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [restore, setRestore] = useState<RestoreResult | null>(null);
  const [printing, setPrinting] = useState<FullStage | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  /** A stage number waiting to be scrolled to once the roadmap is rendered. */
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<HTMLDivElement | null>(null);
  const installRef = useRef<HTMLDivElement | null>(null);
  const [history, setHistory] = useState<History>({});
  const [planSettings, setPlanSettings] = useState<PlanSettings>(DEFAULT_SETTINGS);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [notes, setNotes] = useState<LessonNotes>({});
  const fileRef = useRef<HTMLInputElement | null>(null);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const speaker = useSpeaker();
  const { academy: academyState, loaded: academyLoaded, reload: reloadAcademy, update: updateAcademy } = useAcademy();

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
      const access = window.localStorage.getItem(ACCESSIBILITY);
      if (access) setAccessibility(safeAccessibility(JSON.parse(access)));
      const savedNotes = window.localStorage.getItem(NOTES_STORE);
      if (savedNotes) setNotes(safeNotes(JSON.parse(savedNotes)));
    } catch {
      /* progress starts clean when storage is unavailable */
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

  const changeAccessibility = useCallback((next: AccessibilitySettings) => {
    setAccessibility(next);
    try {
      window.localStorage.setItem(ACCESSIBILITY, JSON.stringify(next));
    } catch {
      /* accessibility choices still apply for this session */
    }
    tap();
  }, []);

  const markPractised = useCallback((lessonId: string) => {
    setPractised((prev) => {
      if (prev.has(lessonId)) return prev;
      const next = new Set(prev).add(lessonId);
      try {
        window.localStorage.setItem(PRACTISED, JSON.stringify([...next]));
      } catch {
        /* the session still works without persistence */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRACTISED);
      if (raw) setPractised(new Set(JSON.parse(raw)));
    } catch {
      /* an unreadable store starts empty */
    }
  }, []);

  /* ---------- spaced repetition ---------- */

  /*
   * A card is only in play once you have read the lesson it came from. Only the
   * ids are needed to work that out, and the ids are in the light index, so
   * the review count on the dock does not drag two hundred questions and four
   * hundred definitions into the first bundle to display a number.
   */
  const unlocked = useMemo(
    () => [...completed].flatMap((lessonId) => cardIdsByLesson[lessonId] ?? []),
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
    prefetchCurriculum();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME, theme);
    } catch {
      /* preference is cosmetic; ignore storage failures */
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reading = accessibility.comfortableReading ? 'comfortable' : 'standard';
    root.dataset.motion = accessibility.reduceMotion ? 'reduce' : 'system';
    root.dataset.contrast = accessibility.strongContrast ? 'strong' : 'standard';
  }, [accessibility]);

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

  /*
   * Repeat visits are answered from the cache, which is what makes the app open
   * instantly and work with no signal. The cost is that a new build has to be
   * picked up deliberately, and asking somebody to notice a banner is not good
   * enough: the symptom is clicking something and appearing to get the old
   * behaviour, which reads as the app being broken.
   *
   * So a new version is taken automatically when taking it costs nothing: the
   * page has only just loaded, or the tab has just come back, and no lesson is
   * open. Mid-read, the banner asks instead. The timestamp guard means a build
   * that somehow reinstalls itself cannot put the page in a reload loop.
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'http:' && window.location.hostname !== 'localhost') return;

    let cancelled = false;
    let freshAt = performance.now();
    let cleanup = () => {};

    const takeover = (worker: ServiceWorker) => {
      /* Listen before asking the worker to activate. A fast worker can claim
         this page immediately; subscribing afterwards leaves the old app shell
         on screen until the next manual reload. */
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      worker.postMessage('skip-waiting');
    };

    const offer = (worker: ServiceWorker) => {
      waitingRef.current = worker;
      let looping = false;
      try {
        looping = Date.now() - Number(window.sessionStorage.getItem(UPDATED) ?? 0) < 10_000;
      } catch {
        /* private mode: fall back to asking */
        looping = true;
      }
      /* The route is the source of truth for whether a lesson is open, and
         reading it here keeps this effect from re-subscribing on every open. */
      const reading = window.location.hash.startsWith('#/lesson/');
      const quiet = !reading && performance.now() - freshAt < 8_000;
      if (!quiet || looping) {
        setUpdateReady(true);
        return;
      }
      try {
        window.sessionStorage.setItem(UPDATED, String(Date.now()));
      } catch {
        /* the guard is best effort */
      }
      takeover(worker);
    };

    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        if (cancelled) return;
        if (navigator.serviceWorker.controller) setOfflineReady(true);

        /* A worker already waiting means a newer build is sitting there. */
        if (reg.waiting) offer(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state !== 'installed') return;
            if (navigator.serviceWorker.controller) offer(next);
            else setOfflineReady(true);
          });
        });

        /* Ask on load, and again whenever the tab is looked at after a while. */
        void reg.update().catch(() => {});
        const onVisible = () => {
          if (document.visibilityState !== 'visible') return;
          freshAt = performance.now();
          void reg.update().catch(() => {});
        };
        document.addEventListener('visibilitychange', onVisible);
        cleanup = () => document.removeEventListener('visibilitychange', onVisible);
      })
      .catch(() => {
        /* offline support is an enhancement; the app works without it */
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const applyUpdate = useCallback(() => {
    /* The new worker takes control, then the page reloads onto the new build. */
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waitingRef.current?.postMessage('skip-waiting');
    setUpdateReady(false);
  }, []);

  /* ---------- backup ---------- */

  const onExport = useCallback(() => {
    const b = downloadBackup();
    setRestore({ ok: true, lessons: b.summary.lessons, cards: b.summary.cards, skipped: [] });
    tap();
  }, []);

  const updateLessonNote = useCallback((lessonId: string, value: string) => {
    setNotes((currentNotes) => {
      const next = changeNote(currentNotes, lessonId, value);
      try {
        window.localStorage.setItem(NOTES_STORE, JSON.stringify(next));
      } catch {
        /* The editor still works for this session when storage is blocked. */
      }
      return next;
    });
  }, []);

  const onExportNotes = useCallback(() => {
    const lessonIndex = allLessons.map(({ stage, lesson }) => ({
      id: lesson.id,
      title: lesson.title,
      stageNumber: stage.number,
      stageTitle: stage.title,
    }));
    const date = new Date().toISOString().slice(0, 10);
    downloadText(`cipher-school-field-notes-${date}.md`, notesMarkdown(notes, lessonIndex));
    tap();
  }, [notes]);

  const onImportFile = useCallback(
    async (file: File) => {
      const result = applyBackup(await file.text());
      setRestore(result);
      if (result.ok) {
        /* Re-read from storage rather than trusting local state to match. */
        try {
          setCompleted(new Set(JSON.parse(window.localStorage.getItem(STORE) ?? '[]')));
          setDeck(JSON.parse(window.localStorage.getItem(DECK) ?? '{}'));
          setPractised(new Set(JSON.parse(window.localStorage.getItem(PRACTISED) ?? '[]')));
          reloadAcademy();
          const t = window.localStorage.getItem(THEME);
          if (t === 'day' || t === 'night') setTheme(t);
          const access = window.localStorage.getItem(ACCESSIBILITY);
          setAccessibility(access ? safeAccessibility(JSON.parse(access)) : DEFAULT_ACCESSIBILITY);
          setNotes(safeNotes(JSON.parse(window.localStorage.getItem(NOTES_STORE) ?? '{}')));
        } catch {
          /* the restore already succeeded; a read-back failure is cosmetic */
        }
        tap(16);
      }
    },
    [reloadAcademy],
  );

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
      /* No lesson in the URL means no lesson open: otherwise pressing back
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
   * Render the sheet first, then print: calling window.print() in the same tick
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

  /*
   * All that is left for scroll to drive is the hairline under the header. It
   * was React state once, which meant a setState on every animation frame of
   * every scroll: a full re-render of thirteen stages and a hundred and ten
   * lesson rows, sixty times a second, to draw one line. It is a class toggle
   * written straight to the DOM, and only when the answer actually changes.
   */
  useEffect(() => {
    let frame = 0;
    let wasStuck = false;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const isStuck = window.scrollY > 12;
        if (isStuck === wasStuck) return;
        wasStuck = isStuck;
        headerRef.current?.classList.toggle('stuck', isStuck);
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

  /* ---------- reliable scroll reveals ---------- */

  /*
   * Some sections are rendered after hydration (career roles, route results,
   * and whole views). A MutationObserver feeds those late arrivals into the
   * same IntersectionObserver as the initial page, so an animation can never
   * leave real content permanently transparent.
   */
  useEffect(() => {
    const root = document.documentElement;
    let intersection: IntersectionObserver | null = null;

    const show = (node: HTMLElement, order = 0) => {
      node.style.setProperty('--reveal-delay', `${Math.min(order, 4) * 65}ms`);
      node.classList.add('in');
      intersection?.unobserve(node);
    };

    const watch = (node: Element, animateIfVisible = false) => {
      if (!(node instanceof HTMLElement) || !node.classList.contains('reveal') || node.classList.contains('in')) {
        return;
      }

      if (!intersection) {
        show(node);
        return;
      }

      const rect = node.getBoundingClientRect();
      const centre = rect.left + rect.width / 2;
      const edge = window.innerWidth * 0.12;
      const drift = window.innerWidth < 720 ? 7 : 14;
      node.style.setProperty('--reveal-x', `${centre < window.innerWidth / 2 - edge ? -drift : centre > window.innerWidth / 2 + edge ? drift : 0}px`);

      if (!animateIfVisible && rect.top < window.innerHeight * 1.04 && rect.bottom > -32) {
        show(node);
        return;
      }

      intersection.observe(node);
    };

    if ('IntersectionObserver' in window) {
      intersection = new IntersectionObserver(
        (entries) => {
          entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => {
              const vertical = a.boundingClientRect.top - b.boundingClientRect.top;
              return Math.abs(vertical) > 24 ? vertical : a.boundingClientRect.left - b.boundingClientRect.left;
            })
            .forEach((entry, order) => show(entry.target as HTMLElement, order));
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
      );
    }

    document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((node) => watch(node));

    const additions = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          watch(node, true);
          node.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((child) => watch(child, true));
        });
      });
    });
    additions.observe(document.body, { childList: true, subtree: true });

    // CSS only hides pending elements after JavaScript confirms both observers
    // are installed. Without JavaScript, every lesson stays visible.
    root.dataset.reveal = 'ready';

    return () => {
      additions.disconnect();
      intersection?.disconnect();
      delete root.dataset.reveal;
      document.querySelectorAll<HTMLElement>('.reveal').forEach((node) => node.classList.add('in'));
    };
  }, []);

  /* ---------- body lock while a dialog is open ---------- */

  /* The lesson is a page now, not a sheet, so only the dialogs and the open
     phone menu lock the page behind them. */
  useEffect(() => {
    document.body.classList.toggle('locked', installOpen || menuOpen);
    return () => document.body.classList.remove('locked');
  }, [installOpen, menuOpen]);

  /* Escape closes the menu and hands focus back to the button that opened it;
     widening the window past the phone layout closes it too, since the full
     navigation is then on screen anyway. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuBtnRef.current?.focus();
    };
    const wide = window.matchMedia('(min-width: 900px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  /* The phone menu opens beneath the header, whatever height the header is. */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);

  /* ---------- derived ---------- */

  const doneCount = completed.size;
  const pct = Math.round((doneCount / totalLessons) * 100);

  const visibleStages = useMemo(() => {
    const q = search.trim().toLowerCase();
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
            l.oneLine.toLowerCase().includes(q),
        )
      );
    });
  }, [search, filter]);

  /** Full-text hits, used instead of the stage list whenever there is a query. */
  const hits = useMemo(() => {
    if (view !== 'learn' || !full) return [];
    CORPUS ??= buildCorpus(full.allLessons, practiceIndex ?? undefined);
    return searchIn(CORPUS, search);
  }, [search, view, full, practiceIndex]);

  const visibleWords = useMemo(() => {
    if (!full) return [];
    const q = search.trim().toLowerCase();
    if (!q) return full.glossary;
    return full.glossary.filter((w) => w.term.toLowerCase().includes(q) || w.means.toLowerCase().includes(q));
  }, [search, full]);

  const stageDone = useCallback(
    (stage: Stage) => stage.lessons.filter((l) => completed.has(l.id)).length,
    [completed],
  );

  /** The lesson to suggest next: first unfinished, in course order. */
  const nextUp = useMemo(() => allLessons.find(({ lesson }) => !completed.has(lesson.id)), [completed]);

  /* ---------- reader ---------- */

  const current = useMemo(
    () => (reader ? { stage: stages[reader.s], lesson: stages[reader.s].lessons[reader.l] } : null),
    [reader],
  );
  /* The lesson with its prose, once the heavy module is in memory. */
  const readerLesson = current && full ? (full.lessonById.get(current.lesson.id) ?? null) : null;
  const flatIndex = reader ? allLessons.findIndex((x) => x.lesson.id === current!.lesson.id) : -1;
  const activeLessonStepIndex = Math.max(0, LESSON_STEPS.findIndex((item) => item.id === activeLessonStep));
  const nextLessonStep = LESSON_STEPS[activeLessonStepIndex + 1] ?? null;

  const cameFrom = useRef(0);
  const openReader = useCallback((s: number, l: number) => {
    cameFrom.current = window.scrollY;
    setMenuOpen(false);
    withTransition(() => {
      setActiveLessonStep('understand');
      setReader({ s, l });
      window.scrollTo({ top: 0 });
    });
  }, []);

  const closeReader = useCallback(() => {
    speaker.stop();
    /* Back to the row you left, restored inside the transition so the new page
       fades in already in place rather than jumping after it arrives. */
    withTransition(
      () => setReader(null),
      () => {
        if (!cameFrom.current) return;
        window.scrollTo({ top: cameFrom.current });
        cameFrom.current = 0;
      },
    );
  }, [speaker]);

  /*
   * Restoring the scroll has to wait until the roadmap is back in the DOM, so
   * it is an effect rather than part of the click: by the time this runs the
   * rows are laid out and the position you came from means something again.
   */
  useEffect(() => {
    if (reader !== null || !cameFrom.current) return;
    window.scrollTo({ top: cameFrom.current });
    cameFrom.current = 0;
  }, [reader]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const target = flatIndex + dir;
      if (target < 0 || target >= allLessons.length) return;
      const { lesson } = allLessons[target];
      const s = stages.findIndex((st) => st.lessons.some((x) => x.id === lesson.id));
      const l = stages[s].lessons.findIndex((x) => x.id === lesson.id);
      speaker.stop();
      setActiveLessonStep('understand');
      setReader({ s, l });
      window.scrollTo({ top: 0 });
    },
    [flatIndex, speaker],
  );

  useEffect(() => {
    if (!reader || !readerLesson) return;
    const sections = [...document.querySelectorAll<HTMLElement>('[data-lesson-step]')];
    if (!sections.length) return;

    const pickCurrent = () => {
      const focusLine = window.innerHeight * 0.32;
      const visible = sections
        .filter((section) => {
          const box = section.getBoundingClientRect();
          return box.bottom > focusLine && box.top < window.innerHeight * 0.82;
        })
        .sort((a, b) => Math.abs(a.getBoundingClientRect().top - focusLine) - Math.abs(b.getBoundingClientRect().top - focusLine));
      const step = visible[0]?.dataset.lessonStep as LessonStep | undefined;
      if (step) setActiveLessonStep((currentStep) => currentStep === step ? currentStep : step);
    };

    const observer = new IntersectionObserver(pickCurrent, {
      rootMargin: '-18% 0px -52% 0px',
      threshold: [0, 0.05, 0.2],
    });
    sections.forEach((section) => observer.observe(section));
    pickCurrent();
    return () => observer.disconnect();
  }, [reader, readerLesson]);

  const jumpToLessonStep = useCallback((step: LessonStep) => {
    const section = document.querySelector<HTMLElement>(`[data-lesson-step="${step}"]`);
    if (!section) return;
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 88;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    setActiveLessonStep(step);
    tap();
  }, []);

  /*
   * Jump to a stage by its number. The career paths are written as a sequence
   * of stage numbers, and a bare "04" means nothing until you can press it and
   * land on the stage it names.
   */
  const showStage = useCallback((number: string) => {
    const idx = stages.findIndex((st) => st.number === number);
    if (idx === -1) return;
    cameFrom.current = 0;
    setReader(null);
    setView('learn');
    /* A filter or a search would hide the stage being jumped to, so clear both:
       being sent somewhere and finding nothing there is worse than no link. */
    setFilter('ALL');
    setQuery('');
    setOpenStage(idx);
    setEverOpen((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
    setPendingStage(number);
    tap();
  }, []);

  /* The stage only exists in the DOM after the view has switched, so the scroll
     waits for the render rather than racing it. */
  useEffect(() => {
    if (!pendingStage || view !== 'learn') return;
    const el = document.getElementById(`stage-${pendingStage}`);
    if (el) {
      // The header is taller on notched phones because it includes the safe
      // area. Measure it instead of letting a fixed offset hide the stage.
      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 88;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, top) });
    }
    setPendingStage(null);
  }, [pendingStage, view]);

  /** Jump straight to a lesson by id: the role requirement chips use this. */
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
    if (speaker.speaking) {
      if (speaker.paused) speaker.resume();
      else speaker.pause();
      return;
    }
    /* Narration needs the prose, so it waits on the module rather than the
       other way round. In practice the prefetch has long since landed. */
    if (!current) return;
    const id = current.lesson.id;
    void loadFull().then((f) => {
      const lesson = f.lessonById.get(id);
      if (lesson) speaker.play(lesson);
    });
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

  /* ---------- stage hue drives the whole palette ---------- */

  const activeHue = current ? current.stage.hue : openStage !== null ? stages[openStage]?.hue : 210;
  const rootStyle = { '--hue': String(activeHue ?? 210) } as CSSProperties;

  const goto = (id: View, after?: () => void) => {
    /* Changing section is not going back: it starts at the top of the new one. */
    cameFrom.current = 0;
    tap();
    withTransition(() => {
      setMenuOpen(false);
      setFly(null);
      setReader(null);
      setView(id);
      /* Instant, not smooth: this is a change of page, not a scroll within one. */
      window.scrollTo({ top: 0 });
    }, after);
  };

  /* Go to a section, then to a part of it. Some parts load on demand and push
     the layout around as they arrive, so the target is held in place until the
     page settles; any scroll of the reader's own ends that at once. */
  const jump = (id: View, target: string, then?: (el: HTMLElement) => void) =>
    goto(id, () => {
      let frames = 0;
      let still = 0;
      let found = false;
      const stop = () => {
        frames = Infinity;
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.removeEventListener(t, stop));
      };
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, stop, { passive: true }));
      const settle = () => {
        if (frames++ > 150) return stop();
        const el = document.getElementById(target);
        if (el) {
          const want = (headerRef.current?.offsetHeight ?? 64) + 20;
          const off = el.getBoundingClientRect().top - want;
          if (Math.abs(off) > 2) {
            window.scrollBy({ top: off, behavior: 'instant' });
            still = 0;
          } else if (++still > 12) return stop();
          if (!found) {
            found = true;
            then?.(el);
          }
        }
        requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);
    });

  /* ---------- header dropdowns ---------- */

  /* Opening waits a beat so a pointer crossing the bar doesn't flash panels;
     once one is open, moving along the bar switches instantly, as on apple.com. */
  const hoverFly = (id: View | null, event: ReactPointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    window.clearTimeout(flyTimer.current);
    if (id === null) flyTimer.current = window.setTimeout(() => setFly(null), 180);
    else if (fly) setFly(id);
    else flyTimer.current = window.setTimeout(() => setFly(id), 140);
  };
  if (fly) lastFly.current = fly;

  const startLearning = () => {
    if (nextUp) {
      const s = stages.findIndex((st) => st.lessons.some((x) => x.id === nextUp.lesson.id));
      const l = stages[s].lessons.findIndex((x) => x.id === nextUp.lesson.id);
      setOpenStage(s);
      openReader(s, l);
    }
    tap();
  };

  const here = (id: View) => hashFor({ view: id, lessonId: null }) || '#/';
  const stageLinks = (from: number, to: number) =>
    stages.slice(from, to).map((st) => ({ label: `${st.number}  ${st.title}`, href: '#/', run: () => showStage(st.number) }));

  const flyouts: Partial<Record<View, FlyMenu>> = {
    learn: {
      title: 'Explore Learn',
      primary: [
        { label: doneCount ? 'Continue learning' : 'Start with stage 00', note: nextUp?.lesson.title, href: '#/', run: startLearning },
        { label: 'The roadmap', note: `${stages.length} stages, in order`, href: '#/', run: () => jump('learn', 'roadmap') },
        { label: "Today's plan", href: '#/', run: () => jump('learn', 'today') },
        { label: 'Build your route', href: '#/', run: () => jump('learn', 'route-title') },
      ],
      columns: [
        { title: 'Foundations', links: stageLinks(0, 7) },
        { title: 'Specialise', links: stageLinks(7, stages.length) },
      ],
    },
    missions: {
      title: 'Explore Missions',
      primary: [
        { label: 'Mission engine', note: `${MISSIONS.length} safe investigations`, href: here('missions'), run: () => jump('missions', 'missions') },
        { label: 'Capstones', note: 'Work a human can inspect', href: here('proof'), run: () => jump('proof', 'capstones') },
      ],
      columns: [
        {
          title: 'Cases',
          links: MISSIONS.map((m) => ({
            label: m.title,
            href: here('missions'),
            run: () => {
              setMissionFocus(m.id);
              jump('missions', 'missions');
            },
          })),
        },
      ],
    },
    review: {
      title: 'Explore Review',
      primary: [
        { label: srs.due ? `Review ${srs.due} due cards` : 'Review cards', href: here('review'), run: () => jump('review', 'review') },
        { label: 'This week', note: 'What you read and recalled', href: here('review'), run: () => jump('review', 'this-week') },
      ],
      columns: [
        {
          title: 'Practise',
          links: [
            { label: 'Skill check', href: here('paths'), run: () => jump('paths', 'skill-check-title') },
            { label: 'Mission engine', href: here('missions'), run: () => jump('missions', 'missions') },
            { label: 'Glossary', href: here('words'), run: () => jump('words', 'words') },
          ],
        },
      ],
    },
    paths: {
      title: 'Explore Paths',
      primary: [
        { label: 'Skill check', note: 'Find the gaps first', href: here('paths'), run: () => jump('paths', 'skill-check-title') },
        { label: 'Am I ready to apply?', href: here('paths'), run: () => jump('paths', 'ready-to-apply') },
        { label: 'Career paths', href: here('paths'), run: () => jump('paths', 'career-paths') },
        { label: 'Evidence sheet', href: here('paths'), run: () => jump('paths', 'evidence') },
      ],
      columns: [
        { title: 'Routes', links: tracks.map((t) => ({ label: t.title, href: here('paths'), run: () => jump('paths', 'career-paths') })) },
        {
          title: 'Internship prep',
          links: [
            { label: 'Skill sprint', href: here('paths'), run: () => jump('paths', 'skill-sprint') },
            { label: 'Burp, ZAP and Nmap labs', href: here('paths'), run: () => jump('paths', 'lab-checklist') },
          ],
        },
      ],
    },
    proof: {
      title: 'Explore Proof',
      primary: [
        { label: 'Evidence room', href: here('proof'), run: () => jump('proof', 'proof') },
        { label: 'Skill graph', note: 'Four gates per stage', href: here('proof'), run: () => jump('proof', 'skill-graph') },
        { label: 'Capstones', href: here('proof'), run: () => jump('proof', 'capstones') },
        { label: 'Classroom mode', href: here('proof'), run: () => jump('proof', 'classroom') },
      ],
      columns: [{ title: 'Capstones', links: CAPSTONES.map((c) => ({ label: c.title, href: here('proof'), run: () => jump('proof', 'capstones') })) }],
    },
    words: {
      title: 'Explore Glossary',
      primary: [
        { label: `All ${glossaryCount} terms`, href: here('words'), run: () => jump('words', 'words') },
        { label: 'Look up a word', href: here('words'), run: () => jump('words', 'glossary-search', (el) => el.focus({ preventScroll: true })) },
      ],
      columns: [
        {
          title: 'Common terms',
          links: ['Phishing', 'Firewall', 'Encryption', 'Hash', 'Malware', 'Vulnerability'].map((term) => ({
            label: term,
            href: here('words'),
            run: () => {
              setQuery(term);
              jump('words', 'glossary-search');
            },
          })),
        },
      ],
    },
    sources: {
      title: 'Explore Sources',
      primary: [{ label: 'Primary sources', note: `${sources.length} standards and free labs`, href: here('sources'), run: () => jump('sources', 'sources') }],
      columns: [
        { title: 'Standards and labs', links: sources.slice(0, 7).map((x) => ({ label: x.name, href: x.href, external: true })) },
        { title: 'More', links: sources.slice(7, 14).map((x) => ({ label: x.name, href: x.href, external: true })) },
      ].filter((col) => col.links.length),
    },
  };
  const flyMenu = flyouts[(fly ?? lastFly.current) as View] ?? null;

  /*
   * Navigation items are real links, so open-in-new-tab, copy-link and
   * middle-click all behave as they do on any other website. Only a plain
   * left click is taken over, to animate the change instead of reloading.
   */
  const navClick = (event: ReactMouseEvent<HTMLAnchorElement>, id: View) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goto(id);
  };

  const resetPreferences = () => {
    speaker.stop();
    try {
      clearCipherSchoolStorage(window.localStorage);
    } catch {
      /* State still resets for this session when storage is unavailable. */
    }
    setCompleted(new Set());
    setDeck({});
    setPractised(new Set());
    setHistory({});
    setPlanSettings(DEFAULT_SETTINGS);
    setNotes({});
    setQuery('');
    setFilter('ALL');
    setOpenStage(0);
    setEverOpen(new Set([0]));
    setPopped(null);
    setTheme('night');
    changeAccessibility(DEFAULT_ACCESSIBILITY);
    speaker.setPreferStudio(true);
    speaker.setVoiceURI(null);
    speaker.setRate(1);
    updateAcademy(() => ({ version: 1, profile: null, missions: {}, capstones: {} }));
    document.documentElement.lang = 'en';
    setRestore(null);
    tap(16);
  };

  return (
    <div className={reader ? 'app readingMode' : 'app'} style={rootStyle}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="shell">
        {/* ---------------- top bar ---------------- */}
        <header
          className={`topbar${menuOpen ? ' menuOpen' : ''}${fly ? ' flyOpen' : ''}`}
          ref={headerRef}
          onPointerLeave={(event) => hoverFly(null, event)}
          onBlur={(event) => {
            if (fly && !event.currentTarget.contains(event.relatedTarget as Node | null)) setFly(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !fly) return;
            headerRef.current?.querySelector<HTMLElement>(`[data-fly="${fly}"]`)?.focus();
            setFly(null);
          }}
        >
          <div className="topRow">
            <a
              className="brand"
              href="#/"
              onClick={(event) => navClick(event, 'learn')}
              onPointerEnter={(event) => hoverFly(null, event)}
              aria-label="Cipher School home"
            >
              <span className="mark" aria-hidden="true">
                {/* Imported through the bundler, so it ships as a hashed file under /_next/static
                    like the fonts; the root-level copy timed out on the InfinityFree host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brandIcon.src} width="38" height="38" alt="" />
              </span>
              <span className="brandText">
                <span className="brandName">Cipher School</span>
                <span className="brandSub">Beginner → researcher</span>
              </span>
            </a>

            <nav className="siteNav" aria-label="Main">
              <ul>
                {views.map((v) => {
                  const on = view === v.id;
                  return (
                    <li key={v.id} className="navItem" onPointerEnter={(event) => hoverFly(v.id, event)}>
                      <a
                        href={hashFor({ view: v.id, lessonId: null }) || '#/'}
                        className={on ? 'navLink on' : 'navLink'}
                        aria-current={on ? 'page' : undefined}
                        onClick={(event) => navClick(event, v.id)}
                      >
                        {v.label}
                        {v.id === 'review' && srs.due > 0 && (
                          <b className="navBadge">
                            {srs.due > 99 ? '99+' : srs.due}
                            <span className="sr"> due</span>
                          </b>
                        )}
                      </a>
                      {/* The keyboard way into the dropdown, shown on focus. */}
                      <button
                        type="button"
                        className="flyToggle"
                        data-fly={v.id}
                        aria-expanded={fly === v.id}
                        aria-controls="nav-flyout"
                        aria-label={`${v.label} menu`}
                        onClick={() => setFly((open) => (open === v.id ? null : v.id))}
                      >
                        <svg viewBox="0 0 10 6" aria-hidden="true">
                          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="topActions" onPointerEnter={(event) => hoverFly(null, event)}>
              <button
                className={view === 'settings' ? 'iconBtn settingsGear settingsActive' : 'iconBtn settingsGear'}
                onClick={() => goto('settings')}
                aria-label="Open settings"
                aria-current={view === 'settings' ? 'page' : undefined}
                title="Settings"
              >
                <InterfaceIcon name="settings" />
              </button>
              <button
                ref={menuBtnRef}
                type="button"
                className={menuOpen ? 'menuBtn open' : 'menuBtn'}
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="menuGlyph" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </button>
            </div>
          </div>

          <div className="island" role="status" aria-live="polite">
            <span className="pulse" aria-hidden="true" />
            <div className="islandText">
              {doneCount === 0 ? (
                <>Ready when you are. <b>Start with stage 00</b></>
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

          <NavFlyout menu={flyMenu} open={!!fly && !!flyouts[fly]} onDone={() => setFly(null)} />
        </header>
        <div className={fly && flyouts[fly] ? 'flyScrim open' : 'flyScrim'} aria-hidden="true" />

        <main id="main">
        {/* ---------------- lesson ---------------- */}
        {reader && current && (
          <article className="reader" style={{ '--hue': String(current.stage.hue) } as CSSProperties}>
            <button className="readerBack" onClick={closeReader}>
              <InterfaceIcon name="arrowLeft" />
              <span>Stage {current.stage.number} · {current.stage.title}</span>
            </button>

            <div className="readerHead">
              <h1 className="readerTitle">{current.lesson.title}</h1>
              <div className="readerMeta" aria-label="Lesson position and reading time">
                <span>Stage {current.stage.number}</span>
                <span>Lesson {reader.l + 1} of {current.stage.lessons.length}</span>
                <span>{current.lesson.mins} min</span>
                <span className="coursePosition">Course {flatIndex + 1} of {totalLessons}</span>
              </div>
            </div>

            {speaker.supported && (
              <div className={speaker.speaking ? 'player on' : 'player'} aria-label="Lesson audio player">
                <button className="playBtn" onClick={listen} aria-label={speaker.speaking && !speaker.paused ? 'Pause' : 'Listen'}>
                  <InterfaceIcon name={speaker.speaking && !speaker.paused ? 'pause' : 'play'} />
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
                    <button className="playMini" onClick={() => speaker.jump(-1)} aria-label="Previous audio section">
                      <InterfaceIcon name="rewind" />
                    </button>
                    <button className="playMini" onClick={() => speaker.jump(1)} aria-label="Next audio section">
                      <InterfaceIcon name="forward" />
                    </button>
                    <button className="playMini" onClick={speaker.stop} aria-label="Stop">
                      <InterfaceIcon name="close" />
                    </button>
                  </>
                )}
                <button className="playMini" onClick={() => setVoiceOpen(true)} aria-label="Voice settings">
                  <InterfaceIcon name="settings" />
                </button>
              </div>
            )}

            <nav className="lessonMap" aria-label="Lesson steps">
              {LESSON_STEPS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={activeLessonStep === item.id ? 'active' : undefined}
                  aria-current={activeLessonStep === item.id ? 'step' : undefined}
                  onClick={() => jumpToLessonStep(item.id)}
                >
                  <span className="lessonMapNum">0{index + 1}</span>
                  <span><b>{item.label}</b><small>{item.note}</small></span>
                </button>
              ))}
            </nav>

            <div className="readerBody">
              {readerLesson ? (
                <>
                  <LessonBody
                    lesson={readerLesson}
                    activeLabel={speaker.speaking ? speaker.chunks[speaker.index]?.label : undefined}
                  />

                  <section
                    id="lesson-recall"
                    className="lessonPhase"
                    data-lesson-step="recall"
                    aria-labelledby="lesson-recall-title"
                  >
                    <LessonPhaseHead number="02" title="Recall" note="Say what you think before the choices appear." id="lesson-recall-title" />
                    <div className={`readCard check${speaker.speaking && speaker.chunks[speaker.index]?.label === 'Check yourself' ? ' reading' : ''}`}>
                      <h3 className="readLabel">Check yourself</h3>
                      <div className="readText">{readerLesson.check}</div>
                    </div>
                    <LessonQuiz lessonId={current.lesson.id} onGrade={gradeCard} />
                  </section>

                  <section
                    id="lesson-apply"
                    className="lessonPhase"
                    data-lesson-step="apply"
                    aria-labelledby="lesson-apply-title"
                  >
                    <LessonPhaseHead
                      number="03"
                      title="Apply"
                      note={practiceLessons.includes(current.lesson.id) ? 'Use the idea, then work the evidence.' : 'Use the idea safely in your own context.'}
                      id="lesson-apply-title"
                    />
                    <div className={`readCard do${speaker.speaking && speaker.chunks[speaker.index]?.label === 'Go and do this' ? ' reading' : ''}`}>
                      <h3 className="readLabel">Go and do this</h3>
                      <div className="readText">{readerLesson.doThis}</div>
                    </div>
                    {practiceLessons.includes(current.lesson.id) && (
                      <PracticeBlock
                        lessonId={current.lesson.id}
                        onWorked={() => logWork({ mins: PRACTICE_MINS })}
                        onSolved={() => markPractised(current.lesson.id)}
                      />
                    )}
                  </section>

                  <LessonNotebook
                    key={current.lesson.id}
                    note={notes[current.lesson.id] ?? ''}
                    onChange={(value) => updateLessonNote(current.lesson.id, value)}
                  />
                </>
              ) : (
                <p className="readWait">{current.lesson.oneLine}</p>
              )}
            </div>

            <div className="readerFoot">
              <button
                className="navBtn"
                onClick={() => step(-1)}
                disabled={flatIndex <= 0}
                aria-label={flatIndex > 0 ? `Previous lesson: ${allLessons[flatIndex - 1].lesson.title}` : 'No previous lesson'}
              >
                <InterfaceIcon name="arrowLeft" />
              </button>
              <button
                className={!nextLessonStep && completed.has(current.lesson.id) ? 'btn done' : 'btn primary'}
                onClick={() => {
                  if (nextLessonStep) {
                    jumpToLessonStep(nextLessonStep.id);
                    return;
                  }
                  toggle(current.lesson.id);
                  if (!completed.has(current.lesson.id) && flatIndex < allLessons.length - 1) {
                    window.setTimeout(() => step(1), 480);
                  }
                }}
              >
                {nextLessonStep
                  ? `Continue to ${nextLessonStep.label}`
                  : completed.has(current.lesson.id)
                    ? 'Completed · Tap to undo'
                    : flatIndex < allLessons.length - 1 ? 'Complete and continue' : 'Complete lesson'}
              </button>
              <button
                className="navBtn"
                onClick={() => step(1)}
                disabled={flatIndex >= allLessons.length - 1}
                aria-label={flatIndex < allLessons.length - 1 ? `Next lesson: ${allLessons[flatIndex + 1].lesson.title}` : 'No next lesson'}
              >
                <InterfaceIcon name="arrowRight" />
              </button>
            </div>
          </article>
        )}

        {/* ---------------- hero ---------------- */}
        {!reader && view === 'learn' && (
          <>
            <Hero
              started={doneCount > 0}
              next={{
                stage: nextUp?.stage.number ?? '00',
                title: nextUp?.lesson.title ?? 'How computers actually work',
                mins: nextUp?.lesson.mins ?? 8,
              }}
              lessons={totalLessons}
              terms={glossaryCount}
              hours={totalHours}
              onStart={() => {
                if (nextUp) {
                  const s = stages.findIndex((st) => st.lessons.some((x) => x.id === nextUp.lesson.id));
                  const l = stages[s].lessons.findIndex((x) => x.id === nextUp.lesson.id);
                  setOpenStage(s);
                  openReader(s, l);
                }
                tap();
              }}
              onSkillCheck={() => goto('paths')}
            />
            <div className="differenceRail reveal" aria-label="What makes Cipher School different">
              <div><span>01</span><b>Learn the idea</b><small>Plain language first.</small></div>
              <div><span>02</span><b>Make the call</b><small>Recall and judgement.</small></div>
              <div><span>03</span><b>Work the evidence</b><small>Logs, scans and policies.</small></div>
              <div><span>04</span><b>Show the proof</b><small>Portfolio-ready outcomes.</small></div>
            </div>
          </>
        )}

        {/* ---------------- learn ---------------- */}
        {!reader && view === 'learn' && (
          <section id="learn">
            {academyLoaded && <RouteBuilder academy={academyState} update={updateAcademy} onOpenStage={showStage} />}
            <TodayCard
              history={history}
              settings={planSettings}
              setSettings={changeSettings}
              completed={completed}
              dueCards={srs.due}
              onOpen={openById}
              onReview={() => goto('review')}
            />

            <div className="sectionHead reveal" id="roadmap">
              <div className="kicker">The roadmap</div>
              <h2>{stages.length} stages, in order</h2>
              <p className="sectionNote">
                Do them in sequence if you are new. Each stage uses a different colour to help your memory keep them
                separate. Tap any lesson to read it. Lessons marked{' '}
                <span className="lessonLab">exercise</span> end with a real artefact to work on rather than a question
                to answer.
              </p>
            </div>

            <div className="searchRow reveal">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search every word. Press /"
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

            {search.trim() && (
              <div className="results">
                <div className="resultsHead">
                  {hits.length === 0
                    ? `Nothing matches "${search.trim()}".`
                    : `${hits.length} lesson${hits.length === 1 ? ' mentions' : 's mention'} "${search.trim()}"`}
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

            <div className="stageList" style={{ marginTop: 14, display: search.trim() ? 'none' : undefined }}>
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
                /* The reveal observer adds `in` directly to the DOM. Opening a
                   stage changes its React-owned className, so keep that class
                   in React from the first interaction onwards. Otherwise the
                   expanded card becomes transparent while retaining its full
                   height and looks like a missing section. */
                const revealed = everOpen.has(idx) || complete;
                return (
                  <article
                    key={stage.number}
                    id={`stage-${stage.number}`}
                    className={`stage glass reveal${revealed ? ' in' : ''}${open ? ' open' : ''}${complete ? ' done' : ''}`}
                    style={{ '--hue': String(stage.hue) } as CSSProperties}
                  >
                    <button
                      className="stageBtn"
                      onClick={() => {
                        setOpenStage(open ? null : idx);
                        if (!open) setEverOpen((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
                        tap();
                      }}
                      aria-expanded={open}
                    >
                      <div className="stageNum">{stage.number}</div>
                      <div className="stageMain">
                        <div className="stageTitle">{stage.title}</div>
                        <div className="stageSub">{stage.subtitle}</div>
                        <div className="stageMeta">
                          <span className={`tag level lv${stage.level}`}>{stage.level}</span>
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
                        {everOpen.has(idx) && (
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
                                    {practiceLessons.includes(lesson.id) && (
                                      <span className="lessonLab" title="Has a hands-on exercise">
                                        exercise
                                      </span>
                                    )}
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
                            <button
                              className="link"
                              onClick={() => {
                                void loadFull().then((f) => setPrinting(f.stageByNumber.get(stage.number) ?? null));
                              }}
                            >
                              ⎙ Print or save as PDF
                            </button>
                          </div>
                        </div>
                        )}
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
                nothing breaks. Every offensive technique in this course has a free, legal place to practise it. You
                will find those links inside each stage.
              </div>
            </div>
          </section>
        )}

        {/* ---------------- missions ---------------- */}
        {!reader && view === 'missions' && (
          <MissionsView academy={academyState} update={updateAcademy} focus={missionFocus} />
        )}

        {/* ---------------- review ---------------- */}
        {!reader && view === 'review' && (
          <section id="review" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Spaced repetition</div>
              <h2>Lock it in</h2>
              <p className="sectionNote">
                Reading a lesson once teaches you almost nothing. {totalQuestions} questions and {glossaryCount} terms
                come back at growing intervals, just before you would have forgotten them. That is exactly when
                recalling something makes it permanent.
              </p>
            </div>
            <WeekReview history={history} settings={planSettings} onOpen={openById} />

            <ReviewView deck={deck} unlocked={unlocked} onGrade={gradeCard} speak={speaker.supported ? speaker.say : undefined} />
          </section>
        )}

        {/* ---------------- paths ---------------- */}
        {!reader && view === 'paths' && (
          <section id="paths" className="band">
            <SkillCheck completed={completed} onOpen={openById} onMissions={() => goto('missions')} />

            <RolesSection completed={completed} onOpen={openById} onMissions={() => goto('missions')} />

            <div className="sectionHead reveal" id="career-paths" style={{ marginTop: 40 }}>
              <div className="kicker">Career paths</div>
              <h2>Eight ways through</h2>
              <p className="sectionNote">
                Security is not one job. These are the real role families and the stage order that gets you to each one.
                Stage 00 is compulsory for all of them. The numbers are stages. Press one to open it.
              </p>
            </div>
            <div className="trackGrid">
              {tracks.map((t) => (
                <article key={t.code} className="track glass reveal" style={{ '--hue': String(t.hue) } as CSSProperties}>
                  <div className="trackTop">
                    <span className="trackCode">{t.code}</span>
                    <span className="trackTitle">{t.title}</span>
                  </div>
                  <div className="trackPath">
                    <span className="trackPathLabel">stages, in order</span>
                    {t.path.split('→').map((n) => n.trim()).map((n, i) => (
                      <span key={n}>
                        {i > 0 && <span className="trackArrow" aria-hidden="true">→</span>}
                        <button
                          className="trackStage"
                          onClick={() => showStage(n)}
                          title={`Stage ${n}: ${stages.find((st) => st.number === n)?.title ?? ''}`}
                        >
                          {n}
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="trackNote">{t.note}</div>
                </article>
              ))}
            </div>

            <CompanionSection />

            <div className="sectionHead reveal" id="evidence" style={{ marginTop: 72 }}>
              <div className="kicker">Evidence</div>
              <h2>What you can show for it</h2>
              <p className="sectionNote">
                A completion percentage is worth nothing to anyone hiring. This turns your progress into specific,
                checkable claims using the language from job adverts. It only includes work you finished.
              </p>
            </div>
            <EvidenceSheet completed={completed} practised={practised} />
          </section>
        )}

        {/* ---------------- proof ---------------- */}
        {!reader && view === 'proof' && (
          <ProofView academy={academyState} update={updateAcademy} completed={completed} practised={practised} deck={deck} />
        )}

        {/* ---------------- settings ---------------- */}
        {!reader && view === 'settings' && (
          <SettingsView
            theme={theme}
            onTheme={(next) => { setTheme(next); tap(); }}
            plan={planSettings}
            onPlan={changeSettings}
            profile={academyLoaded ? academyState.profile : null}
            onProfile={(profile) => updateAcademy((current) => ({ ...current, profile }))}
            accessibility={accessibility}
            onAccessibility={changeAccessibility}
            offlineReady={offlineReady}
            narration={{
              supported: speaker.supported,
              hasStudio: speaker.hasStudio,
              preferStudio: speaker.preferStudio,
              onPreferStudio: speaker.setPreferStudio,
              voices: speaker.voices,
              filteredVoices: speaker.filteredVoices,
              allVoiceCount: speaker.allVoiceCount,
              femaleVoiceCount: speaker.femaleVoiceCount,
              maleVoiceCount: speaker.maleVoiceCount,
              voiceURI: speaker.voiceURI ?? '',
              onVoiceURI: speaker.setVoiceURI,
              voiceFilter: speaker.voiceFilter,
              onVoiceFilter: speaker.setVoiceFilter,
              rate: speaker.rate,
              onRate: speaker.setRate,
              onPreview: () => speaker.say('Clear thinking starts with a clear question. Let us examine the evidence.'),
            }}
            onInstall={() => setInstallOpen(true)}
            onBackup={onExport}
            notesCount={Object.keys(notes).length}
            onExportNotes={onExportNotes}
            onRestore={() => fileRef.current?.click()}
            onShortcuts={() => setHelpOpen(true)}
            onLearn={() => goto('learn')}
            onReset={resetPreferences}
            restore={restore}
          />
        )}

        {/* ---------------- glossary ---------------- */}
        {!reader && view === 'words' && (
          <section id="words" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Jargon decoder</div>
              <h2>{glossaryCount} words, in human</h2>
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
                  id="glossary-search"
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
        {!reader && view === 'sources' && (
          <section id="sources" className="band">
            <div className="sectionHead reveal">
              <div className="kicker">Where this comes from</div>
              <h2>Primary sources</h2>
              <p className="sectionNote">
                This curriculum is built on published standards and free labs, not opinion. Go to the originals. They
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

            <FreshnessPanel />
            <CapabilityBoundary />

            <div className="safety reveal" style={{ background: 'var(--glass)', borderColor: 'var(--rim)' }}>
              <div className="safetyTitle" style={{ color: 'var(--ink)' }}>
                The practical limit
              </div>
              <div className="safetyText">
                Nobody masters all of cybersecurity. The field is far too large, and anyone claiming otherwise is
                selling something. This course is built for broad foundations plus one deep speciality. That shape is
                what actually gets hired, and it is what stage 10 is for.
              </div>
            </div>

          </section>
        )}
        </main>

        <footer className="foot creatorFoot" aria-label="Creator details">
          <div className="creatorFootTop">
            <div className="creatorIdentity">
              <span className="creatorEyebrow">Created by</span>
              <strong className="creatorName">Ashfaaq Ahamed</strong>
            </div>

            <a
              className="creatorSocial"
              href={'https://www.instagram.com/ashfaaqaf?igsi=MW0zdjM0dmdvcnB1ZA%3D%3D&utm_source=qr'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open ashfaaqaf on Instagram"
            >
              <svg className="creatorSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" className="creatorSocialDot" />
              </svg>
              <span className="creatorSocialText">
                <span className="creatorSocialLabel">Instagram</span>
                <strong>@ashfaaqaf</strong>
              </span>
              <span className="creatorSocialArrow" aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="creatorFootMeta">
            <p>
              Cipher School · {totalLessons} lessons · {totalWeeks} weeks of structured study · progress stored only in
              this browser.
            </p>
            <p>Built as an open study aid. Curriculum grounded in NIST, MITRE and OWASP publications.</p>
          </div>
        </footer>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Choose a progress backup file to restore"
          className="sr"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImportFile(file);
            event.target.value = '';
          }}
        />
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

      {/* ---------------- phone menu ---------------- */}
      {/* The same destinations as the header links, for screens too narrow to
          show them inline. Inert while closed, so it is neither focusable nor
          announced until it opens. */}
      <div id="site-menu" className={menuOpen ? 'menuPanel open' : 'menuPanel'} inert={!menuOpen}>
        <nav aria-label="Main menu">
          <ul>
            {MENU.map((item, i) => {
              const on = view === item.id;
              return (
                <li key={item.id} style={{ '--i': i } as CSSProperties}>
                  <a
                    href={hashFor({ view: item.id, lessonId: null }) || '#/'}
                    className={on ? 'menuLink on' : 'menuLink'}
                    aria-current={on ? 'page' : undefined}
                    onClick={(event) => navClick(event, item.id)}
                  >
                    {item.label}
                    {item.id === 'review' && srs.due > 0 && (
                      <b className="navBadge">
                        {srs.due > 99 ? '99+' : srs.due}
                        <span className="sr"> due</span>
                      </b>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ---------------- narration settings ---------------- */}
      {voiceOpen && (
        <>
          <div className="scrim" onClick={() => setVoiceOpen(false)} aria-hidden="true" />
          <div ref={voiceRef} className="sheet" role="dialog" aria-modal="true" aria-label="Narration settings">
            <div className="grabber" onPointerDown={() => setVoiceOpen(false)}>
              <i />
            </div>
            <div className="sheetHead">
              <div className="sheetCrumb">Professional system narration</div>
              <h3 className="sheetTitle">Narration</h3>
              <div className="sheetMeta">
                {speaker.voices.length} professional voice{speaker.voices.length === 1 ? '' : 's'} selected from {speaker.allVoiceCount}
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
                <div className="readLabel">Delivery</div>
                <div className="rateRow">
                  {[
                    { label: 'Measured', rate: 0.9 },
                    { label: 'Natural', rate: 1 },
                    { label: 'Brisk', rate: 1.15 },
                  ].map((option) => (
                    <button
                      key={option.label}
                      className={Math.abs(speaker.rate - option.rate) < 0.01 ? 'ratePill on' : 'ratePill'}
                      onClick={() => speaker.setRate(option.rate)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="readCard">
                <div className="readLabel">Professional voices{speaker.hasStudio ? ' (used as fallback)' : ''}</div>
                <div className="rateRow voiceFilterRow" role="group" aria-label="Filter voices">
                  {[
                    { value: 'all' as const, label: 'All', count: speaker.voices.length },
                    { value: 'female' as const, label: 'Female', count: speaker.femaleVoiceCount },
                    { value: 'male' as const, label: 'Male', count: speaker.maleVoiceCount },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={speaker.voiceFilter === option.value ? 'ratePill on' : 'ratePill'}
                      type="button"
                      disabled={option.value !== 'all' && option.count === 0}
                      onClick={() => speaker.setVoiceFilter(option.value)}
                    >
                      {option.label} <small>{option.count}</small>
                    </button>
                  ))}
                </div>
                <div className="voiceList">
                  {speaker.filteredVoices.length === 0 && (
                    <div className="cardPrompt">
                      {speaker.voices.length === 0
                        ? 'No voices reported yet. On some browsers they appear only after the first playback. Press Listen once and come back.'
                        : 'This device does not identify any voices in this group. Choose All to see every professional voice.'}
                    </div>
                  )}
                  {speaker.filteredVoices.map((v) => (
                    <button
                      key={v.voiceURI}
                      className={speaker.voiceURI === v.voiceURI ? 'voiceRow on' : 'voiceRow'}
                      onClick={() => {
                        speaker.setVoiceURI(v.voiceURI);
                        speaker.say('Narration set. Ready when you are.');
                      }}
                    >
                      <span className="voiceIdentity">
                        <span className="voiceName">{v.name}</span>
                        <span className="voiceTier">{voiceGenderLabel(v)} · {voiceQualityLabel(v)}</span>
                      </span>
                      <span className="voiceLang">{v.lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="readCard check">
                <div className="readLabel">Voice quality</div>
                <div className="readText">
                  Cipher School ranks natural, enhanced and common English system voices first. Female and male groups
                  use the names supplied by your device because browsers do not provide a gender field. Novelty character voices
                  are removed, and narration uses the voice&apos;s natural pitch. Nothing you listen to is sent to Cipher
                  School. On iPhone, Settings → Accessibility → Spoken Content → Voices lets you download more voices.
                  Reopen the app after a download. iOS stops narration when the screen locks.
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
                        k === '-' ? (
                          <span className="keyDash" key={n}>
                            -
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
                    ? 'Saved for offline use. Every lesson, question and term works with no signal, including on a bus or plane.'
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

/** The explanation phase. Retrieval, application and capture follow as separate landmarks. */
function LessonBody({ lesson, activeLabel }: { lesson: FullLesson; activeLabel?: string }) {
  /* While narration runs, the section being spoken is marked so the eye can follow it. */
  const lit = (label: string) => (activeLabel === label ? ' reading' : '');

  return (
    <section
      id="lesson-understand"
      className="lessonPhase first"
      data-lesson-step="understand"
      aria-labelledby="lesson-understand-title"
    >
      <LessonPhaseHead number="01" title="Understand" note="Start with one clear idea, then build the detail around it." id="lesson-understand-title" />

      <div className={`readCard key${lit('The whole idea')}`}>
        <h3 className="readLabel">The whole idea</h3>
        <div className="readText">{lesson.oneLine}</div>
      </div>

      <div className={`readCard like${lit('Think of it like')}`}>
        <h3 className="readLabel">Think of it like</h3>
        <div className="readText">{lesson.like}</div>
      </div>

      <div className="lessonExplanation">
        <h3 className="readLabel">Build the model</h3>
        <div className="prose">
          {lesson.body.map((p, i) => (
            <p key={i} className={activeLabel === `Explanation ${i + 1}` ? 'reading' : undefined}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className={`readCard jargon${lit('Jargon decoder')}`}>
        <h3 className="readLabel">Jargon decoder</h3>
        <div className="wordList">
          {lesson.words.map((w) => (
            <div className="word" key={w.term}>
              <div className="wordTerm">{w.term}</div>
              <div className="wordMeans">{w.means}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`readCard why${lit('Why this matters')}`}>
        <h3 className="readLabel">Why this matters</h3>
        <div className="readText">{lesson.why}</div>
      </div>
    </section>
  );
}

function LessonPhaseHead({ number, title, note, id }: { number: string; title: string; note: string; id: string }) {
  return (
    <div className="lessonPhaseHead">
      <span>{number}</span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{note}</p>
      </div>
    </div>
  );
}

function LessonNotebook({ note, onChange }: { note: string; onChange: (value: string) => void }) {
  const template = 'Observation:\n\nWhy it matters:\n\nHow I would test or verify it:\n\nQuestion to revisit:';
  const [isOpen, setIsOpen] = useState(Boolean(note.trim()));

  return (
    <details
      id="lesson-capture"
      className="lessonNotebook lessonPhase"
      data-lesson-step="capture"
      aria-labelledby="lesson-notebook-title"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="lessonNotebookSummary">
        <span className="lessonNotebookNumber">04</span>
        <div>
          <h2 id="lesson-notebook-title">Capture</h2>
          <p>Save one useful observation or question. This step is optional.</p>
        </div>
        <span className="lessonNotebookState">{note.trim() ? 'Saved' : 'Optional'}<i aria-hidden="true" /></span>
      </summary>
      <div className="lessonNotebookBody">
        <div className="lessonNotebookHead">
          <div>
            <span className="readLabel">Private field note</span>
            <h3>Make the lesson yours</h3>
          </div>
          <button type="button" onClick={() => onChange(template)} disabled={Boolean(note.trim())}>
          Use note structure
          </button>
        </div>
        <p>Write the detail you want to remember, the evidence you would check, or the question you still have.</p>
        <textarea
          value={note}
          maxLength={NOTE_LIMIT}
          rows={8}
          onChange={(event) => onChange(event.target.value)}
          placeholder={'Observation:\n\nWhy it matters:\n\nHow I would verify it:'}
          aria-describedby="lesson-note-status"
        />
        <div className="lessonNotebookFoot" id="lesson-note-status">
          <span>{note.trim() ? 'Saved on this device' : 'Nothing saved yet'}</span>
          <span>{note.length.toLocaleString()} / {NOTE_LIMIT.toLocaleString()}</span>
        </div>
      </div>
    </details>
  );
}
