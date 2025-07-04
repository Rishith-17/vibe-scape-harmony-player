
const CACHE_NAME = 'vibescape-music-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Background audio state
let isAudioPlaying = false;
let currentTrack = null;
let playbackPosition = 0;

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
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'AUDIO_STATE_UPDATE':
      isAudioPlaying = data.isPlaying;
      currentTrack = data.currentTrack;
      playbackPosition = data.currentTime;
      console.log('Audio state updated:', { isAudioPlaying, track: currentTrack?.title });
      break;
      
    case 'KEEP_ALIVE':
      console.log('Keep alive signal received');
      // Respond with current audio state
      event.ports[0]?.postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        audioState: { isAudioPlaying, currentTrack, playbackPosition }
      });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'AUDIO_CONTROL':
      console.log('Audio control message:', data);
      // Forward to all clients
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'SW_AUDIO_CONTROL',
            action: data.action
          });
        });
      });
      break;
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
