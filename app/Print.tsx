'use client';

import type { FullStage } from './curriculum';

/**
 * A whole stage laid out for paper.
 *
 * Rendered off-screen and revealed only by the print stylesheet, so the on-screen
 * app never has to expand every accordion to produce a printable page. Glass,
 * gradients and dark backgrounds all vanish here: they cost ink and read badly
 * in monochrome: leaving plain black-on-white typography.
 */
export function PrintSheet({ stage }: { stage: FullStage }) {
  return (
    <div className="printSheet" aria-hidden="true">
      <header className="pHead">
        <div className="pKicker">Cipher School · Stage {stage.number}</div>
        <h1 className="pTitle">{stage.title}</h1>
        <p className="pSub">{stage.subtitle}</p>
        <p className="pPlain">{stage.plain}</p>
        <dl className="pFacts">
          <div>
            <dt>Level</dt>
            <dd>{stage.level}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>
              {stage.weeks} weeks · {stage.hours} hours
            </dd>
          </div>
          <div>
            <dt>Lessons</dt>
            <dd>{stage.lessons.length}</dd>
          </div>
        </dl>
      </header>

      <section className="pBlock">
        <h2>What you will be able to do</h2>
        <p>{stage.outcome}</p>
        <h2>Build this</h2>
        <p>{stage.project}</p>
        <h2>You are ready to move on when</h2>
        <p>{stage.checkpoint}</p>
      </section>

      {stage.lessons.map((lesson, i) => (
        <article className="pLesson" key={lesson.id}>
          <h2 className="pLessonTitle">
            {i + 1}. {lesson.title}
          </h2>

          <p className="pOne">
            <strong>The whole idea.</strong> {lesson.oneLine}
          </p>
          <p className="pLike">
            <strong>Think of it like.</strong> {lesson.like}
          </p>

          {lesson.body.map((p, n) => (
            <p key={n}>{p}</p>
          ))}

          <div className="pWords">
            <h3>Jargon decoder</h3>
            <dl>
              {lesson.words.map((w) => (
                <div key={w.term}>
                  <dt>{w.term}</dt>
                  <dd>{w.means}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p>
            <strong>Why this matters.</strong> {lesson.why}
          </p>
          <p>
            <strong>Go and do this.</strong> {lesson.doThis}
          </p>
          <p className="pCheck">
            <strong>Check yourself.</strong> {lesson.check}
          </p>
        </article>
      ))}

      <footer className="pFoot">
        <h2>Where to practise</h2>
        <ul>
          {stage.resources.map((r) => (
            <li key={r.href}>
              {r.label}: <span className="pUrl">{r.href}</span>
            </li>
          ))}
        </ul>
        <p className="pLegal">
          Only test systems you own, systems you have written permission to test, or labs built for practice.
          Unauthorised access is a crime in most countries even when nothing breaks and no harm was intended.
        </p>
        <p className="pSource">Cipher School · Learn. Recall. Investigate. Prove.</p>
      </footer>
    </div>
  );
}
