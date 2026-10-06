'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/*
 * The landing hero. Two identical character grids sit on top of each other:
 * the back one is ciphertext, the front one is the plaintext it "decrypts" to,
 * and only a soft spotlight of the front grid is visible. Moving the pointer
 * reads the page; left alone (or on a phone) the spotlight drifts by itself.
 */

const COLS = 340;
const ROWS = 56;
const GLYPHS = '0123456789abcdef0123456789ABCDEF+/=#%$&*<>{}[]';
const WORDS = [
  'least privilege', 'nmap -sV 10.0.0.0/24', 'tls 1.3 handshake', 'phishing triage', 'zero trust',
  'sha-256', 'mfa everywhere', 'incident response', 'threat model', 'siem alert', 'port 443',
  'patch tuesday', 'grep -i failed auth.log', 'defence in depth', 'cve-2024', 'dns sinkhole',
  'chain of custody', 'firewall rule', 'xss', 'sql injection', 'rbac', 'hash != encryption',
  'log everything', 'assume breach', 'whoami', 'osint', 'segmentation', 'backups tested',
];

/* Deterministic, so the server-rendered grid and the hydrated one match. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildField() {
  const rand = rng(7);
  const cipher: string[] = [];
  const plain: string[] = [];
  let w = 0;
  for (let r = 0; r < ROWS; r++) {
    let c = '';
    let p = '';
    while (p.length < COLS) {
      const word = WORDS[w++ % WORDS.length];
      p += word + '  ·  ';
    }
    p = p.slice(0, COLS);
    for (let i = 0; i < COLS; i++) c += p[i] === ' ' && rand() < 0.5 ? ' ' : GLYPHS[(rand() * GLYPHS.length) | 0];
    cipher.push(c);
    plain.push(p);
    w += 3; // offset each row so columns of words don't line up
  }
  return { cipher: cipher.join('\n'), plain: plain.join('\n') };
}

const FIELD = buildField();

/* ---------- headline that resolves out of noise ---------- */

function Decrypt({ text, delay }: { text: string; delay: number }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const reduce =
      document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const start = performance.now() + delay * 1000;
    const span = 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / span));
      const settled = Math.floor(p * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setShown(out);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);

  return (
    <>
      <span className="sr">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </>
  );
}

/* ---------- stat arcs ---------- */

const CX = -110;
const CY = 300;
const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (r: number, deg: number) => ({ x: CX + r * Math.cos(rad(deg)), y: CY + r * Math.sin(rad(deg)) });

type Stat = { value: string; suffix?: string; label: string };

