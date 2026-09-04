// Siklus hidup PWA Service Worker diperbarui untuk mencegah caching agresif yang tertahan
self.addEventListener('install', function(event) {
  // Aktifkan service worker baru seketika tanpa menunggu tab ditutup
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Bersihkan semua cache lama untuk mencegah caching agresif yang tertahan
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Ambil alih kontrol klien (tabs) secara langsung
      return self.clients.claim();
    })
  );
});

self.addEventListener('push', function(event) {
  let data = { title: 'Notifikasi Pekerjaan', body: 'Ada pembaruan tugas baru.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notifikasi Pekerjaan', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      const targetUrl = event.notification.data.url;
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
