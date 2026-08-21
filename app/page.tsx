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
  filters,
  glossary,
  sources,
  stages,
  totalHours,
  totalLessons,
  totalReadMins,
  totalWeeks,
  totalWords,
  tracks,
  type Lesson,
  type Stage,
} from './curriculum';

const STORE = 'cipher-school-progress';
const THEME = 'cipher-school-theme';

type View = 'learn' | 'paths' | 'words' | 'sources';

const views: { id: View; icon: string; label: string }[] = [
  { id: 'learn', icon: '◈', label: 'Learn' },
  { id: 'paths', icon: '⇢', label: 'Paths' },
  { id: 'words', icon: '¶', label: 'Words' },
  { id: 'sources', icon: '❖', label: 'Sources' },
];

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
  const dragFrom = useRef<number | null>(null);

  /* ---------- persistence ---------- */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORE);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
      const t = window.localStorage.getItem(THEME);
      if (t === 'day' || t === 'night') setTheme(t);
    } catch {
      /* progress simply starts clean when storage is unavailable */
    }
  }, []);

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
        tap(12);
        window.setTimeout(() => setPopped(null), 480);
      }
      save(next);
    },
    [completed, save],
  );

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
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
    setClosing(true);
    window.setTimeout(() => {
      setReader(null);
      setClosing(false);
      setDragY(0);
    }, 300);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const target = flatIndex + dir;
      if (target < 0 || target >= allLessons.length) return;
      const { lesson } = allLessons[target];
      const s = stages.findIndex((st) => st.lessons.some((x) => x.id === lesson.id));
      const l = stages[s].lessons.findIndex((x) => x.id === lesson.id);
      setDragY(0);
      setReader({ s, l });
      document.querySelector('.sheetBody')?.scrollTo({ top: 0 });
    },
    [flatIndex],
  );

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
      <div className="field" aria-hidden="true">
        <div className="orb a" />
        <div className="orb b" />
        <div className="grid" />
      </div>

      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--grow)" />
          </linearGradient>
        </defs>
      </svg>

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
              <button className="iconBtn" onClick={() => setInstallOpen(true)} aria-label="Add to iPhone" title="Add to iPhone">
                ⌂
              </button>
            </div>
          </div>

          <div className="island">
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
        <section className="hero">
          <span className="eyebrow">◆ Everything, in plain language</span>
          <h1>
            Learn cybersecurity <em>from zero</em> to genuinely expert.
          </h1>
          <p className="lede">
            Twelve stages. {totalLessons} written lessons — not a list of topics, but the actual explanation, in words a
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

          <div className="stats">
            <div className="stat glass">
              <div className="statNum">{totalLessons}</div>
              <div className="statLabel">Written lessons</div>
            </div>
            <div className="stat glass">
              <div className="statNum">{totalWords}</div>
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
            </div>
          </div>
        </section>

        {/* ---------------- learn ---------------- */}
        {view === 'learn' && (
          <section id="learn">
            <div className="sectionHead reveal">
              <div className="kicker">The roadmap</div>
              <h2>Twelve stages, in order</h2>
              <p className="sectionNote">
                Do them in sequence if you are new. Each stage recolours the app — a different colour per stage helps
                your memory keep them separate. Tap any lesson to read it.
              </p>
            </div>

            <div className="searchRow reveal">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search lessons, ideas, jargon…"
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

            <div className="stageList" style={{ marginTop: 14 }}>
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

        {/* ---------------- paths ---------------- */}
        {view === 'paths' && (
          <section id="paths">
            <div className="sectionHead reveal">
              <div className="kicker">Career paths</div>
              <h2>Seven ways through</h2>
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
          </section>
        )}

        {/* ---------------- glossary ---------------- */}
        {view === 'words' && (
          <section id="words">
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
                <div key={w.term} className="glossItem reveal">
                  <div className="glossTerm">{w.term}</div>
                  <div className="glossMeans">{w.means}</div>
                  <div className="glossStage">Stage {w.stage}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- sources ---------------- */}
        {view === 'sources' && (
          <section id="sources">
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
      </div>

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

            <div className="sheetBody">
              <LessonBody lesson={current.lesson} />
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

      {/* ---------------- install sheet ---------------- */}
      {installOpen && (
        <>
          <div className="scrim" onClick={() => setInstallOpen(false)} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Add to iPhone">
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
function LessonBody({ lesson }: { lesson: Lesson }) {
  return (
    <>
      <div className="readCard key">
        <div className="readLabel">The whole idea</div>
        <div className="readText">{lesson.oneLine}</div>
      </div>

      <div className="readCard like">
        <div className="readLabel">Think of it like</div>
        <div className="readText">{lesson.like}</div>
      </div>

      <div className="prose">
        {lesson.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="readCard" style={{ marginTop: 18 }}>
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

      <div className="readCard why">
        <div className="readLabel">Why this matters</div>
        <div className="readText">{lesson.why}</div>
      </div>

      <div className="readCard do">
        <div className="readLabel">Go and do this</div>
        <div className="readText">{lesson.doThis}</div>
      </div>

      <div className="readCard check">
        <div className="readLabel">Check yourself</div>
        <div className="readText">{lesson.check}</div>
      </div>
    </>
  );
}
