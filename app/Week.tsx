'use client';

import { allLessons } from './curriculum';
import { humanMins, summariseWeek, streak as computeStreak, dayKey, type History, type PlanSettings } from './plan';

const byId = new Map(allLessons.map(({ lesson, stage }) => [lesson.id, { lesson, stage }]));

/**
 * The weekly review. Spaced repetition only works if you come back, and coming
 * back is much easier when the last week is visible as something you did rather
 * than as a backlog you failed to clear.
 */
export function WeekReview({
  history,
  settings,
  onOpen,
}: {
  history: History;
  settings: PlanSettings;
  onOpen: (lessonId: string) => void;
}) {
  const today = dayKey();
  const week = summariseWeek(history, today);
  const streak = computeStreak(history, today);
  const target = settings.weeklyHours * 60;
  const pct = Math.min(100, Math.round((week.mins / Math.max(1, target)) * 100));
  const delta = week.mins - week.prevMins;

  const nothingYet = week.mins === 0 && week.lessons === 0 && week.cards === 0;

  return (
    <article className="week glass reveal">
      <div className="weekHead">
        <div>
          <div className="kicker">Last seven days</div>
          <div className="weekBig">
            {nothingYet
              ? 'Nothing yet this week.'
              : `${humanMins(week.mins)} of study across ${week.activeDays} day${week.activeDays === 1 ? '' : 's'}.`}
          </div>
        </div>
        {streak > 0 && (
          <div className="streak on">
            <span className="streakNum">{streak}</span>
            <span className="streakLabel">day{streak === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      <div className="todayBar" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="todayMeta">
        {pct}% of your {settings.weeklyHours}h target
        {week.prevMins > 0 && (
          <>
            {' · '}
            <span className={delta >= 0 ? 'deltaUp' : 'deltaDown'}>
              {delta >= 0 ? '▲' : '▼'} {humanMins(Math.abs(delta))} vs the week before
            </span>
          </>
        )}
      </div>

      {!nothingYet && (
        <div className="weekStats">
          <div className="weekStat">
            <span className="weekStatNum">{week.lessons}</span>
            <span className="weekStatLabel">lesson{week.lessons === 1 ? '' : 's'}</span>
          </div>
          <div className="weekStat">
            <span className="weekStatNum">{week.cards}</span>
            <span className="weekStatLabel">cards reviewed</span>
          </div>
          <div className="weekStat">
            <span className="weekStatNum">{week.activeDays}/7</span>
            <span className="weekStatLabel">days active</span>
          </div>
        </div>
      )}

      {week.lessonIds.length > 0 && (
        <>
          <div className="weekLearnedLabel">What you learned</div>
          <div className="weekLearned">
            {week.lessonIds.map((id) => {
              const entry = byId.get(id);
              if (!entry) return null;
              return (
                <button className="learnedChip" key={id} onClick={() => onOpen(id)}>
                  <span className="learnedStage">{entry.stage.number}</span>
                  {entry.lesson.title}
                </button>
              );
            })}
          </div>
        </>
      )}

      {nothingYet && (
        <p className="weekEmpty">
          One lesson and a handful of cards is a week that counts. The streak is worth more than any single long
          session: consistency is what spaced repetition is built on.
        </p>
      )}
    </article>
  );
}
