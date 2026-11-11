/* Built into dist/sw.js by scripts/build-service-worker.mjs.
   Only the shipped application shell is cached. Audio and map tiles are NEVER cached here. */
const CACHE_NAME = '__KASIVOICES_CACHE__';
const PRECACHE_ASSETS = __KASIVOICES_ASSETS__;

const scope = self.registration.scope;
const shellURL = new URL('index.html', scope).href;
const offlineURL = new URL('offline.html', scope).href;
const allowedURLs = new Set(PRECACHE_ASSETS.map((path) => new URL(path, scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...allowedURLs])),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith('kasivoices-shell-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match(shellURL);
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch {
        return (await caches.match(offlineURL)) || Response.error();
      }
    })());
    return;
  }

  // Strict allowlist means no recordings, dynamic API requests, or map tiles.
  if (!allowedURLs.has(url.href)) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
