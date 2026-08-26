'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cardIdsByLesson, practiceLessons, stages } from './curriculum';
import type { Deck } from './srs';
import {
  ACADEMY_STORE,
  CAPSTONES,
  LOCALE_NAMES,
  MISSIONS,
  ROLE_ROUTES,
  UI_COPY,
  downloadText,
  emptyAcademy,
  emptyCapstoneRun,
  emptyMissionRun,
  missionScore,
  routeWeeks,
  safeAcademy,
  type AcademyState,
  type LearnerProfile,
  type Locale,
  type Mission,
  type MissionRun,
  type Pace,
  type RoleCode,
} from './academy';

type UpdateAcademy = (recipe: (current: AcademyState) => AcademyState) => void;

export function useAcademy() {
  const [academy, setAcademy] = useState<AcademyState>(emptyAcademy);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(ACADEMY_STORE);
      const next = raw ? safeAcademy(JSON.parse(raw)) : emptyAcademy();
      setAcademy(next);
      if (next.profile) document.documentElement.lang = next.profile.locale;
    } catch {
      setAcademy(emptyAcademy());
    }
    setLoaded(true);
  }, []);

  const update = useCallback<UpdateAcademy>((recipe) => {
    setAcademy((current) => {
      const next = recipe(current);
      try {
        window.localStorage.setItem(ACADEMY_STORE, JSON.stringify(next));
      } catch {
        /* The current session remains usable if private storage is blocked. */
      }
      if (next.profile) document.documentElement.lang = next.profile.locale;
      return next;
    });
  }, []);

  useEffect(() => reload(), [reload]);

  return { academy, loaded, reload, update };
}

function fieldLabel(text: string, children: React.ReactNode) {
  return (
    <label className="academyField">
      <span>{text}</span>
      {children}
    </label>
  );
}

