'use client';

import { useEffect, useMemo, useState } from 'react';
import { allLessons } from './curriculum';
import {
  buildPlan,
  dailyBudget,
  dayKey,
  minutesThisWeek,
  humanMins,
  streak as computeStreak,
  studyMinsFor,
  weekWindow,
  type History,
  type PlanSettings,
} from './plan';

/* Study time per lesson comes from the stage's own hour estimate, which covers
   the lab and the exercise — not the few minutes it takes to read the page. */
const byId = new Map(
  allLessons.map(({ lesson, stage }) => [
    lesson.id,
    { lesson, stage, studyMins: studyMinsFor(stage.hours, stage.lessons.length) },
  ]),
);
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function TodayCard({
  history,
  settings,
  setSettings,
  completed,
  dueCards,
  onOpen,
  onReview,
}: {
  history: History;
  settings: PlanSettings;
  setSettings: (s: PlanSettings) => void;
  completed: Set<string>;
  dueCards: number;
  onOpen: (lessonId: string) => void;
  onReview: () => void;
}) {
  const [tuning, setTuning] = useState(false);
  /*
   * Deliberately not known during the first render. This page is prerendered
   * to static HTML at build time and served for weeks, so anything derived
   * from "today" would be baked in wrong and mismatch on hydration.
   */
  const [today, setToday] = useState('');
  useEffect(() => setToday(dayKey()), []);

  const budgetMins = dailyBudget(settings);
  const streak = computeStreak(history, today);
  const weekMins = minutesThisWeek(history, today);

  const plan = useMemo(() => {
    const nextLessons = allLessons
      .filter(({ lesson }) => !completed.has(lesson.id))
      .slice(0, 12)
      .map(({ lesson }) => ({ id: lesson.id, mins: byId.get(lesson.id)?.studyMins ?? lesson.mins }));
    return buildPlan({ budgetMins, dueCards, nextLessons, doneToday: history[today] });
  }, [budgetMins, dueCards, completed, history, today]);

  const done = history[today];
  const pct = Math.min(100, Math.round((plan.doneMins / Math.max(1, budgetMins)) * 100));

  return (
    <article className="today glass reveal">
      <div className="todayTop">
        <div>
          <div className="kicker">Today</div>
          <div className="todayTitle">
            {plan.complete && plan.doneMins > 0
              ? 'Done for today.'
              : plan.lessons.length === 0 && plan.cards === 0
                ? 'Nothing scheduled.'
                : describePlan(plan.lessons.length, plan.cards, plan.mins)}
          </div>
        </div>
        <div className={streak > 0 ? 'streak on' : 'streak'} title="Consecutive days studied">
          <span className="streakNum">{streak}</span>
          <span className="streakLabel">day{streak === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="todayBar" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="todayMeta">
        {humanMins(plan.doneMins)} of {humanMins(budgetMins)} today · {Math.round(weekMins / 6) / 10}h of{' '}
        {settings.weeklyHours}h this week
      </div>

      {plan.cards > 0 && (
        <button className="todayItem review" onClick={onReview}>
          <span className="todayIcon" aria-hidden="true">↻</span>
          <span className="todayItemMain">
            <span className="todayItemTitle">Review {plan.cards} card{plan.cards === 1 ? '' : 's'}</span>
            <span className="todayItemNote">Due now — do this before new reading</span>
          </span>
          <span className="todayMins">{Math.max(1, Math.round(plan.cards * 0.25))}m</span>
        </button>
      )}

      {plan.lessons.map((id) => {
        const entry = byId.get(id);
        if (!entry) return null;
        return (
          <button className="todayItem" key={id} onClick={() => onOpen(id)}>
            <span className="todayIcon" aria-hidden="true">◈</span>
            <span className="todayItemMain">
              <span className="todayItemTitle">{entry.lesson.title}</span>
              <span className="todayItemNote">
                Stage {entry.stage.number} · {entry.stage.title} · {entry.lesson.mins} min to read
              </span>
            </span>
            <span className="todayMins">{humanMins(entry.studyMins)}</span>
          </button>
        );
      })}

      {plan.complete && plan.doneMins > 0 && (
        <div className="todayDone">
          {done?.lessons ?? 0} lesson{(done?.lessons ?? 0) === 1 ? '' : 's'} and {done?.cards ?? 0} card
          {(done?.cards ?? 0) === 1 ? '' : 's'}. Stopping when you hit the target is the habit — the streak matters
          more than any single long day.
        </div>
      )}

      <div className="weekStrip">
        {(today ? weekWindow(today) : ['', '', '', '', '', '', '']).map((k, i) => {
          const r = k ? history[k] : undefined;
          const hit = r && (r.lessons > 0 || r.cards > 0);
          const label = k ? WEEKDAY[new Date(`${k}T00:00:00`).getDay()] : '\u00a0';
          return (
            <span key={k || i} className={`weekDot${hit ? ' hit' : ''}${k && k === today ? ' now' : ''}`} title={k}>
              <i />
              <em>{k && i === 6 ? '·' : label}</em>
            </span>
          );
        })}
        <button className="tuneBtn" onClick={() => setTuning(!tuning)}>
          {tuning ? 'Close' : 'Adjust'}
        </button>
      </div>

      {tuning && (
        <div className="tune">
          <label className="tuneRow">
            <span>Hours a week</span>
            <span className="tunePills">
              {[3, 5, 10, 15, 20].map((h) => (
                <button
                  key={h}
                  className={settings.weeklyHours === h ? 'tunePill on' : 'tunePill'}
                  onClick={() => setSettings({ ...settings, weeklyHours: h })}
                >
                  {h}
                </button>
              ))}
            </span>
          </label>
          <label className="tuneRow">
            <span>Days a week</span>
            <span className="tunePills">
              {[3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  className={settings.daysPerWeek === d ? 'tunePill on' : 'tunePill'}
                  onClick={() => setSettings({ ...settings, daysPerWeek: d })}
                >
                  {d}
                </button>
              ))}
            </span>
          </label>
          <p className="tuneNote">
            That is {humanMins(dailyBudget(settings))} a study day, against roughly two and a half hours per lesson
            including the lab and the notes. Be honest rather than ambitious — a plan you actually
            keep beats one you abandon in week two.
          </p>
        </div>
      )}
    </article>
  );
}

function describePlan(lessons: number, cards: number, mins: number): string {
  const parts: string[] = [];
  if (lessons) parts.push(`${lessons} lesson${lessons === 1 ? '' : 's'}`);
  if (cards) parts.push(`${cards} review card${cards === 1 ? '' : 's'}`);
  return `${parts.join(' and ')} — about ${humanMins(mins)}.`;
}
