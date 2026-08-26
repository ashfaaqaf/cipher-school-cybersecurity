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

/**
 * Answer it before you can see the options.
 *
 * Multiple choice measures recognition, which runs on familiarity: the right
 * answer looks right once it is in front of you, and the feeling of knowing it
 * is not the same as knowing it. Generating the answer first: writing it, with
 * nothing to choose from: is what the retrieval-practice evidence consistently
 * favours for long-term retention.
 *
 * Nothing is marked here and skipping is one press, because a gate that punishes
 * people teaches them to stop rather than to try.
 */
function RecallFirst({ onDone }: { onDone: () => void }) {
  const [attempt, setAttempt] = useState('');
  return (
    <div className="recallFirst">
      <div className="recallAsk">Answer it from memory first, then the options appear.</div>
      <textarea
        className="recallBox"
        value={attempt}
        onChange={(e) => setAttempt(e.target.value)}
        placeholder="what do you think, and why?"
        rows={2}
        aria-label="Your answer from memory"
      />
      <button className="btn primary wide" onClick={onDone}>
        {attempt.trim() ? 'Show the options' : 'Skip: show the options'}
      </button>
    </div>
  );
}

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
  const [attempt, setAttempt] = useState('');
  const [recalled, setRecalled] = useState(false);
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

        {!recalled && <RecallFirst onDone={() => setRecalled(true)} />}

        {recalled && (
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
        )}

        {answered && (
          <>
            <div className={correct ? 'verdict ok' : 'verdict no'}>
              {correct ? 'Correct' : 'Not quite: this is the useful bit:'}
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
          {/*
            * Typing the answer rather than thinking it is the whole point. The
            * evidence on retrieval practice is consistent that generating an
            * answer: free recall or short answer: produces markedly better
            * long-term retention than recognising one, because recognition can
            * be done on familiarity alone. Nothing marks this: it is compared
            * against the real definition by the only judge who knows whether
            * you meant it, which is you.
            */}
          <div className="cardPrompt">Write what it means, in your own words. Typing it is what makes it stick.</div>
          <textarea
            className="recallBox"
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            placeholder="in your own words…"
            rows={3}
            aria-label={`What does ${card.term} mean?`}
          />
          <button className="btn primary wide" onClick={() => setShown(true)}>
            {attempt.trim() ? 'Check it' : 'Show the meaning'}
          </button>
        </>
      ) : (
        <>
          {attempt.trim() && (
            <div className="recallBack">
              <div className="recallLabel">what you wrote</div>
              {attempt}
            </div>
          )}
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
          Cards unlock as you finish lessons: each lesson adds its questions and its terms to the deck. Read one lesson
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
          <div className="restTitle">Nothing due: that is the system working</div>
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
        grows: a day, six days, then weeks. Get it wrong and it resets. Grade yourself accurately. That is what makes
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
  /* Which questions have had their options revealed. See RecallFirst. */
  const [opened, setOpened] = useState<Record<string, boolean>>({});

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
            {!opened[q.id] && <RecallFirst onDone={() => setOpened((o) => ({ ...o, [q.id]: true }))} />}
            {opened[q.id] && (
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
            )}
            {isAnswered && <div className="cardWhy">{q.why}</div>}
          </div>
        );
      })}
    </div>
  );
}
