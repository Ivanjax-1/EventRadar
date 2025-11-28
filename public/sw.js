// ===============================================
// 🔧 SERVICE WORKER - WEB PUSH NOTIFICATIONS
// ===============================================

const CACHE_NAME = 'eventradar-v1';

// ============================================
// INSTALL
// ============================================

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installing...');
  self.skipWaiting();
});

// ============================================
// ACTIVATE
// ============================================

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(clients.claim());
});

// ============================================
// PUSH EVENT (Recibir notificación)
// ============================================

self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);

  let notificationData = {
    title: 'EventRadar',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        tag: payload.tag || 'default',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// ============================================
// NOTIFICATION CLICK (Click en notificación)
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification);

  event.notification.close();

  const urlToOpen = event.notification.data?.eventId
    ? `/events/${event.notification.data.eventId}`
    : '/';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Verificar si ya hay una ventana abierta
    for (let client of windowClients) {
      if (client.url.includes(urlToOpen) && 'focus' in client) {
        return client.focus();
      }
    }

    // Si no, abrir nueva ventana
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// ============================================
// FETCH (Caché básico - opcional)
// ============================================

self.addEventListener('fetch', (event) => {
  // Solo cachear assets estáticos
  if (event.request.url.includes('/icons/') || 
      event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
