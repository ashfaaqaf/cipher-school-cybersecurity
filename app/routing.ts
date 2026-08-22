/**
 * URL state.
 *
 * The app had none: every view and every lesson lived at the same address, so
 * a lesson could not be bookmarked, shared, or reached with the back button.
 * For something meant to be studied over months, that is a real omission —
 * "the one about SSRF" should be a link you can send someone.
 *
 * Hash routing rather than paths, because this is a static export on GitHub
 * Pages: a real path would 404 on refresh unless every lesson got its own
 * prerendered page, which is a lot of build output for a single-page app.
 */

export type View = 'learn' | 'review' | 'paths' | 'words' | 'sources';

export const VIEWS: View[] = ['learn', 'review', 'paths', 'words', 'sources'];

export type Route = { view: View; lessonId: string | null };

export const DEFAULT_ROUTE: Route = { view: 'learn', lessonId: null };

/** Lesson ids look like "05-2" or "12-11". Anything else is not one. */
const LESSON_ID = /^\d{2}-\d{1,2}$/;

export function isLessonId(value: string): boolean {
  return LESSON_ID.test(value);
}

/**
 * Read a route out of a location hash. Unknown input falls back to the default
 * rather than throwing — a hand-edited URL should land somewhere sensible.
 */
export function parseHash(hash: string): Route {
  const raw = decodeURIComponent((hash || '').replace(/^#\/?/, '')).trim();
  if (!raw) return DEFAULT_ROUTE;

  const parts = raw.split('/').filter(Boolean);

  if (parts[0] === 'lesson') {
    const id = parts[1] ?? '';
    return isLessonId(id) ? { view: 'learn', lessonId: id } : DEFAULT_ROUTE;
  }

  const view = parts[0]?.toLowerCase();
  if (view && (VIEWS as string[]).includes(view)) {
    return { view: view as View, lessonId: null };
  }

  return DEFAULT_ROUTE;
}

/** The hash a given state should produce. Learn with no lesson is the bare page. */
export function hashFor(route: Route): string {
  if (route.lessonId) return `#/lesson/${route.lessonId}`;
  if (route.view === 'learn') return '';
  return `#/${route.view}`;
}

/** True when two routes would produce the same URL, so history is not spammed. */
export function sameRoute(a: Route, b: Route): boolean {
  return a.view === b.view && a.lessonId === b.lessonId;
}
