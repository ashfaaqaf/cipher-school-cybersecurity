'use client';

import { useState, type CSSProperties } from 'react';
import { allLessons } from './curriculum';
import { companions, marketNote, roleLessons, roles, type Requirement, type Role } from './curriculum/roles';

/** Find a lesson by id so a requirement can link straight into the reader. */
const byId = new Map(allLessons.map(({ lesson, stage }) => [lesson.id, { lesson, stage }]));

function ReqRow({
  req,
  completed,
  onOpen,
}: {
  req: Requirement;
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
}) {
  const done = req.lessons.filter((l) => completed.has(l)).length;
  const covered = req.lessons.length > 0 && done === req.lessons.length;

  return (
    <div className={covered ? 'req covered' : 'req'}>
      <div className="reqTop">
        <span className="reqTick" aria-hidden="true">
          {req.lessons.length === 0 ? '·' : covered ? '✓' : `${done}/${req.lessons.length}`}
        </span>
        <span className="reqText">{req.text}</span>
      </div>
      <div className="reqMeans">{req.means}</div>
      {req.lessons.length > 0 && (
        <div className="reqLessons">
          {req.lessons.map((id) => {
            const entry = byId.get(id);
            if (!entry) return null;
            return (
              <button
                key={id}
                className={completed.has(id) ? 'reqChip done' : 'reqChip'}
                onClick={() => onOpen(id)}
                title={entry.lesson.title}
              >
                {completed.has(id) && <span aria-hidden="true">✓ </span>}
                {entry.lesson.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  completed,
  onOpen,
}: {
  role: Role;
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const lessons = roleLessons(role);
  const done = lessons.filter((l) => completed.has(l)).length;
  const pct = Math.round((done / lessons.length) * 100);

  return (
    <article className={`role glass${open ? ' open' : ''}`} style={{ '--hue': String(role.hue) } as CSSProperties}>
      <button className="roleBtn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="roleRing" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle className="ringTrack" cx="26" cy="26" r="21" strokeWidth="6" fill="none" />
            <circle
              cx="26"
              cy="26"
              r="21"
              strokeWidth="6"
              fill="none"
              stroke="var(--accent)"
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              strokeDasharray={2 * Math.PI * 21}
              strokeDashoffset={2 * Math.PI * 21 * (1 - done / lessons.length)}
            />
          </svg>
          <span className="roleRingPct">{pct}%</span>
        </div>
        <div className="roleMain">
          <div className="roleTitleRow">
            <span className="roleTitle">{role.title}</span>
            <span className={`roleLevel l${role.level.replace(' ', '')}`}>{role.level}</span>
          </div>
          <div className="roleOrg">{role.org}</div>
          <div className="roleReady">
            {done} of {lessons.length} lessons covering this advert
          </div>
        </div>
        <span className="caret" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="roleBody">
        <div className="roleBodyInner">
          <div className="rolePad">
            <p className="plain">
              <b>Honest read: </b>
              {role.summary}
            </p>

            {role.source && (
              <div className="roleSource">
                Advert:{' '}
                {role.source.href ? (
                  <a href={role.source.href} target="_blank" rel="noreferrer">
                    {role.source.name} ↗
                  </a>
                ) : (
                  role.source.name
                )}{' '}
                · {role.source.seen}
              </div>
            )}

            <div className="reqGroup">
              <div className="reqGroupLabel">What you would do</div>
              {role.duties.map((r) => (
                <ReqRow key={r.text} req={r} completed={completed} onOpen={onOpen} />
              ))}
            </div>

            <div className="reqGroup">
              <div className="reqGroupLabel">What they ask for</div>
              {role.requirements.map((r) => (
                <ReqRow key={r.text} req={r} completed={completed} onOpen={onOpen} />
              ))}
            </div>

            <div className="block" style={{ marginTop: 12 }}>
              <div className="blockLabel">Show them this</div>
              <ul className="evidenceList">
                {role.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function RolesSection({
  completed,
  onOpen,
}: {
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
}) {
  return (
    <>
      <div className="sectionHead reveal">
        <div className="kicker">Real adverts</div>
        <h2>Am I ready to apply?</h2>
        <p className="sectionNote">
          Nine real adverts, all but one from Sri Lanka, broken into their individual lines and mapped to the lessons
          that cover each one. A requirements list stops being intimidating once you can read it as a checklist. Tap any
          lesson to open it.
        </p>
      </div>

      <div className="roleGrid">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} completed={completed} onOpen={onOpen} />
        ))}
      </div>

      <article className="marketCard glass reveal">
        <div className="marketTop">
          <span className="marketFlag" aria-hidden="true">◉</span>
          <div>
            <div className="marketTitle">The {marketNote.region} market</div>
            <div className="marketSource">
              {marketNote.source.href ? (
                <a href={marketNote.source.href} target="_blank" rel="noreferrer">
                  {marketNote.source.name} ↗
                </a>
              ) : (
                marketNote.source.name
              )}{' '}
              · {marketNote.source.seen}
            </div>
          </div>
        </div>
        <ul className="marketList">
          {marketNote.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </article>

      <div className="srsNote reveal" style={{ marginTop: 14 }}>
        <b>Adverts expire; the shape does not.</b> These are real listings, quoted from their sources and dated. A
        closed advert is still a reliable picture of what that kind of employer asks for.{' '}
        <b>Apply before you feel ready.</b> These lists describe an ideal candidate who does not exist. Around sixty
        percent coverage plus one piece of evidence you can link to puts you ahead of most of the queue — and stage 12
        exists specifically to close the practical gap those adverts name. The roles further down are years away on purpose —
        they show where each path leads, and how much of what a senior advert asks for is still stages 01, 02 and 04.
      </div>
    </>
  );
}

export function CompanionSection() {
  return (
    <>
      <div className="sectionHead reveal" style={{ marginTop: 40 }}>
        <div className="kicker">Watching something else too?</div>
        <h2>Course crossover</h2>
        <p className="sectionNote">
          Free courses people commonly work through alongside this one, mapped to the stages covering the same ground —
          so you are not studying the same week twice.
        </p>
      </div>

      {companions.map((c) => (
        <article className="companion glass reveal" key={c.name}>
          <div className="companionTop">
            <div>
              <div className="companionName">{c.name}</div>
              <div className="companionOrg">{c.org}</div>
            </div>
            <a className="link" href={c.href} target="_blank" rel="noreferrer">
              Open ↗
            </a>
          </div>
          <div className="companionNote">{c.note}</div>
          <div className="weekList">
            {c.map.map((w) => (
              <div className="week" key={w.week}>
                <div className="weekTop">
                  <span className="weekName">{w.week}</span>
                  <span className="weekStages">
                    {w.stages.map((s) => (
                      <span className="weekStage" key={s}>
                        {s}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="weekCovers">{w.covers}</div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}
