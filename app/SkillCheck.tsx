'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  SKILL_CHECK_STORE,
  SKILL_QUESTIONS,
  assessmentResult,
  emptySkillCheck,
  safeSkillCheck,
  type SkillCheckState,
} from './assessment';

function saveSkillCheck(state: SkillCheckState) {
  try {
    window.localStorage.setItem(SKILL_CHECK_STORE, JSON.stringify(state));
  } catch {
    /* The current attempt remains usable when private storage is blocked. */
  }
}

export function SkillCheck({
  completed: completedLessons,
  onOpen,
  onMissions,
}: {
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
  onMissions: () => void;
}) {
  const [state, setState] = useState<SkillCheckState>(emptySkillCheck);
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const completed = Boolean(state.completedAt);
  const answered = Object.keys(state.answers).length;
  const result = useMemo(() => assessmentResult(state.answers), [state.answers]);
  const closedGaps = result.priorityLessons.filter((question) => completedLessons.has(question.lessonId)).length;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SKILL_CHECK_STORE);
      const restored = raw ? safeSkillCheck(JSON.parse(raw)) : emptySkillCheck();
      setState(restored);
      setStarted(Boolean(restored.completedAt) || Object.keys(restored.answers).length > 0);
    } catch {
      setState(emptySkillCheck());
    }
    setLoaded(true);
  }, []);

  const answer = (questionId: string, option: number) => {
    setState((current) => {
      const next = { ...current, answers: { ...current.answers, [questionId]: option }, completedAt: null };
      saveSkillCheck(next);
      return next;
    });
  };

  const submit = () => {
    if (answered !== SKILL_QUESTIONS.length) return;
    setState((current) => {
      const next = { ...current, completedAt: new Date().toISOString(), attempts: current.attempts + 1 };
      saveSkillCheck(next);
      return next;
    });
    window.setTimeout(() => document.getElementById('skill-check-result')?.scrollIntoView({ block: 'start' }), 40);
  };

  const retake = () => {
    const next = { ...emptySkillCheck(), attempts: state.attempts };
    setState(next);
    saveSkillCheck(next);
    setStarted(true);
    window.setTimeout(() => document.getElementById('skill-check-questions')?.scrollIntoView({ block: 'start' }), 40);
  };

  if (!loaded) return null;

  return (
    <section className="skillCheck reveal" aria-labelledby="skill-check-title">
      <div className="skillCheckIntro">
        <div>
          <span className="kicker">Cybersecurity baseline</span>
          <h2 id="skill-check-title">Find the gaps before they find you</h2>
          <p>Twelve work-like decisions across the foundation of cybersecurity. This is a study guide, not a certificate, and nothing leaves this device.</p>
          <div className="skillCheckFacts" aria-label="Assessment details">
            <span>12 situations</span><span>about 8 minutes</span><span>private result</span>
          </div>
        </div>
        <div className="skillCheckSignal" aria-hidden="true">
          <span>CS://BASELINE</span>
          <strong>{completed ? `${result.score}%` : `${answered}/12`}</strong>
          <small>{completed ? result.band.label : answered ? 'draft saved' : 'ready'}</small>
        </div>
      </div>

      {!started ? (
        <button className="btn primary skillCheckStart" type="button" onClick={() => setStarted(true)}>Start skill assessment →</button>
      ) : !completed ? (
        <div id="skill-check-questions" className="skillCheckQuestions">
          <div className="skillCheckProgress" aria-label={`${answered} of ${SKILL_QUESTIONS.length} questions answered`}>
            <span><b>{answered}</b> of {SKILL_QUESTIONS.length} answered</span>
            <i aria-hidden="true"><b style={{ width: `${(answered / SKILL_QUESTIONS.length) * 100}%` }} /></i>
          </div>

          {SKILL_QUESTIONS.map((question, questionIndex) => (
            <fieldset className="skillQuestion" key={question.id}>
              <legend><span>{String(questionIndex + 1).padStart(2, '0')} · {question.domain}</span>{question.prompt}</legend>
              <div>
                {question.options.map((option, optionIndex) => (
                  <label className={state.answers[question.id] === optionIndex ? 'picked' : ''} key={option}>
                    <input
                      type="radio"
                      name={`skill-${question.id}`}
                      checked={state.answers[question.id] === optionIndex}
                      onChange={() => answer(question.id, optionIndex)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="skillCheckSubmit">
            <p>{answered === SKILL_QUESTIONS.length ? 'All decisions recorded. Your result will name the lessons worth revisiting.' : `${SKILL_QUESTIONS.length - answered} decision${SKILL_QUESTIONS.length - answered === 1 ? '' : 's'} left.`}</p>
            <button className="btn primary" type="button" disabled={answered !== SKILL_QUESTIONS.length} onClick={submit}>Build my gap plan →</button>
          </div>
        </div>
      ) : (
        <div id="skill-check-result" className="skillCheckResult">
          <div className="skillScore">
            <div><strong>{result.score}</strong><span>/100</span></div>
            <div><span className="academyStatus ready">ASSESSMENT COMPLETE</span><h3>{result.band.label}</h3><p>{result.band.note}</p></div>
          </div>

          <div className="domainMap" aria-label="Results by domain">
            {result.domains.map((domain) => (
              <div key={domain.domain}>
                <span>{domain.domain}</span>
                <i aria-hidden="true"><b style={{ width: `${domain.percent}%` }} /></i>
                <strong>{domain.right}/{domain.total}</strong>
              </div>
            ))}
          </div>

          {result.priorityLessons.length ? (
            <div className="gapPlan">
              <div><span className="kicker">Priority lessons</span><h3>Your shortest useful route</h3><p>These are based only on missed decisions. Completing them does not happen automatically.</p></div>
              <ol>
                {result.priorityLessons.map((question) => (
                  <li key={question.id}>
                    <div><span>{question.domain} · {completedLessons.has(question.lessonId) ? 'LESSON COMPLETE' : 'TO REVISIT'}</span><b>{question.lessonTitle}</b><small>{question.rationale}</small></div>
                    <button type="button" onClick={() => onOpen(question.lessonId)}>{completedLessons.has(question.lessonId) ? 'Review lesson' : 'Open lesson'} →</button>
                  </li>
                ))}
              </ol>
              <p className="gapProgress" role="status">{closedGaps} of {result.priorityLessons.length} priority lessons completed</p>
            </div>
          ) : (
            <div className="gapPlan clear">
              <div><span className="kicker">No baseline gaps found</span><h3>Test the knowledge under pressure</h3><p>A perfect baseline is a reason to practise, not a claim of mastery.</p></div>
              <button className="btn primary" type="button" onClick={onMissions}>Open browser missions →</button>
            </div>
          )}

          <details className="skillReview">
            <summary>Review every decision</summary>
            <div>
              {SKILL_QUESTIONS.map((question, index) => {
                const right = state.answers[question.id] === question.correct;
                return <article key={question.id}><span>{String(index + 1).padStart(2, '0')} · {right ? 'CORRECT' : 'REVISIT'}</span><h4>{question.prompt}</h4><p>{question.rationale}</p></article>;
              })}
            </div>
          </details>

          <div className="skillResultActions">
            <small>Attempt {state.attempts} · saved only on this device</small>
            <button className="dataBtn" type="button" onClick={retake}>Retake assessment</button>
          </div>
        </div>
      )}
    </section>
  );
}
