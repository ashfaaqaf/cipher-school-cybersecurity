'use client';

import { useCallback, useMemo, useState } from 'react';
import { cardsById, questionsByLesson, type Card } from './curriculum/full';
import { deckStats, dueNow, intervalLabel, schedule, today, type Deck, type Grade } from './srs';

const GRADES: { g: Grade; label: string; tone: string }[] = [
  { g: 0, label: 'Again', tone: 'again' },
  { g: 1, label: 'Hard', tone: 'hard' },
  { g: 2, label: 'Good', tone: 'good' },
  { g: 3, label: 'Easy', tone: 'easy' },
];

/* ------------------------------------------------------------------ *
 * One card, either a question or a term. Reveal, then grade.
 * ------------------------------------------------------------------ */

function CardFace({
  card,
  deck,
  onGrade,
  speak,
}: {
  card: Card;
  deck: Deck;
  onGrade: (grade: Grade) => void;
  speak?: (text: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const day = today();

  const answered = card.kind === 'quiz' ? picked !== null : shown;
  const correct = card.kind === 'quiz' && picked === card.question.answer;

  /* Preview the interval each button would produce, so grading is informed. */
  const preview = (g: Grade) => intervalLabel(schedule(deck[card.id], g, day).interval);

  if (card.kind === 'quiz') {
    const q = card.question;
    return (
      <div className="card glass">
        <div className="cardKind">Question</div>
        <div className="cardAsk">{q.ask}</div>

        <div className="options">
          {q.options.map((opt, i) => {
            let cls = 'option';
            if (answered) {
              if (i === q.answer) cls += ' right';
              else if (i === picked) cls += ' wrong';
              else cls += ' dim';
            }
            return (
              <button key={i} className={cls} disabled={answered} onClick={() => setPicked(i)}>
                <span className="optionMark" aria-hidden="true">
                  {answered && i === q.answer ? '✓' : answered && i === picked ? '✕' : String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <>
            <div className={correct ? 'verdict ok' : 'verdict no'}>
              {correct ? 'Correct' : 'Not quite — this is the useful bit:'}
            </div>
            <div className="cardWhy">{q.why}</div>
            <div className="grades">
              {(correct ? GRADES.filter((x) => x.g > 0) : GRADES.filter((x) => x.g === 0)).map((x) => (
                <button key={x.g} className={`grade ${x.tone}`} onClick={() => onGrade(x.g)}>
                  <span>{x.label}</span>
                  <em>{preview(x.g)}</em>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card glass">
      <div className="cardKind">Term</div>
      <div className="cardTerm">{card.term}</div>
      {!shown ? (
        <>
          <div className="cardPrompt">Say what it means, out loud, before you look.</div>
          <button className="btn primary wide" onClick={() => setShown(true)}>
            Show the meaning
          </button>
        </>
      ) : (
        <>
          <div className="cardWhy big">{card.means}</div>
          {speak && (
            <button className="btn ghost wide" onClick={() => speak(`${card.term}. ${card.means}`)}>
              ▶ Hear it
            </button>
          )}
          <div className="grades">
            {GRADES.map((x) => (
              <button key={x.g} className={`grade ${x.tone}`} onClick={() => onGrade(x.g)}>
                <span>{x.label}</span>
                <em>{preview(x.g)}</em>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The review tab: stats, then a session.
 * ------------------------------------------------------------------ */

export function ReviewView({
  deck,
  unlocked,
  onGrade,
  speak,
}: {
  deck: Deck;
  unlocked: string[];
  onGrade: (id: string, grade: Grade) => void;
  speak?: (text: string) => void;
}) {
  const [queue, setQueue] = useState<string[] | null>(null);
  const [pos, setPos] = useState(0);
  const [done, setDone] = useState(0);
  const day = today();

  const stats = useMemo(() => deckStats(deck, unlocked, day), [deck, unlocked, day]);
  const due = useMemo(() => dueNow(deck, unlocked, day), [deck, unlocked, day]);

  const start = useCallback(
    (ids: string[]) => {
      setQueue(ids.slice(0, 40));
      setPos(0);
      setDone(0);
    },
    [],
  );

  const grade = useCallback(
    (id: string, g: Grade) => {
      onGrade(id, g);
      setQueue((q) => {
        if (!q) return q;
        /* A forgotten card goes to the back of this session, not away. */
        const next = g === 0 ? [...q, id] : q;
        return next;
      });
      setDone((d) => d + 1);
      setPos((p) => p + 1);
    },
    [onGrade],
  );

  if (unlocked.length === 0) {
    return (
      <div className="empty">
        <div className="emptyTitle">Nothing to review yet</div>
        <div className="emptyText">
          Cards unlock as you finish lessons — each lesson adds its questions and its terms to the deck. Read one lesson
          and mark it understood, then come back.
        </div>
      </div>
    );
  }

  if (queue) {
    const id = queue[pos];
    const card = id ? cardsById.get(id) : undefined;

    if (!card) {
      return (
        <div className="doneCard glass">
          <div className="doneBig">✓</div>
          <div className="doneTitle">Session finished</div>
          <div className="doneText">
            {done} card{done === 1 ? '' : 's'} reviewed. The ones you found hard will come back sooner; the ones you
            knew will not bother you for weeks.
          </div>
          <button className="btn primary wide" onClick={() => setQueue(null)}>
            Back to review
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="sessionBar">
          <span className="sessionCount">
            {pos + 1} / {queue.length}
          </span>
          <span className="sessionTrack" aria-hidden="true">
            <i style={{ width: `${(pos / queue.length) * 100}%` }} />
          </span>
          <button className="sessionQuit" onClick={() => setQueue(null)}>
            End
          </button>
        </div>
        <CardFace key={id + pos} card={card} deck={deck} onGrade={(g) => grade(id, g)} speak={speak} />
      </>
    );
  }

  return (
    <>
      <div className="srsGrid">
        <div className="srsTile glass">
          <div className="srsNum due">{stats.due}</div>
          <div className="srsLabel">Due now</div>
        </div>
        <div className="srsTile glass">
          <div className="srsNum">{stats.fresh}</div>
          <div className="srsLabel">New</div>
        </div>
        <div className="srsTile glass">
          <div className="srsNum">{stats.learning}</div>
          <div className="srsLabel">Learning</div>
        </div>
        <div className="srsTile glass">
          <div className="srsNum known">{stats.known}</div>
          <div className="srsLabel">Locked in</div>
        </div>
      </div>

      {stats.due > 0 ? (
        <button className="btn primary wide big" onClick={() => start(due)}>
          Review {Math.min(stats.due, 40)} card{stats.due === 1 ? '' : 's'} →
        </button>
      ) : (
        <div className="restCard glass">
          <div className="restTitle">Nothing due — that is the system working</div>
          <div className="restText">
            {stats.nextDue !== null
              ? `Your next cards come back in ${intervalLabel(stats.nextDue - day)}. Reviewing early feels productive and weakens the effect; the forgetting is the part that builds the memory.`
              : 'Finish more lessons to add cards to the deck.'}
          </div>
          <button className="btn ghost wide" onClick={() => start(unlocked.slice(0, 20))}>
            Drill anyway
          </button>
        </div>
      )}

      <div className="srsNote">
        <b>How this works.</b> Each card comes back just before you would have forgotten it. Get it right and the gap
        grows — a day, six days, then weeks. Get it wrong and it resets. Answering honestly is the whole trick: grading
        yourself generously only means reviewing things you do not actually know.
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The short quiz at the end of a lesson.
 * ------------------------------------------------------------------ */

export function LessonQuiz({ lessonId, onGrade }: { lessonId: string; onGrade: (id: string, grade: Grade) => void }) {
  const qs = questionsByLesson.get(lessonId) ?? [];
  const [picks, setPicks] = useState<Record<string, number>>({});

  if (qs.length === 0) return null;
  const answered = qs.filter((q) => picks[q.id] !== undefined).length;
  const right = qs.filter((q) => picks[q.id] === q.answer).length;

  return (
    <div className="quizBlock">
      <div className="quizHead">
        <span className="readLabel" style={{ margin: 0 }}>
          Test yourself
        </span>
        {answered === qs.length && (
          <span className="quizScore">
            {right}/{qs.length}
          </span>
        )}
      </div>

      {qs.map((q) => {
        const picked = picks[q.id];
        const isAnswered = picked !== undefined;
        return (
          <div className="card inline" key={q.id}>
            <div className="cardAsk">{q.ask}</div>
            <div className="options">
              {q.options.map((opt, i) => {
                let cls = 'option';
                if (isAnswered) {
                  if (i === q.answer) cls += ' right';
                  else if (i === picked) cls += ' wrong';
                  else cls += ' dim';
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={isAnswered}
                    onClick={() => {
                      setPicks((p) => ({ ...p, [q.id]: i }));
                      /* Feed the answer straight into the schedule so the lesson quiz counts. */
                      onGrade(`q:${q.id}`, i === q.answer ? 2 : 0);
                    }}
                  >
                    <span className="optionMark" aria-hidden="true">
                      {isAnswered && i === q.answer ? '✓' : isAnswered && i === picked ? '✕' : String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {isAnswered && <div className="cardWhy">{q.why}</div>}
          </div>
        );
      })}
    </div>
  );
}
