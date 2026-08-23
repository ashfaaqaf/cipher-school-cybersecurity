'use client';

import { useState } from 'react';
import { exerciseByLesson, isCorrect, type Exercise } from './curriculum/practice';

/**
 * The exercise that sits at the end of a lesson.
 *
 * The scaffold fades on request rather than on a timer: a nudge, then a
 * narrower nudge, then the answer. Asking for one costs nothing and is not
 * recorded, because a learner who is afraid to ask stops trying instead.
 *
 * A wrong answer is amber, never red. Red in this design means something is
 * genuinely critical, and being wrong on the first attempt at a judgement
 * question is the ordinary way of arriving at the right one.
 */

function Step({
  exercise,
  index,
  onSolved,
}: {
  exercise: Exercise;
  index: number;
  onSolved: () => void;
}) {
  const step = exercise.steps[index];
  const [value, setValue] = useState('');
  const [missed, setMissed] = useState(false);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const finished = solved || gaveUp;

  const check = () => {
    if (isCorrect(step, value)) {
      setSolved(true);
      setMissed(false);
      onSolved();
    } else {
      setMissed(true);
    }
  };

  return (
    <div className="exStep">
      <div className="exAsk">
        <span className="exNum">{String(index + 1).padStart(2, '0')}</span>
        {step.ask}
      </div>

      {!finished && (
        <>
          <div className="exRow">
            <input
              className="exInput"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setMissed(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') check();
              }}
              placeholder={step.placeholder ?? 'your answer'}
              aria-label={step.ask}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="btn primary" onClick={check} disabled={!value.trim()}>
              Check
            </button>
          </div>

          {missed && <div className="exMiss">Not that one. Read it again — or take a hint, they are free.</div>}

          {step.hints.slice(0, hints).map((h, i) => (
            <div className="exHint" key={i}>
              <span className="exHintTag">hint {i + 1}</span>
              {h}
            </div>
          ))}

          <div className="exTools">
            {hints < step.hints.length ? (
              <button className="exTool" onClick={() => setHints(hints + 1)}>
                {hints === 0 ? 'Give me a nudge' : 'Narrow it down'}
              </button>
            ) : (
              <button className="exTool" onClick={() => { setGaveUp(true); onSolved(); }}>
                Show me the answer
              </button>
            )}
          </div>
        </>
      )}

      {finished && (
        <div className={solved ? 'exResult right' : 'exResult shown'}>
          <div className="exVerdict">{solved ? '✓ correct' : 'the answer'}</div>
          <div className="exAnswer">{step.answer}</div>
          <div className="exWhy">{step.why}</div>
        </div>
      )}
    </div>
  );
}

export function PracticeBlock({ lessonId, onWorked }: { lessonId: string; onWorked: () => void }) {
  const exercise = exerciseByLesson.get(lessonId);
  const [reached, setReached] = useState(0);
  const [started, setStarted] = useState(false);

  if (!exercise) return null;

  const done = reached >= exercise.steps.length;

  return (
    <section className="practice" aria-label="Practice">
      <div className="exLabel">Practice</div>
      <h2 className="exTitle">{exercise.title}</h2>
      <p className="exBrief">{exercise.brief}</p>

      {!started ? (
        <button
          className="btn primary"
          onClick={() => {
            setStarted(true);
            onWorked();
          }}
        >
          Open the exercise
        </button>
      ) : (
        <>
          <div className="artefact">
            <div className="artefactLabel">{exercise.artefact.label}</div>
            <pre className="artefactBody">
              {exercise.artefact.lines.map((line, i) => (
                <span className="artefactLine" key={i}>
                  <span className="artefactNum">{String(i + 1).padStart(2, ' ')}</span>
                  {line || ' '}
                </span>
              ))}
            </pre>
          </div>

          {exercise.steps.slice(0, reached + 1).map((_, i) => (
            <Step
              key={i}
              exercise={exercise}
              index={i}
              onSolved={() => setReached((r) => Math.max(r, i + 1))}
            />
          ))}

          {done && (
            <div className="exDebrief">
              <div className="exDebriefLabel">What you would do next</div>
              {exercise.debrief}
            </div>
          )}
        </>
      )}
    </section>
  );
}
