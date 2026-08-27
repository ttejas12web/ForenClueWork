// ForenClue PWA Service Worker for Background Push Notifications
const SW_VERSION = '1.0.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event: Handles background notifications triggered when app is closed / on home screen
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: 'ForenClue Workspace',
        body: event.data.text()
      };
    }
  }

  const title = payload.title || 'ForenClue Notification';
  const notificationOptions = {
    body: payload.body || 'You have a new update in your ForenClue workspace.',
    icon: payload.icon || '/app-icon-192.png',
    badge: payload.badge || '/favicon.png',
    image: payload.image || undefined,
    tag: payload.tag || `forenclue-alert-${Date.now()}`,
    data: {
      url: payload.url || (payload.data && payload.data.url) || '/',
      timestamp: Date.now(),
      ...payload.data
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : false,
    actions: payload.actions || [
      { action: 'open', title: 'Open ForenClue' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Notification click event: navigates to target URL or focuses existing window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      })
      .catch((err) => {
        console.error('Failed to resubscribe push:', err);
      })
  );
});
