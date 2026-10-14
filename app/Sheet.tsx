'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';

/** Where a flick at `v` px/ms comes to rest: Apple's projection from
 *  Designing Fluid Interfaces (scroll-view deceleration, rate 0.998). */
const project = (v: number, rate = 0.998) => (v * rate) / (1 - rate);

/** Past the top the sheet resists instead of stopping dead. */
const rubber = (x: number, h: number) => (1 - 1 / ((x * 0.55) / h + 1)) * h;

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // --sheet

type Props = {
  open: boolean;
  label: string;
  onClose: () => void;
  sheetRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

/**
 * Bottom sheet that follows the finger 1:1 from the grabber or header, throws
 * with the release velocity, springs back on a slow drag, and stays mounted
 * long enough to play its exit however it was closed.
 */
export function Sheet({ open, label, onClose, sheetRef, children }: Props) {
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);

  const scrimRef = useRef<HTMLDivElement>(null);
  const exiting = useRef<Promise<void> | null>(null);
  const drag = useRef<{ id: number; y0: number; offset: number; moved: boolean; onGrabber: boolean; samples: { y: number; t: number }[] } | null>(null);

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function exitByCss() {
    const sheet = sheetRef.current;
    if (!sheet) return Promise.resolve();
    sheet.classList.add('out');
    scrimRef.current?.classList.add('out');
    return new Promise<void>((done) => {
      sheet.addEventListener('animationend', () => done(), { once: true });
      setTimeout(done, 500); // never hang on a missed animationend
    });
  }

  function exitByThrow(from: number, velocity: number) {
    const sheet = sheetRef.current!;
    const h = sheet.offsetHeight;
    // Keep the finger's speed: time = distance left / release speed, inside UI budget.
    const duration = reduced() ? 0 : Math.min(300, Math.max(140, (h - from) / Math.max(velocity, 1.5)));
    const opacity = getComputedStyle(scrimRef.current!).opacity;
    scrimRef.current?.animate([{ opacity }, { opacity: 0 }], { duration, easing: EASE, fill: 'forwards' });
    return sheet
      .animate([{ translate: `0 ${from}px` }, { translate: `0 ${h}px` }], { duration, easing: EASE, fill: 'forwards' })
      .finished.then(() => undefined);
  }

  useEffect(() => {
    if (open || !shown) return;
    const run = exiting.current ?? exitByCss();
    run.then(() => {
      exiting.current = null;
      setShown(false);
    });
  }, [open, shown]); // eslint-disable-line react-hooks/exhaustive-deps

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as Element;
    if (exiting.current || !target.closest('.grabber, .sheetHead')) return;
    const sheet = sheetRef.current!;
    // Wide screens show a centred dialog with no grabber: nothing to drag there.
    if (getComputedStyle(sheet.querySelector('.grabber')!).display === 'none') return;
    // Grab it where it is, even mid-entrance or mid-settle: measure, cancel, pin.
    const before = sheet.getBoundingClientRect().top;
    sheet.getAnimations().forEach((a) => a.cancel());
    sheet.style.translate = '';
    const offset = before - sheet.getBoundingClientRect().top;
    sheet.style.translate = `0 ${offset}px`;
    drag.current = {
      id: e.pointerId,
      y0: e.clientY - offset,
      offset,
      moved: false,
      onGrabber: !!target.closest('.grabber'),
      samples: [{ y: e.clientY, t: e.timeStamp }],
    };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const raw = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(raw - d.offset) < 6) return; // hysteresis before claiming the gesture
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const h = e.currentTarget.offsetHeight;
    d.offset = raw < 0 ? -rubber(-raw, h) : raw;
    e.currentTarget.style.translate = `0 ${d.offset}px`;
    if (scrimRef.current) scrimRef.current.style.opacity = String(1 - Math.max(0, d.offset) / h);
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 100) d.samples.shift();
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const sheet = e.currentTarget;
    if (!d.moved) {
      sheet.style.translate = '';
      if (d.onGrabber) onClose(); // a tap on the grabber still closes
      return;
    }
    const first = d.samples[0];
    const velocity = e.timeStamp > first.t ? (e.clientY - first.y) / (e.timeStamp - first.t) : 0;
    // Decide from where the throw is going, not where the finger let go.
    if (d.offset + project(velocity) > sheet.offsetHeight / 2) {
      exiting.current = exitByThrow(d.offset, velocity);
      onClose();
      return;
    }
    const scrim = scrimRef.current;
    if (scrim) {
      const opacity = scrim.style.opacity || '1';
      scrim.style.opacity = '';
      scrim.animate([{ opacity }, { opacity: 1 }], { duration: reduced() ? 0 : 300, easing: EASE });
    }
    sheet.style.translate = '';
    sheet.animate([{ translate: `0 ${d.offset}px` }, { translate: '0 0' }], { duration: reduced() ? 0 : 300, easing: EASE });
  }

  if (!shown) return null;
  return (
    <>
      <div ref={scrimRef} className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="grabber">
          <i />
        </div>
        {children}
      </div>
    </>
  );
}
