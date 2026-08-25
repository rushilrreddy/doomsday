const CACHE_NAME = 'crew-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: cache static shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for Next.js static, network-first for pages ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and supabase/api calls
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Next.js static chunks — cache first (they're content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // HTML pages — network first, fall back to cached shell
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/') )
    );
    return;
  }

  // Everything else — network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Push: show notification ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'DOOMSDAY', body: event.data.text() }; }

  const { title = 'DOOMSDAY', body = '', icon = '/icons/icon-192.png', badge = '/icons/icon-192.png', url = '/' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [100, 50, 100],
      tag: 'crew-notification',
      renotify: true,
    })
  );
});

// ── Notification click: focus/open the app ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
