/// <reference lib="webworker" />

const CACHE_NAME = 'qrbag-v2';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
];

// ─── Install ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ─── Fetch strategy ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  const isImage = request.url.includes('/images/') || request.url.includes('/icons/') || request.url.includes('/items/');
  if (isImage) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Navigation requests: redirect to offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ════════════════════════════════════════════════════
// LABS — Push Notifications via BroadcastChannel
// ════════════════════════════════════════════════════
// The /suivi page broadcasts scan events via BroadcastChannel.
// The service worker listens and shows a native notification
// even if the user is on a different page or the app is in background.

const broadcastChannel = new BroadcastChannel('qrbag-tracking');

broadcastChannel.onmessage = (event) => {
  const { type, reference, message } = event.data || {};

  if (type === 'scan_detected') {
    self.registration.showNotification('📍 QRBag — Bagage scanné', {
      body: message || `Votre bagage ${reference} a été scanné.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `scan-${reference}`,
      data: { url: `/suivi/${reference}` },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });
  }

  if (type === 'baggage_found') {
    self.registration.showNotification('✅ QRBag — Bagage retrouvé !', {
      body: message || `Votre bagage ${reference} a été retrouvé. Contactez le trouveur.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `found-${reference}`,
      data: { url: `/suivi/${reference}` },
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
    });
  }

  if (type === 'country_mismatch') {
    self.registration.showNotification('🚨 QRBag — Alerte critique !', {
      body: message || `Anomalie de routage détectée pour ${reference}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: `alert-${reference}`,
      data: { url: `/suivi/${reference}` },
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
    });
  }
};

// ─── Notification click → open /suivi/[reference] ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      // If app is open but on different page, navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push event (for future server-side push with VAPID) ───
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      self.registration.showNotification(payload.title || '📍 QRBag', {
        body: payload.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: payload.tag || 'qrbag-notification',
        data: { url: payload.url || '/' },
        vibrate: [200, 100, 200],
      })
    );
  } catch {
    // Plain text push
    event.waitUntil(
      self.registration.showNotification('📍 QRBag', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});