function Arcs({ stats }: { stats: Stat[] }) {
  const arcs = [
    { r: 330, from: -92, to: 16, dot: -46 },
    { r: 395, from: -56, to: 60, dot: 2 },
    { r: 460, from: -14, to: 72, dot: 44 },
  ];
  return (
    <svg className="cineArcs" viewBox="0 0 380 700" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
      <defs>
        {arcs.map((arc, i) => {
          const a = polar(arc.r, arc.from);
          const b = polar(arc.r, arc.to);
          return (
            <linearGradient key={i} id={`cineArc${i}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="22%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="55%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="85%" stopColor="currentColor" stopOpacity="0.1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          );
        })}
      </defs>
      {arcs.map((arc, i) => {
        const stat = stats[i];
        const a = polar(arc.r, arc.from);
        const b = polar(arc.r, arc.to);
        const dot = polar(arc.r, arc.dot);
        const line = 0.5 + i * 0.22;
        const mark = line + 0.9;
        return (
          <g key={i}>
            <path
              className="arcLine"
              d={`M ${a.x} ${a.y} A ${arc.r} ${arc.r} 0 0 1 ${b.x} ${b.y}`}
              stroke={`url(#cineArc${i})`}
              style={{ '--len': arc.r * rad(arc.to - arc.from), '--d': `${line}s` } as CSSProperties}
            />
            <circle className="arcRing" cx={dot.x} cy={dot.y} r="7" style={{ '--d': `${mark + 0.3}s` } as CSSProperties} />
            <circle className="arcDot" cx={dot.x} cy={dot.y} r="3.4" style={{ '--d': `${mark}s` } as CSSProperties} />
            <text className="arcNum" x={dot.x + 16} y={dot.y + 4} style={{ '--d': `${mark + 0.15}s` } as CSSProperties}>
              {stat.value}
              {stat.suffix && <tspan dy="-10">{stat.suffix}</tspan>}
            </text>
            <text className="arcLabel" x={dot.x + 18} y={dot.y + 22} style={{ '--d': `${mark + 0.3}s` } as CSSProperties}>
              {stat.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- hero ---------- */

type Props = {
  started: boolean;
  next: { stage: string; title: string; mins: number };
  lessons: number;
  terms: number;
  hours: number;
  onStart: () => void;
  onSkillCheck: () => void;
};

export function Hero({ started, next, lessons, terms, hours, onStart, onSkillCheck }: Props) {
  const heroRef = useRef<HTMLElement | null>(null);
  const patternRef = useRef<SVGPatternElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const plainRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const pattern = patternRef.current;
    const field = fieldRef.current;
    const plain = plainRef.current;
    if (!hero || !pattern || !field || !plain) return;

    const root = document.documentElement;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const still = () => root.dataset.motion === 'reduce' || motionQuery.matches;

    const pointer = { x: 0, y: 0, at: -Infinity };
    const spot = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    let raf = 0;
    let visible = true;
    let primed = false;

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.at = performance.now();
    };

    const frame = (now: number) => {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      /* Follow the pointer while it is active; otherwise drift on a slow
         figure-eight across the right half, away from the headline. */
      const idle = now - pointer.at > 2600;
      const t = now / 1000;
      const tx = idle ? w * (0.66 + 0.2 * Math.sin(t * 0.37)) : pointer.x;
      const ty = idle ? h * (0.42 + 0.24 * Math.sin(t * 0.53 + 1)) : pointer.y;
      if (!primed) {
        spot.x = tx;
        spot.y = ty;
        primed = true;
      }
      const k = idle ? 0.035 : 0.1;
      spot.x += (tx - spot.x) * k;
      spot.y += (ty - spot.y) * k;

      const nx = idle ? 0 : pointer.x / w - 0.5;
      const ny = idle ? 0 : pointer.y / h - 0.5;
      tilt.x += (nx * 16 - tilt.x) * 0.06;
      tilt.y += (ny * 16 - tilt.y) * 0.06;

      pattern.setAttribute('x', tilt.x.toFixed(2));
      pattern.setAttribute('y', tilt.y.toFixed(2));
      /* The text field leans the other way, so the two planes separate. */
      const fx = -tilt.x * 0.8;
      const fy = -tilt.y * 0.8;
      field.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0)`;
      plain.style.setProperty('--mx', `${(spot.x - fx).toFixed(1)}px`);
      plain.style.setProperty('--my', `${(spot.y - fy).toFixed(1)}px`);

      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const start = () => {
      if (!raf && visible && !still()) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* No work at all while the hero is scrolled away. */
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(hero);

    const onMotion = () => (still() ? stop() : start());
    motionQuery.addEventListener('change', onMotion);
    const mo = new MutationObserver(onMotion);
    mo.observe(root, { attributes: true, attributeFilter: ['data-motion'] });

    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerdown', onMove, { passive: true });
    start();

    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
      motionQuery.removeEventListener('change', onMotion);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerdown', onMove);
    };
  }, []);

  const stats: Stat[] = [
    { value: String(lessons), label: 'WRITTEN LESSONS' },
    { value: String(terms), label: 'GLOSSARY' },
    { value: String(hours), suffix: 'h', label: 'OF PRACTICE' },
  ];

  return (
    <section className="cine" ref={heroRef} aria-labelledby="cine-title">
      <svg className="cineGrid" aria-hidden="true">
        <defs>
          <pattern ref={patternRef} id="cineGrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cineGrid)" />
      </svg>

      <div className="cineZoom" aria-hidden="true">
        <div className="cineField" ref={fieldRef}>
          <pre className="cineCipher">{FIELD.cipher}</pre>
          <pre className="cinePlain" ref={plainRef}>
            {FIELD.plain}
          </pre>
        </div>
      </div>
      <div className="cineScan" aria-hidden="true" />
      <div className="cineShade" aria-hidden="true" />

      <Arcs stats={stats} />

      <div className="cineInner">
        <div className="cineCopy">
          <p className="cineEyebrow rise" style={{ '--d': '.15s' } as CSSProperties}>
            <i aria-hidden="true" /> Evidence-first cyber training
          </p>
          <h1 id="cine-title" className="rise" style={{ '--d': '.3s' } as CSSProperties}>
            Learn cybersecurity.
            <em>
              <Decrypt text="Build proof you can do the work." delay={0.7} />
            </em>
          </h1>
          <p className="cineLede rise" style={{ '--d': '.5s' } as CSSProperties}>
            Start at zero, learn each idea in plain language, retrieve it from memory, investigate real artefacts and
            leave with evidence you can take to an interview.
          </p>

          <ul className="cineStats rise" style={{ '--d': '.6s' } as CSSProperties} aria-label="Course size">
            {stats.map((s) => (
              <li key={s.label}>
                <b>
                  {s.value}
                  {s.suffix}
                </b>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="cineActions rise" style={{ '--d': '.7s' } as CSSProperties}>
            <button className="cineCta" onClick={onStart}>
              <span>{started ? 'Continue learning' : 'Start with stage 00'}</span>
              <span aria-hidden="true">→</span>
              <i className="cineShine" aria-hidden="true" />
            </button>
            <button className="cineGhost" onClick={onSkillCheck}>
              Take the skill check
            </button>
          </div>

          <p className="cineNext rise" style={{ '--d': '.85s' } as CSSProperties}>
            <span aria-hidden="true">$</span> next_mission <span aria-hidden="true">→</span> stage {next.stage} ·{' '}
            <b>{next.title}</b> · {next.mins} min
          </p>
        </div>
      </div>
    </section>
  );
}
