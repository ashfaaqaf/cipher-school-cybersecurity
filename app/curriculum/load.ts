'use client';

/**
 * On-demand access to the heavy half of the curriculum.
 *
 * The rule is that nothing here ever makes anyone wait if it can be avoided:
 * the modules are prefetched as soon as the browser reports itself idle, so by
 * the time a lesson is opened, a search is typed or a review is started, the
 * import resolves from memory. `useFull()` returns null only in the window
 * between first paint and that prefetch landing — a few hundred milliseconds on
 * a cold load, and never again for the life of the tab.
 */

import { useEffect, useState } from 'react';

export type Full = typeof import('./full');
export type Roles = typeof import('./roles');

let fullPromise: Promise<Full> | null = null;
let fullValue: Full | null = null;

export function loadFull(): Promise<Full> {
  if (!fullPromise) {
    fullPromise = import('./full').then((m) => {
      fullValue = m;
      return m;
    });
  }
  return fullPromise;
}

let rolesPromise: Promise<Roles> | null = null;

export function loadRoles(): Promise<Roles> {
  if (!rolesPromise) rolesPromise = import('./roles');
  return rolesPromise;
}

/** Whatever has already loaded, synchronously. Null before the first load. */
export function fullNow(): Full | null {
  return fullValue;
}

/**
 * Warm both modules once the main thread has nothing better to do. Called after
 * mount, so it never competes with first paint or hydration.
 */
export function prefetchCurriculum(): void {
  const warm = () => {
    void loadFull();
    void loadRoles();
    void loadPractice();
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback;
  if (idle) idle.call(window, warm, { timeout: 2500 });
  else window.setTimeout(warm, 1200);
}

let practicePromise: Promise<typeof import('./practice')> | null = null;
let practiceValue: typeof import('./practice') | null = null;

export function loadPractice(): Promise<typeof import('./practice')> {
  if (!practicePromise) {
    practicePromise = import('./practice').then((m) => {
      practiceValue = m;
      return m;
    });
  }
  return practicePromise;
}

/**
 * The exercises, for search. Returns null until the module lands, at which
 * point the corpus is rebuilt to include them — the results simply get better
 * a moment after the page does.
 */
export function usePractice(): Map<string, import('./practice').Exercise> | null {
  const [index, setIndex] = useState(practiceValue?.exerciseByLesson ?? null);
  useEffect(() => {
    if (index) return;
    let live = true;
    void loadPractice().then((m) => {
      if (live) setIndex(m.exerciseByLesson);
    });
    return () => {
      live = false;
    };
  }, [index]);
  return index;
}

/** Subscribe to the full curriculum; re-renders once when it arrives. */
export function useFull(): Full | null {
  const [full, setFull] = useState<Full | null>(fullValue);
  useEffect(() => {
    if (full) return;
    let live = true;
    void loadFull().then((m) => {
      if (live) setFull(m);
    });
    return () => {
      live = false;
    };
  }, [full]);
  return full;
}
