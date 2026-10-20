/* IconCraft AI service worker: offline app shell. Never touches cross-origin requests (Gemini, fonts) or /api/. */
const CACHE = 'iconcraft-v1';

async function precache() {
  const cache = await caches.open(CACHE);
  const scope = self.registration.scope;
  const res = await fetch(scope, { cache: 'reload' });
  if (!res.ok) return;
  const html = await res.clone().text();
  await cache.put(scope, res);
  const urls = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => new URL(m[1], scope).href);
  await Promise.all(urls.map((u) => cache.add(u).catch(() => undefined)));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precache().catch(() => undefined));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  if (req.mode === 'navigate') {
    // Network first so a new deploy shows up; fall back to the cached shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(self.registration.scope, copy));
          }
          return res;
        })
        .catch(() => caches.match(self.registration.scope).then((r) => r || Response.error())),
    );
    return;
  }

  // Static assets (hashed filenames): cache first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
