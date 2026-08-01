// Cortestime Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notifications from a server (for production use)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Notificação Cortestime',
    body: 'Você tem uma nova atualização na sua barbearia.',
    icon: '/icon-192x192.png',
    badge: '/badge.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click (opens the application or focuses it)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle messages from the React app (for custom immediate triggers)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag } = event.data.payload;
    
    const options = {
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge.png',
      vibrate: [150, 100, 150],
      tag: tag || 'cortestime-alert',
      renotify: true
    };

    self.registration.showNotification(title, options);
  }
});
