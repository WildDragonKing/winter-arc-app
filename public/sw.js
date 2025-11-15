// Winter Arc PWA Service Worker
// Handles push notifications and offline support

// Installation: defer activation until explicit client message
self.addEventListener('install', (_event) => {
  console.warn('[SW] Installing Service Worker (waiting)...');
});

let BASE_URL = self.registration.scope; // default to scope

const ALLOWED_ORIGINS = new Set([self.location.origin]);

self.addEventListener('activate', (event) => {
  console.warn('[SW] Activating Service Worker...');
  event.waitUntil(clients.claim());
});

// Message-based control: allow page to trigger skipWaiting & update BASE_URL
self.addEventListener('message', (event) => {
  event.waitUntil((async () => {
    const { type, payload } = event.data || {};

    const source = event.source;
    let clientUrl = null;

    try {
      if (source && typeof source === 'object') {
        if ('url' in source && source.url) {
          clientUrl = source.url;
        } else if ('id' in source && source.id) {
          const resolvedClient = await clients.get(source.id);
          clientUrl = resolvedClient?.url ?? null;
        }
      }
    } catch (resolveError) {
      console.error('[SW] Failed to resolve message source client', resolveError);
    }

    if (!clientUrl) {
      console.warn('[SW] Ignoring message without resolvable client', { type });
      return;
    }

    let clientOrigin;
    try {
      clientOrigin = new URL(clientUrl).origin;
    } catch (urlError) {
      console.error('[SW] Invalid client URL received in message', { clientUrl, type, error: urlError });
      return;
    }

    if (!ALLOWED_ORIGINS.has(clientOrigin)) {
      console.warn('[SW] Blocking message from untrusted origin', { type, clientOrigin });
      return;
    }

    if (type === 'SW_ACTIVATE_NOW') {
      console.warn('[SW] Received SW_ACTIVATE_NOW, calling skipWaiting');
      await self.skipWaiting();
      return;
    }

    if (type === 'SW_SET_BASE_URL' && typeof payload === 'string') {
      try {
        const candidateUrl = new URL(payload, self.location.origin);
        if (!ALLOWED_ORIGINS.has(candidateUrl.origin)) {
          console.warn('[SW] Rejecting BASE_URL update from disallowed origin', {
            requested: candidateUrl.origin,
            clientOrigin,
          });
          return;
        }
        BASE_URL = candidateUrl.href;
        console.warn('[SW] BASE_URL updated to:', BASE_URL);
      } catch (setError) {
        console.error('[SW] Invalid BASE_URL payload ignored', { payload, error: setError });
      }
    }
  })());
});

// Push Notification Handler
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', function (event) {
  console.warn('[SW] Notification click received.');
  event.notification.close();
  const target = BASE_URL || 'https://app.winterarc.newrealm.de';
  event.waitUntil(clients.openWindow(target));
});

// Fetch Handler - Network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }))
    );
    return;
  }
  // Optional: could add cache-first for static assets here later
});
