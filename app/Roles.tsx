'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { allLessons } from './curriculum';
import { companions, marketNote, roleLessons, roles, type Requirement, type Role } from './curriculum/roles';

/** Find a lesson by id so a requirement can link straight into the reader. */
const byId = new Map(allLessons.map(({ lesson, stage }) => [lesson.id, { lesson, stage }]));
const internshipRole = roles.find((role) => role.id === 'vapt-intern')!;
const TOOL_LAB_STORE = 'cipher-school-tool-labs';

const toolLabs = [
  {
    id: 'burp',
    name: 'Burp Suite',
    lessonId: '12-2',
    target: 'PortSwigger Web Security Academy',
    tasks: [
      'Open Burp\'s built-in browser and load a Web Security Academy lab.',
      'Turn Intercept on, capture one request, then forward it.',
      'Send the request to Repeater and change one safe input.',
      'Compare both responses and write down what changed.',
      'Save a screenshot and a five-line finding for your proof folder.',
    ],
  },
  {
    id: 'zap',
    name: 'OWASP ZAP',
    lessonId: '12-3',
    target: 'A local OWASP Juice Shop or WebGoat lab',
    tasks: [
      'Start a legal local target and open it through ZAP\'s browser.',
      'Browse the target normally so ZAP can perform passive checks.',
      'Choose one alert and read its risk, confidence and evidence.',
      'Check the alert by hand before deciding whether it is real.',
      'Export the report and explain one useful alert or false positive.',
    ],
  },
  {
    id: 'nmap',
    name: 'Nmap',
    lessonId: '12-4',
    target: 'A machine you own inside an isolated lab network',
    tasks: [
      'Write down the authorised target IP before scanning anything.',
      'Confirm the target is reachable inside the lab.',
      'Run service detection with nmap -sV <lab-IP>.',
      'Label every open port with its service, version and likely purpose.',
      'Save the scan and add one sensible next check for each service.',
    ],
  },
] as const;
const toolLabTaskIds = new Set(toolLabs.flatMap((lab) => lab.tasks.map((_, index) => `${lab.id}-${index}`)));

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
              <b>Role summary: </b>
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

