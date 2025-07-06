
const CACHE_NAME = 'vibescape-music-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.tsx'
];

// Enhanced background audio state for Chrome optimization
let isAudioPlaying = false;
let currentTrack = null;
let playbackPosition = 0;
let audioContextState = 'suspended';
let lastHeartbeat = Date.now();
let clientConnections = new Set();

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
  } else if (event.tag === 'mobile-background-audio') {
    event.waitUntil(handleMobileBackgroundAudio());
  } else if (event.tag === 'background-audio-chrome') {
    event.waitUntil(handleChromeBackgroundAudio());
  }
});

function handleBackgroundAudio() {
  // Handle background audio tasks and state persistence
  console.log('Background audio sync triggered');
}

function handleMobileBackgroundAudio() {
  // Mobile-specific background audio handling
  console.log('Mobile background audio sync triggered');
  
  return clients.matchAll({ type: 'window' }).then(clientList => {
    if (clientList.length > 0 && isAudioPlaying) {
      clientList[0].postMessage({
        type: 'MOBILE_BACKGROUND_SYNC',
        timestamp: Date.now()
      });
    }
  });
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

// Enhanced message handling for Chrome-optimized audio controls
self.addEventListener('message', (event) => {
  const { type, data, source } = event.data || {};
  
  // Track client connections for Chrome optimization
  if (source) {
    clientConnections.add(source);
  }
  
  switch (type) {
    case 'AUDIO_STATE_UPDATE':
      isAudioPlaying = data.isPlaying;
      currentTrack = data.currentTrack;
      playbackPosition = data.currentTime;
      audioContextState = data.audioContextState || 'suspended';
      lastHeartbeat = Date.now();
      
      // Chrome-specific: Maintain SW alive during playback
      if (isAudioPlaying) {
        maintainServiceWorkerAlive();
      }
      
      console.log('Chrome audio state updated:', { 
        isAudioPlaying, 
        track: currentTrack?.title,
        audioContextState 
      });
      break;
      
    case 'KEEP_ALIVE':
      lastHeartbeat = Date.now();
      console.log('Keep alive signal received - Chrome optimized');
      
      // Respond with comprehensive audio state for Chrome
      event.ports[0]?.postMessage({
        type: 'KEEP_ALIVE_RESPONSE',
        audioState: { 
          isAudioPlaying, 
          currentTrack, 
          playbackPosition,
          audioContextState,
          lastHeartbeat 
        }
      });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'AUDIO_CONTROL':
      console.log('Chrome audio control message:', data);
      
      // Optimized message forwarding for Chrome
      clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'SW_AUDIO_CONTROL',
            action: data.action,
            timestamp: Date.now()
          });
        });
      });
      break;
      
    case 'CLIENT_DISCONNECT':
      if (source) {
        clientConnections.delete(source);
      }
      break;
  }
});

// Chrome-specific: Maintain service worker alive during audio playback
function maintainServiceWorkerAlive() {
  if (isAudioPlaying) {
    // Send periodic heartbeats to prevent Chrome from killing SW
    setTimeout(() => {
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0 && isAudioPlaying) {
          clientList[0].postMessage({
            type: 'SW_HEARTBEAT',
            timestamp: Date.now()
          });
          maintainServiceWorkerAlive(); // Continue heartbeat
        }
      });
    }, 15000); // Every 15 seconds for Chrome stability
  }
}

// Chrome optimization: Enhanced background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio-chrome') {
    event.waitUntil(handleChromeBackgroundAudio());
  } else if (event.tag === 'mobile-background-audio') {
    event.waitUntil(handleMobileBackgroundAudio());
  }
});

function handleChromeBackgroundAudio() {
  console.log('Chrome background audio sync triggered');
  
  // Restore audio context state if needed
  return clients.matchAll({ type: 'window' }).then(clientList => {
    if (clientList.length > 0 && isAudioPlaying) {
      clientList[0].postMessage({
        type: 'RESTORE_AUDIO_CONTEXT',
        audioState: {
          isAudioPlaying,
          currentTrack,
          playbackPosition,
          audioContextState
        }
      });
    }
  });
}

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
