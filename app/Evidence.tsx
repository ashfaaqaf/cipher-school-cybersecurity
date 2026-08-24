'use client';

import { useMemo, useState } from 'react';
import { stages, practiceLessons, type Stage } from './curriculum';
import { roles, roleLessons } from './curriculum/roles';

/**
 * What you can actually show for it.
 *
 * Every free course on earth ends with a completion percentage, which is worth
 * nothing to anyone hiring. This turns the same progress into the thing a
 * junior applicant is short of: specific, checkable claims about what they have
 * done, in the vocabulary the adverts themselves use.
 *
 * It is generated, not written, so it cannot overstate anything — every line
 * comes from a lesson that was marked understood or an exercise that was
 * finished. The output is plain text on purpose: it goes into a CV, a covering
 * email or a GitHub README, and none of those want markup.
 */

function stageEvidence(stage: Stage, completed: Set<string>) {
  const done = stage.lessons.filter((l) => completed.has(l.id));
  const worked = stage.lessons.filter((l) => completed.has(l.id) && practiceLessons.includes(l.id));
  return { done, worked };
}

export function EvidenceSheet({
  completed,
  practised,
}: {
  completed: Set<string>;
  practised: Set<string>;
}) {
  const [copied, setCopied] = useState(false);

  const covered = useMemo(
    () => stages.map((s) => ({ stage: s, ...stageEvidence(s, completed) })).filter((x) => x.done.length > 0),
    [completed],
  );

  /* Readiness per advert, using the same mapping the Paths tab shows. */
  const readiness = useMemo(
    () =>
      roles
        .map((role) => {
          const needed = roleLessons(role);
          const met = needed.filter((id) => completed.has(id));
          return { role, pct: needed.length ? Math.round((met.length / needed.length) * 100) : 0, met: met.length, needed: needed.length };
        })
        .sort((a, b) => b.pct - a.pct),
    [completed],
  );

  const solved = useMemo(() => practiceLessons.filter((id) => practised.has(id)), [practised]);

  const text = useMemo(() => {
    const lines: string[] = [];
    lines.push('CYBERSECURITY — WHAT I HAVE COVERED');
    lines.push('');
    lines.push(`${completed.size} lessons completed across ${covered.length} of ${stages.length} stages.`);
    if (solved.length) lines.push(`${solved.length} hands-on exercises completed on real artefacts.`);
    lines.push('');
    for (const { stage, done } of covered) {
      lines.push(`Stage ${stage.number} — ${stage.title} (${done.length}/${stage.lessons.length})`);
      lines.push(`  ${stage.outcome}`);
      lines.push('');
    }
    if (solved.length) {
      lines.push('HANDS-ON WORK');
      for (const id of solved) {
        const lesson = stages.flatMap((s) => s.lessons).find((l) => l.id === id);
        if (lesson) lines.push(`  · ${lesson.title}`);
      }
      lines.push('');
    }
    const top = readiness[0];
    if (top && top.pct > 0) {
      lines.push('AGAINST REAL ADVERTS');
      for (const r of readiness.slice(0, 3)) {
        lines.push(`  ${r.pct}% of the lessons mapped to "${r.role.title}" (${r.met}/${r.needed})`);
      }
      lines.push('');
    }
    lines.push('Studied with Cipher School — every claim above is a lesson completed, not a course enrolled in.');
    return lines.join('\n');
  }, [completed, covered, solved, readiness]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked: the text is on screen and selectable anyway */
    }
  };

  if (completed.size === 0) {
    return (
      <div className="empty">
        <div className="emptyTitle">Nothing to show yet</div>
        <div className="emptyText">
          Finish a lesson and this becomes a sheet you can paste into a CV, a covering email or a README — generated
          from what you actually did, so it cannot claim more than that.
        </div>
      </div>
    );
  }

  return (
    <div className="evidence">
      <div className="evidenceBar">
        <button className="btn primary" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy as text'}
        </button>
        <span className="evidenceNote">
          Generated from your progress. Every line is a lesson you marked understood or an exercise you finished.
        </span>
      </div>

      <pre className="evidenceSheet">{text}</pre>
    </div>
  );
}