export function RouteBuilder({
  academy,
  update,
  onOpenStage,
}: {
  academy: AcademyState;
  update: UpdateAcademy;
  onOpenStage: (stage: string) => void;
}) {
  const existing = academy.profile;
  const [editing, setEditing] = useState(!existing);
  const [experience, setExperience] = useState(existing?.experience ?? 'new');
  const [role, setRole] = useState<RoleCode>(existing?.role ?? 'INTERN');
  const [weeklyHours, setWeeklyHours] = useState(existing?.weeklyHours ?? 6);
  const [pace, setPace] = useState<Pace>(existing?.pace ?? 'steady');
  const [locale, setLocale] = useState<Locale>(existing?.locale ?? 'en');
  const copy = UI_COPY[locale];

  const save = () => {
    const profile: LearnerProfile = {
      experience,
      role,
      weeklyHours: Math.max(1, Math.min(40, weeklyHours)),
      pace,
      locale,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    update((current) => ({ ...current, profile }));
    setEditing(false);
  };

  const profile = existing && !editing ? existing : null;
  const route = ROLE_ROUTES[profile?.role ?? role];
  const routeHours = stages
    .filter((stage) => route.stages.includes(stage.number))
    .reduce((sum, stage) => sum + stage.hours, 0);

  return (
    <section className="routeBuilder reveal" aria-labelledby="route-title">
      <div className="routeHead">
        <div>
          <div className="kicker">Personal route</div>
          <h2 id="route-title">{profile ? UI_COPY[profile.locale].route : copy.welcome}</h2>
        </div>
        {profile && (
          <button className="dataBtn" onClick={() => setEditing(true)}>
            Adjust route
          </button>
        )}
      </div>

      {editing ? (
        <div className="routeForm">
          {fieldLabel(
            'Starting point',
            <select value={experience} onChange={(event) => setExperience(event.target.value as LearnerProfile['experience'])}>
              <option value="new">I am completely new</option>
              <option value="some">I know some IT or security</option>
              <option value="working">I already work in technology</option>
            </select>,
          )}
          {fieldLabel(
            'Target role',
            <select value={role} onChange={(event) => setRole(event.target.value as RoleCode)}>
              {Object.entries(ROLE_ROUTES).map(([code, item]) => (
                <option value={code} key={code}>{item.title}</option>
              ))}
            </select>,
          )}
          {fieldLabel(
            'Hours each week',
            <input type="number" min="1" max="40" value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} />,
          )}
          {fieldLabel(
            'Route style',
            <select value={pace} onChange={(event) => setPace(event.target.value as Pace)}>
              <option value="sprint">Fast: essentials first</option>
              <option value="steady">Steady: learn and practise</option>
              <option value="deep">Deep: include every stage</option>
            </select>,
          )}
          {fieldLabel(
            'Interface language',
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              {Object.entries(LOCALE_NAMES).map(([code, name]) => <option value={code} key={code}>{name}</option>)}
            </select>,
          )}
          <div className="routeSubmit">
            <button className="btn primary" onClick={save}>{copy.save} →</button>
            <small>{copy.note}</small>
          </div>
        </div>
      ) : profile ? (
        <div className="routeResult">
          <div className="routeSummary">
            <span className="academyStatus ready">ACTIVE ROUTE</span>
            <h3>{route.title}</h3>
            <p>{route.outcome}</p>
            <div className="routeFacts">
              <span>{route.stages.length} stages</span>
              <span>{routeHours} guided hours</span>
              <span>about {routeWeeks(routeHours, profile.weeklyHours)} weeks at {profile.weeklyHours}h/week</span>
            </div>
          </div>
          <div className="routeStages" aria-label="Recommended stages in order">
            {route.stages.map((number, index) => {
              const stage = stages.find((item) => item.number === number);
              return (
                <button key={number} onClick={() => onOpenStage(number)} style={{ '--hue': String(stage?.hue ?? 210) } as React.CSSProperties}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <b>Stage {number}</b>
                  <small>{stage?.title}</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function missionRun(state: AcademyState, id: string): MissionRun {
  return state.missions[id] ?? emptyMissionRun();
}

function MissionLab({ mission, run, update }: { mission: Mission; run: MissionRun; update: UpdateAcademy }) {
  const [filter, setFilter] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(run.score !== null);
  const visible = mission.artefact.filter((line) => line.toLowerCase().includes(filter.trim().toLowerCase()));
  const result = run.score === null ? null : missionScore(mission, run);

  const writeRun = (nextRun: MissionRun) => {
    update((current) => ({ ...current, missions: { ...current.missions, [mission.id]: nextRun } }));
  };

  const assess = () => {
    const scored = missionScore(mission, run);
    writeRun({
      ...run,
      score: scored.score,
      reportScore: scored.reportScore,
      attempts: run.attempts + 1,
      completedAt: scored.passed ? (run.completedAt ?? new Date().toISOString()) : null,
    });
    setShowFeedback(true);
  };

  return (
    <div className="missionLab">
      <div className="missionBriefing">
        <div className="kicker">Case briefing</div>
        <h2>{mission.title}</h2>
        <p>{mission.brief}</p>
        <div className="briefObjective"><b>Objective</b><span>{mission.objective}</span></div>
        <div className="missionMeta"><span>{mission.role}</span><span>Stage {mission.stage}</span><span>{mission.minutes} min</span><span>{mission.difficulty}</span></div>
      </div>

      <div className="artefactPanel">
        <div className="artefactBar"><span>CS://EVIDENCE/{mission.artefactLabel}</span><i>READ ONLY</i></div>
        <label className="artefactFilter">
          <span>filter</span>
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="type an indicator…" />
        </label>
        <pre>{visible.length ? visible.join('\n') : 'No evidence line matches that filter.'}</pre>
      </div>

      <div className="decisionStack">
        {mission.questions.map((question, qIndex) => (
          <fieldset className="decisionCard" key={question.id}>
            <legend><span>{String(qIndex + 1).padStart(2, '0')}</span>{question.prompt}</legend>
            {question.options.map((option, index) => {
              const picked = run.answers[question.id] === index;
              const className = showFeedback
                ? index === question.correct ? 'answer correct' : picked ? 'answer wrong' : 'answer'
                : picked ? 'answer picked' : 'answer';
              return (
                <label className={className} key={option}>
                  <input
                    type="radio"
                    name={`${mission.id}-${question.id}`}
                    checked={picked}
                    onChange={() => {
                      writeRun({ ...run, answers: { ...run.answers, [question.id]: index }, score: null, completedAt: run.completedAt });
                      setShowFeedback(false);
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
            {showFeedback && <p className="answerWhy">{question.rationale}</p>}
          </fieldset>
        ))}
      </div>

      <div className="reportCard">
        <label htmlFor={`${mission.id}-report`}><span>Analyst report</span>{mission.reportPrompt}</label>
        <textarea
          id={`${mission.id}-report`}
          value={run.report}
          onChange={(event) => {
            writeRun({ ...run, report: event.target.value.slice(0, 1600), score: null, completedAt: run.completedAt });
            setShowFeedback(false);
          }}
          rows={7}
          placeholder="Write what the evidence supports. Separate facts from assumptions."
        />
        <div className="reportMeta"><span>{run.report.trim().length}/120 useful-character target</span><span>Terms to consider: {mission.reportTerms.join(' · ')}</span></div>
      </div>

      <div className="coachPanel">
        <div><span className="kicker">Guided coach</span><p>Hints reveal method, not the answer. Use them when you are stuck.</p></div>
        <button className="dataBtn" onClick={() => setHintCount((count) => Math.min(mission.hints.length, count + 1))} disabled={hintCount >= mission.hints.length}>
          {hintCount ? 'Another hint' : 'Give me a hint'}
        </button>
        {mission.hints.slice(0, hintCount).map((hint, index) => <blockquote key={hint}><b>Hint {index + 1}</b>{hint}</blockquote>)}
      </div>

      <div className="missionSubmit">
        <div>
          {result ? (
            <><strong className={result.passed ? 'pass' : 'retry'}>{result.score}/100 · {result.passed ? 'MISSION PASSED' : 'REVISE AND RETRY'}</strong><small>Decision score: {result.score - result.reportScore}/75 · report: {result.reportScore}/25 · {run.attempts} attempt{run.attempts === 1 ? '' : 's'}</small></>
          ) : <small>Answer every decision and write a specific report before assessment.</small>}
        </div>
        <button className="btn primary" onClick={assess} disabled={Object.keys(run.answers).length < mission.questions.length || run.report.trim().length < 35}>
          Assess my investigation →
        </button>
      </div>
      <a className="missionSource" href={mission.source.href} target="_blank" rel="noreferrer">Method source: {mission.source.label} ↗</a>
    </div>
  );
}

export function MissionsView({ academy, update }: { academy: AcademyState; update: UpdateAcademy }) {
  const [activeId, setActiveId] = useState(MISSIONS[0].id);
  const active = MISSIONS.find((mission) => mission.id === activeId) ?? MISSIONS[0];
  const passed = MISSIONS.filter((mission) => missionRun(academy, mission.id).completedAt).length;

  return (
    <section id="missions" className="band academyBand">
      <div className="sectionHead reveal">
        <div className="kicker">Zero-setup Mission Engine</div>
        <h2>Investigate, decide, explain</h2>
        <p className="sectionNote">Six safe browser simulations train judgement using logs, headers, policies and timelines. Nothing touches a real target; every case is legal, scored and saved on this device.</p>
      </div>
      <div className="missionProgress" aria-label={`${passed} of ${MISSIONS.length} missions passed`}><span><b>{passed}</b>/{MISSIONS.length} passed</span><i><b style={{ width: `${(passed / MISSIONS.length) * 100}%` }} /></i></div>
      <div className="missionPicker" role="tablist" aria-label="Mission cases">
        {MISSIONS.map((mission, index) => {
          const run = missionRun(academy, mission.id);
          return (
            <button key={mission.id} role="tab" aria-selected={mission.id === active.id} className={mission.id === active.id ? 'on' : ''} onClick={() => setActiveId(mission.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span><b>{mission.title}</b><small>{run.completedAt ? `✓ ${run.score}/100` : `${mission.role} · ${mission.minutes}m`}</small>
            </button>
          );
        })}
      </div>
      <MissionLab mission={active} run={missionRun(academy, active.id)} update={update} />
    </section>
  );
}

function portfolioMarkdown(academy: AcademyState, completed: Set<string>, practised: Set<string>) {
  const profile = academy.profile;
  const passed = MISSIONS.filter((mission) => academy.missions[mission.id]?.completedAt);
  const finished = CAPSTONES.filter((capstone) => academy.capstones[capstone.id]?.completedAt);
  const lines = [
    '# Cybersecurity Evidence Portfolio',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Target route: ${profile ? ROLE_ROUTES[profile.role].title : 'Not selected'}`,
    '',
    '## Evidence summary',
    '',
    `- ${completed.size} curriculum lessons marked understood`,
    `- ${practised.size} hands-on lesson exercises completed`,
    `- ${passed.length} scored browser investigations passed`,
    `- ${finished.length} capstones self-attested with rubric`,
    '',
    '## Scored investigations',
    '',
    ...passed.flatMap((mission) => {
      const run = academy.missions[mission.id];
      return [`### ${mission.title}: ${run.score}/100`, '', run.report.trim(), '', `Method source: ${mission.source.href}`, ''];
    }),
    '## Capstones',
    '',
    ...finished.flatMap((capstone) => [`### ${capstone.title}`, '', academy.capstones[capstone.id].notes.trim(), '']),
    '## Verification boundary',
    '',
    'Mission scores are calculated locally from authored answer keys and report criteria. Capstones are self-attested; a reviewer should inspect linked/redacted artefacts before treating them as verified work.',
  ];
  return lines.join('\n');
}

function instructorPack() {
  return [
    '# Cipher School: facilitator pack',
    '',
    '## 60-minute mission lesson',
    '',
    '1. Brief the case without giving the verdict (5 min).',
    '2. Learners highlight facts, assumptions and unknowns (10 min).',
    '3. Learners complete the case alone (20 min).',
    '4. Pairs compare their evidence and containment decisions (10 min).',
    '5. Debrief using the source and answer rationales (10 min).',
    '6. Each learner writes one changed belief (5 min).',
    '',
    '## Report rubric (25 points)',
    '',
    '- Verdict matches the evidence: 5',
    '- Concrete indicators are cited: 5',
    '- Containment is proportionate: 5',
    '- Fact and inference are separated: 5',
    '- Next evidence request is specific: 5',
    '',
    '## Safety rule',
    '',
    'Use only the included simulated evidence or a lab for which the class has explicit written permission.',
  ].join('\n');
}

export function ProofView({
  academy,
  update,
  completed,
  practised,
  deck,
}: {
  academy: AcademyState;
  update: UpdateAcademy;
  completed: Set<string>;
  practised: Set<string>;
  deck: Deck;
}) {
  const [roleFilter, setRoleFilter] = useState<RoleCode | 'ALL'>(academy.profile?.role ?? 'ALL');
  const visibleCapstones = CAPSTONES.filter((capstone) => roleFilter === 'ALL' || capstone.role === roleFilter);
  const finishedCapstones = CAPSTONES.filter((capstone) => academy.capstones[capstone.id]?.completedAt).length;
  const passedMissions = MISSIONS.filter((mission) => academy.missions[mission.id]?.completedAt).length;

  const mastery = useMemo(() => stages.map((stage) => {
    const lessonIds = stage.lessons.map((lesson) => lesson.id);
    const learned = lessonIds.filter((id) => completed.has(id)).length;
    const recalled = lessonIds.filter((id) => (cardIdsByLesson[id] ?? []).some((card) => (deck[card]?.reps ?? 0) > 0)).length;
    const exercises = lessonIds.filter((id) => practiceLessons.includes(id));
    const stageMissions = MISSIONS.filter((mission) => mission.stage === stage.number);
    const appliedDone = exercises.filter((id) => practised.has(id)).length + stageMissions.filter((mission) => academy.missions[mission.id]?.completedAt).length;
    const appliedTotal = exercises.length + stageMissions.length;
    const stageCapstones = CAPSTONES.filter((capstone) => capstone.stage === stage.number);
    const proven = stageCapstones.filter((capstone) => academy.capstones[capstone.id]?.completedAt).length;
    return { stage, learned, recalled, appliedDone, appliedTotal, proven, proveTotal: stageCapstones.length };
  }), [academy, completed, deck, practised]);

  const changeCapstone = (id: string, recipe: (run: ReturnType<typeof emptyCapstoneRun>) => ReturnType<typeof emptyCapstoneRun>) => {
    const capstone = CAPSTONES.find((item) => item.id === id)!;
    const current = academy.capstones[id] ?? emptyCapstoneRun(capstone.checks.length);
    const next = recipe(current);
    update((state) => ({ ...state, capstones: { ...state.capstones, [id]: next } }));
  };

  return (
    <section id="proof" className="band academyBand">
      <div className="sectionHead reveal">
        <div className="kicker">Proof, not points</div>
        <h2>Your cybersecurity evidence room</h2>
        <p className="sectionNote">Knowledge grows through four gates: learn it, recall it, apply it, then prove it with reviewable work. Self-attested evidence is labelled clearly.</p>
      </div>

      <div className="proofStats">
        <div><strong>{completed.size}</strong><span>learned</span></div>
        <div><strong>{Object.values(deck).filter((card) => card.reps > 0).length}</strong><span>cards recalled</span></div>
        <div><strong>{passedMissions}</strong><span>missions passed</span></div>
        <div><strong>{finishedCapstones}</strong><span>capstones ready</span></div>
      </div>

      <div className="masteryHead"><div><span className="kicker">Skill graph</span><h3>Four gates per stage</h3></div><div className="masteryLegend"><span>L learned</span><span>R recalled</span><span>A applied</span><span>P proven</span></div></div>
      <div className="masteryGraph">
        {mastery.map(({ stage, learned, recalled, appliedDone, appliedTotal, proven, proveTotal }) => (
          <div className="masteryRow" key={stage.number} style={{ '--hue': String(stage.hue) } as React.CSSProperties}>
            <div className="masteryName"><span>{stage.number}</span><b>{stage.title}</b></div>
            <Meter label="Learned" value={learned} total={stage.lessons.length} />
            <Meter label="Recalled" value={recalled} total={stage.lessons.length} />
            <Meter label="Applied" value={appliedDone} total={appliedTotal} />
            <Meter label="Proven" value={proven} total={proveTotal} />
          </div>
        ))}
      </div>

      <div className="sectionHead reveal">
        <div className="kicker">Career capstones</div>
        <h2>Build work a human can inspect</h2>
        <p className="sectionNote">A badge says you clicked. A capstone shows how you think. Keep sensitive data out, link only legal/redacted artefacts, and use the rubric before marking anything complete.</p>
      </div>
      <div className="capstoneTools">
        <label>Show <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleCode | 'ALL')}><option value="ALL">all capstones</option>{Object.entries(ROLE_ROUTES).map(([code, route]) => <option value={code} key={code}>{route.title}</option>)}</select></label>
        <button className="dataBtn" onClick={() => downloadText('cipher-school-portfolio.md', portfolioMarkdown(academy, completed, practised))}>↓ Export evidence portfolio</button>
      </div>
      <div className="capstoneGrid">
        {visibleCapstones.map((capstone) => {
          const run = academy.capstones[capstone.id] ?? emptyCapstoneRun(capstone.checks.length);
          const ready = run.checks.every(Boolean) && run.notes.trim().length >= 80;
          return (
            <article className="capstoneCard" key={capstone.id}>
              <div className="capstoneTop"><span>{capstone.role} · STAGE {capstone.stage}</span>{run.completedAt && <i>PROOF READY</i>}</div>
              <h3>{capstone.title}</h3><p>{capstone.brief}</p>
              <div className="rubricList">{capstone.checks.map((check, index) => <label key={check}><input type="checkbox" checked={run.checks[index] ?? false} onChange={() => changeCapstone(capstone.id, (current) => ({ ...current, checks: current.checks.map((value, i) => i === index ? !value : value), completedAt: null }))} /><span>{check}</span></label>)}</div>
              <label className="capstoneNote"><span>{capstone.prompt}</span><textarea rows={5} value={run.notes} onChange={(event) => changeCapstone(capstone.id, (current) => ({ ...current, notes: event.target.value.slice(0, 1800), completedAt: null }))} /></label>
              <button className={run.completedAt ? 'btn done' : 'btn primary'} disabled={!ready && !run.completedAt} onClick={() => changeCapstone(capstone.id, (current) => ({ ...current, completedAt: current.completedAt ? null : new Date().toISOString() }))}>{run.completedAt ? '✓ Evidence ready: undo' : 'Mark evidence ready'}</button>
            </article>
          );
        })}
      </div>

      <div className="assessmentPanel">
        <div><span className="kicker">Assessment record</span><h3>What the scores mean</h3><p>Mission scores are checked by this app. Capstones are self-attested until a mentor or employer reviews the artefact.</p></div>
        <div>{MISSIONS.map((mission) => { const run = academy.missions[mission.id]; return <span key={mission.id}><b>{run?.completedAt ? `${run.score}/100` : 'Not yet'}</b>{mission.title}<small>{run?.completedAt ? 'locally assessed' : 'not passed yet'}</small></span>; })}</div>
      </div>

      <div className="instructorPanel">
        <div><span className="kicker">Classroom mode</span><h3>Teach a case in 60 minutes</h3><p>A privacy-safe facilitator plan, report rubric and debrief structure. No learner account or tracking dashboard required.</p></div>
        <button className="btn ghost" onClick={() => downloadText('cipher-school-facilitator-pack.md', instructorPack())}>Download facilitator pack ↓</button>
      </div>
    </section>
  );
}

function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return <div className={`masteryMeter${pct === 100 && total ? ' full' : ''}`} title={`${label}: ${value} of ${total || 0}`}><span>{label.charAt(0)}</span><i><b style={{ width: `${pct}%` }} /></i><small>{total ? `${pct}%` : '0%'}</small></div>;
}

export function FreshnessPanel() {
  const rows = [
    ['NIST CSF', '2.0', 'risk lifecycle'],
    ['MITRE ATT&CK', 'v18', 'adversary behaviour'],
    ['OWASP Top 10', '2025', 'web application risk'],
    ['NIST incident response', 'SP 800-61r3', 'response and recovery'],
  ];
  return (
    <div className="freshnessPanel reveal">
      <div className="freshnessIntro"><span className="kicker">Content health</span><h3>Standards, versions, review dates</h3><p>Security guidance ages. This release states which baseline it teaches and links to primary sources so learners can verify changes.</p></div>
      <div className="freshnessTable">{rows.map(([name, version, use]) => <div key={name}><b>{name}</b><span>{version}</span><small>{use}</small></div>)}</div>
      <div className="freshnessFoot"><span>Curriculum reviewed: 26 August 2026</span><a href="https://github.com/ashfaaqaf/cipher-school-cybersecurity/issues" target="_blank" rel="noreferrer">Report outdated content ↗</a></div>
    </div>
  );
}

export function CapabilityBoundary() {
  return (
    <div className="boundaryPanel reveal">
      <div><span className="kicker">Trust model</span><h3>What happens on your device</h3><p>The browser runs lessons, simulations, scoring, plans and exports. No personal progress is uploaded in this release.</p></div>
      <ul>
        <li><b>Guided coach</b><span>Authored hints; no prompt or learner data leaves the device.</span></li>
        <li><b>Optional sync</b><span>Use backup/restore today; accounts will only ship with encrypted transport, deletion and recovery.</span></li>
        <li><b>Live practice</b><span>Included cases are simulated; linked third-party labs run real disposable targets under their own terms.</span></li>
        <li><b>Community</b><span>No unmoderated feed. Facilitator packs support safe cohorts without public learner data.</span></li>
      </ul>
    </div>
  );
}
