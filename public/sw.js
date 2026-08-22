/*
 * Development placeholder.
 *
 * The real service worker is generated into out/sw.js by scripts/make-sw.mjs
 * after each build, which overwrites this file. It exists only so that
 * `next dev` has something to serve at this path — without it, registration
 * 404s on every dev page load and fills the console with errors that look like
 * a bug but are not.
 *
 * Deliberately does nothing: no caching, no fetch handler, so dev never serves
 * a stale asset.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
