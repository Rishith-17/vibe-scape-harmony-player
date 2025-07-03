import MobileAudioService from '@/services/MobileAudioService';

interface BackgroundAudioState {
  currentTrack: any;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlist: any[];
  currentIndex: number;
  volume: number;
  timestamp: number;
}

class BackgroundAudioManager {
  private static instance: BackgroundAudioManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private mobileAudioService: MobileAudioService;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private lastInteractionTime: number = Date.now();

  private constructor() {
    this.mobileAudioService = MobileAudioService.getInstance();
    this.initializeServiceWorker();
    this.setupUserActivityTracking();
  }

  static getInstance(): BackgroundAudioManager {
    if (!BackgroundAudioManager.instance) {
      BackgroundAudioManager.instance = new BackgroundAudioManager();
    }
    return BackgroundAudioManager.instance;
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for background playback');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'MEDIA_CONTROL') {
            this.handleServiceWorkerMediaControl(event.data.action);
          }
        });

        // Keep service worker alive during audio playback
        this.startKeepAlive();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupUserActivityTracking() {
    const updateLastInteraction = () => {
      this.lastInteractionTime = Date.now();
    };

    // Track various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateLastInteraction, { passive: true });
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App moved to background - maintaining audio');
        this.handleBackgroundMode(true);
      } else {
        console.log('App returned to foreground - syncing state');
        this.handleBackgroundMode(false);
        this.syncStateWithUI();
      }
    });

    // Handle before unload for state persistence
    window.addEventListener('beforeunload', () => {
      this.saveCompleteState();
    });
  }

  private startKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'KEEP_ALIVE',
          timestamp: Date.now()
        });
      }
    }, 25000); // Send keep alive every 25 seconds
  }

  private handleServiceWorkerMediaControl(action: string) {
    // Route service worker media commands to the mobile audio service
    switch (action) {
      case 'play':
      case 'pause':
        this.mobileAudioService.onTogglePlay?.();
        break;
      case 'next':
        this.mobileAudioService.onNext?.();
        break;
      case 'previous':
        this.mobileAudioService.onPrevious?.();
        break;
    }
  }

  private handleBackgroundMode(isBackground: boolean) {
    if (isBackground) {
      // Optimize for background mode
      this.startKeepAlive();
      this.saveCompleteState();
      
      // Send audio control info to service worker
      if (this.serviceWorkerRegistration?.active) {
        const state = this.mobileAudioService.getPlaybackState();
        this.serviceWorkerRegistration.active.postMessage({
          type: 'AUDIO_CONTROL',
          state: state,
          action: 'background_mode'
        });
      }
    } else {
      // Returning to foreground - sync state
      this.restoreStateIfNeeded();
    }
  }

  private saveCompleteState() {
    try {
      const state = this.mobileAudioService.getPlaybackState();
      const completeState: BackgroundAudioState = {
        ...state,
        timestamp: Date.now()
      };
      
      // Save to multiple storage mechanisms for reliability
      localStorage.setItem('vibescape_complete_state', JSON.stringify(completeState));
      
      // Also save to IndexedDB for larger data persistence
      this.saveToIndexedDB(completeState);
    } catch (error) {
      console.error('Failed to save complete audio state:', error);
    }
  }

  private async saveToIndexedDB(state: BackgroundAudioState) {
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.open('VibescapeAudio', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('playbackState')) {
            db.createObjectStore('playbackState', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['playbackState'], 'readwrite');
          const store = transaction.objectStore('playbackState');
          store.put({ id: 'current', ...state });
        };
      }
    } catch (error) {
      console.error('IndexedDB save failed:', error);
    }
  }

  private restoreStateIfNeeded() {
    try {
      const savedState = localStorage.getItem('vibescape_complete_state');
      if (savedState) {
        const state: BackgroundAudioState = JSON.parse(savedState);
        
        // Only restore if state is recent (within 2 hours)
        if (Date.now() - state.timestamp < 2 * 60 * 60 * 1000) {
          console.log('Restoring background audio state');
          // State restoration will be handled by the mobile audio service
        }
      }
    } catch (error) {
      console.error('Failed to restore background audio state:', error);
    }
  }

  private syncStateWithUI() {
    // Force UI to sync with current audio state
    setTimeout(() => {
      if (this.mobileAudioService.getPlaybackState().currentTrack) {
        // Trigger a state update to sync UI
        const state = this.mobileAudioService.getPlaybackState();
        console.log('Syncing UI with background state:', state.currentTrack?.title);
      }
    }, 100);
  }

  // Public methods for integration
  public enableBackgroundMode() {
    console.log('Background audio mode enabled');
    if ('wakeLock' in navigator) {
      // Request screen wake lock during playback
      this.requestWakeLock();
    }
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Screen wake lock acquired for audio playback');
        
        wakeLock.addEventListener('release', () => {
          console.log('Screen wake lock released');
        });
      }
    } catch (error) {
      console.log('Wake lock not available:', error);
    }
  }

  public destroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.saveCompleteState();
  }
}

export default BackgroundAudioManager;
