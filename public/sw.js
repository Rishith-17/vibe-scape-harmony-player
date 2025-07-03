
const CACHE_NAME = 'music-player-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Enhanced background sync for audio
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio') {
    event.waitUntil(handleBackgroundAudio());
  }
});

function handleBackgroundAudio() {
  // Handle background audio tasks and state persistence
  console.log('Background audio sync triggered');
}

// Handle push notifications for media controls
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'music-notification',
      requireInteraction: false,
      silent: true,
      actions: [
        { action: 'play', title: 'Play' },
        { action: 'pause', title: 'Pause' },
        { action: 'next', title: 'Next' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification interactions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'play' || event.action === 'pause' || event.action === 'next') {
    // Send message to main app for media control
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            action: event.action,
            type: 'MEDIA_CONTROL'
          });
          return clientList[0].focus();
        } else {
          return clients.openWindow('/');
        }
      })
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Enhanced message handling for audio controls and state persistence
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUDIO_CONTROL') {
    // Handle audio control messages from main thread
    console.log('Audio control message:', event.data);
  } else if (event.data && event.data.type === 'KEEP_ALIVE') {
    // Keep service worker alive for background playback
    console.log('Keep alive signal received');
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Keep service worker active during audio playback
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