function JobAdSprint({
  completed,
  onOpen,
  onMissions,
}: {
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
  onMissions: () => void;
}) {
  const skills = internshipRole.requirements.filter((requirement) => requirement.lessons.length > 0);
  const lessonIds = [...new Set(skills.flatMap((skill) => skill.lessons))];
  const done = lessonIds.filter((id) => completed.has(id)).length;
  const nextLesson = lessonIds.find((id) => !completed.has(id));
  const percentage = Math.round((done / lessonIds.length) * 100);

  return (
    <article className="jobSprint reveal" style={{ '--hue': String(internshipRole.hue) } as CSSProperties}>
      <div className="jobSprintHead">
        <div>
          <div className="kicker">From your advert</div>
          <h3>Internship skill sprint</h3>
          <p>Four requirements, mapped to lessons you can read, practise and prove inside Cipher School.</p>
        </div>
        <div className="jobSprintScore" aria-label={`${done} of ${lessonIds.length} lessons complete`}>
          <strong>{percentage}%</strong>
          <span>{done}/{lessonIds.length} lessons</span>
        </div>
      </div>

      <div className="jobSprintBar" aria-hidden="true"><i style={{ width: `${percentage}%` }} /></div>

      <div className="jobSprintGrid">
        {skills.map((skill, index) => {
          const skillDone = skill.lessons.filter((id) => completed.has(id)).length;
          return (
            <section className="jobSkill" key={skill.text}>
              <div className="jobSkillTop">
                <span>0{index + 1}</span>
                <small>{skillDone}/{skill.lessons.length}</small>
              </div>
              <h4>{skill.text}</h4>
              <p>{skill.means}</p>
              <div className="jobSkillLessons">
                {skill.lessons.map((id) => {
                  const entry = byId.get(id);
                  if (!entry) return null;
                  return (
                    <button key={id} className={completed.has(id) ? 'done' : ''} onClick={() => onOpen(id)}>
                      {completed.has(id) ? '✓' : id} {entry.lesson.title}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="jobSprintFinish">
        <div>
          <span className="kicker">Proof target</span>
          <p>Finish the lessons, pass a scored investigation, then produce a web finding and an annotated Nmap scan from a legal lab.</p>
        </div>
        <div className="jobSprintActions">
          {nextLesson ? (
            <button className="btn primary" onClick={() => onOpen(nextLesson)}>Open next lesson</button>
          ) : (
            <button className="btn done" disabled>Lessons complete ✓</button>
          )}
          <button className="btn ghost" onClick={onMissions}>Practise a case</button>
        </div>
      </div>
    </article>
  );
}

function ToolLabChecklist({ onOpen }: { onOpen: (lessonId: string) => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TOOL_LAB_STORE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setChecked(new Set(parsed.filter((id) => typeof id === 'string' && toolLabTaskIds.has(id))));
      }
    } catch {
      /* A blocked or damaged store starts with a clean checklist. */
    }
  }, []);

  const total = toolLabs.reduce((sum, lab) => sum + lab.tasks.length, 0);
  const done = checked.size;
  const percentage = Math.round((done / total) * 100);

  const toggleTask = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(TOOL_LAB_STORE, JSON.stringify([...next]));
      } catch {
        /* The checklist remains usable for this session. */
      }
      return next;
    });
  };

  return (
    <article className="toolLabs reveal">
      <div className="toolLabsHead">
        <div>
          <div className="kicker">Tool practice</div>
          <h3>Burp, ZAP and Nmap lab checklist</h3>
          <p>Use only the named training sites or systems you own. Each checklist ends with evidence you can keep.</p>
        </div>
        <div className="toolLabsScore" aria-label={`${done} of ${total} lab tasks complete`}>
          <strong>{percentage}%</strong>
          <span>{done}/{total} tasks</span>
        </div>
      </div>

      <div className="toolLabsBar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <i style={{ width: `${percentage}%` }} />
      </div>

      <div className="toolLabGrid">
        {toolLabs.map((lab, labIndex) => {
          const labDone = lab.tasks.filter((_, taskIndex) => checked.has(`${lab.id}-${taskIndex}`)).length;
          return (
            <section className="toolLab" key={lab.id}>
              <div className="toolLabTop">
                <span>0{labIndex + 1}</span>
                <small>{labDone}/{lab.tasks.length}</small>
              </div>
              <h4>{lab.name}</h4>
              <p className="toolLabTarget"><b>Legal target:</b> {lab.target}</p>
              <div className="toolLabTasks">
                {lab.tasks.map((task, taskIndex) => {
                  const id = `${lab.id}-${taskIndex}`;
                  return (
                    <label className={checked.has(id) ? 'checked' : ''} key={id}>
                      <input type="checkbox" checked={checked.has(id)} onChange={() => toggleTask(id)} />
                      <span aria-hidden="true">{checked.has(id) ? '✓' : taskIndex + 1}</span>
                      <em>{task}</em>
                    </label>
                  );
                })}
              </div>
              <button className="toolLabLesson" onClick={() => onOpen(lab.lessonId)}>Open {lab.name} lesson</button>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function RolesSection({
  completed,
  onOpen,
  onMissions,
}: {
  completed: Set<string>;
  onOpen: (lessonId: string) => void;
  onMissions: () => void;
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

      <JobAdSprint completed={completed} onOpen={onOpen} onMissions={onMissions} />

      <ToolLabChecklist onOpen={onOpen} />

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
        percent coverage plus one piece of evidence you can link to puts you ahead of most of the queue, and stage 12
        exists specifically to close the practical gap those adverts name. The roles further down are years away on purpose.
        They show where each path leads, and how much of what a senior advert asks for is still stages 01, 02 and 04.
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
          Free courses people commonly work through alongside this one, mapped to the stages covering the same ground.
          This keeps you from studying the same material twice.
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
