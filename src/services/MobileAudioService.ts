
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    MusicControls: any;
  }
}

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

class MobileAudioService {
  private static instance: MobileAudioService;
  private isInitialized = false;
  private currentTrack: Track | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private volume = 80;
  private playlist: Track[] = [];
  private currentIndex = 0;

  static getInstance(): MobileAudioService {
    if (!MobileAudioService.instance) {
      MobileAudioService.instance = new MobileAudioService();
    }
    return MobileAudioService.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Restore previous playback state
      this.restorePlaybackState();

      if (!Capacitor.isNativePlatform()) {
        console.log('Running in web mode - background playback enabled');
        this.setupWebBackgroundPlaybook();
        this.isInitialized = true;
        return;
      }

      // For native platforms, we would initialize plugins here
      // But for now, we'll focus on web functionality
      console.log('Native platform detected but plugins not configured');
      
      this.isInitialized = true;
      console.log('Mobile audio service initialized');
    } catch (error) {
      console.error('Failed to initialize mobile audio service:', error);
      this.isInitialized = true;
    }
  }

  async updateNowPlaying(track: Track, isPlaying: boolean, currentTime = 0, duration = 0, playlist: Track[] = [], currentIndex = 0) {
    this.currentTrack = track;
    this.isPlaying = isPlaying;
    this.currentTime = currentTime;
    this.duration = duration;
    this.playlist = playlist;
    this.currentIndex = currentIndex;

    // Save state to localStorage for persistence
    this.savePlaybackState();

    if (!Capacitor.isNativePlatform()) {
      // Web PWA - Update document title and media session
      this.updateWebMediaSession(track, isPlaying, currentTime, duration);
      return;
    }

    // Native platform updates would go here when plugins are properly configured
    console.log('Native platform - media controls would be updated here');
  }

  private updateWebMediaSession(track: Track, isPlaying: boolean, currentTime: number, duration: number) {
    if ('mediaSession' in navigator) {
      // Update metadata with high-quality artwork
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channelTitle,
        album: 'Vibe Scape Harmony',
        artwork: [
          { src: track.thumbnail.replace('mqdefault', 'maxresdefault'), sizes: '96x96', type: 'image/jpeg' },
          { src: track.thumbnail.replace('mqdefault', 'hqdefault'), sizes: '128x128', type: 'image/jpeg' },
          { src: track.thumbnail.replace('mqdefault', 'sddefault'), sizes: '192x192', type: 'image/jpeg' },
          { src: track.thumbnail.replace('mqdefault', 'hqdefault'), sizes: '256x256', type: 'image/jpeg' },
          { src: track.thumbnail.replace('mqdefault', 'maxresdefault'), sizes: '384x384', type: 'image/jpeg' },
          { src: track.thumbnail.replace('mqdefault', 'maxresdefault'), sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      // Update position state for scrubbing
      if (duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: Math.min(currentTime, duration)
          });
        } catch (error) {
          console.warn('Position state not supported:', error);
        }
      }

      // Update playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Set action handlers with error handling
      this.setupMediaSessionHandlers();
    }

    // Update document title for better UX
    document.title = isPlaying 
      ? `♪ ${track.title} - ${track.channelTitle} | Vibe Scape` 
      : `⏸ ${track.title} - ${track.channelTitle} | Vibe Scape`;

    // Update favicon to show playing state
    this.updateFavicon(isPlaying);
  }

  private setupMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
      // Set up action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Media session: play');
        this.onTogglePlay?.();
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Media session: pause');
        this.onTogglePlay?.();
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media session: previous');
        this.onPrevious?.();
      });
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media session: next');
        this.onNext?.();
      });

      // Enhanced seek handling
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        console.log('Media session: seek to', details.seekTime);
        if (details.seekTime !== undefined && this.onSeek) {
          this.onSeek(details.seekTime);
        }
      });

      // Additional controls for better mobile support
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        const newTime = Math.max(0, this.currentTime - skipTime);
        if (this.onSeek) {
          this.onSeek(newTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        const newTime = Math.min(this.duration, this.currentTime + skipTime);
        if (this.onSeek) {
          this.onSeek(newTime);
        }
      });
    }
  }

  private updateFavicon(isPlaying: boolean) {
    try {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      // Create canvas for dynamic favicon
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw base favicon (music note)
        ctx.fillStyle = isPlaying ? '#10b981' : '#6b7280';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('♪', 16, 24);
        
        // Add play/pause indicator
        if (isPlaying) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(24, 8, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        link.href = canvas.toDataURL();
      }
    } catch (error) {
      console.warn('Favicon update failed:', error);
    }
  }

  async enableBackgroundMode() {
    if (!Capacitor.isNativePlatform()) return;
    console.log('Background mode would be enabled for native platform');
  }

  async disableBackgroundMode() {
    if (!Capacitor.isNativePlatform()) return;
    console.log('Background mode would be disabled for native platform');
  }

  savePlaybackState() {
    try {
      const state = {
        currentTrack: this.currentTrack,
        isPlaying: this.isPlaying,
        currentTime: this.currentTime,
        duration: this.duration,
        volume: this.volume,
        playlist: this.playlist,
        currentIndex: this.currentIndex,
        timestamp: Date.now()
      };
      localStorage.setItem('vibescape_playback_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save playback state:', error);
    }
  }

  private restorePlaybackState() {
    try {
      const savedState = localStorage.getItem('vibescape_playback_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Only restore if state is recent (within 24 hours)
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          this.currentTrack = state.currentTrack;
          this.isPlaying = false; // Don't auto-resume to respect autoplay policies
          this.currentTime = state.currentTime || 0;
          this.duration = state.duration || 0;
          this.volume = state.volume || 80;
          this.playlist = state.playlist || [];
          this.currentIndex = state.currentIndex || 0;
          
          console.log('Playback state restored:', state.currentTrack?.title);
        }
      }
    } catch (error) {
      console.error('Failed to restore playback state:', error);
    }
  }

  private setupWebBackgroundPlaybook() {
    // Enhanced service worker setup for mobile browsers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered for mobile background audio');
        
        // Enhanced message handling for mobile browsers
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, action, timestamp } = event.data || {};
          
          switch (type) {
            case 'SW_AUDIO_CONTROL':
              this.handleServiceWorkerControl(action);
              break;
            case 'SW_HEARTBEAT':
              this.handleHeartbeat();
              break;
            case 'RESTORE_AUDIO_CONTEXT':
              this.handleAudioContextRestore(event.data.audioState);
              break;
            case 'MOBILE_BACKGROUND_SYNC':
              this.handleMobileBackgroundSync();
              break;
          }
        });
        
        // Register for mobile background sync
        try {
          if ('sync' in registration) {
            (registration as any).sync?.register('mobile-background-audio');
          }
        } catch (error) {
          console.log('Background sync not available:', error);
        }
        
        // Mobile-specific: Request persistent notification permission
        this.requestNotificationPermission();
      }).catch(console.error);
    }

    // Enhanced mobile page visibility handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Mobile app backgrounded - maintaining audio playback');
        this.savePlaybackState();
        this.notifyServiceWorkerAudioState();
        this.enableMobileBackgroundMode();
        
        // Mobile-specific: Keep audio context alive
        this.maintainMobileAudioContext();
      } else {
        console.log('Mobile app foregrounded - syncing state');
        this.disableMobileBackgroundMode();
        this.syncStateFromBackground();
        this.resumeMobileAudioContext();
        
        if (this.currentTrack) {
          this.updateWebMediaSession(this.currentTrack, this.isPlaying, this.currentTime, this.duration);
        }
      }
    });

    // Enhanced beforeunload handling
    window.addEventListener('beforeunload', () => {
      this.savePlaybackState();
      this.notifyServiceWorkerAudioState();
    });

    // Mobile-optimized wake lock and audio context
    this.setupMobileWakeLock();
    this.setupMobileAudioContextManagement();
    this.setupMobileBackgroundPlayback();
  }

  private async setupWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        // Request wake lock when playing
        document.addEventListener('visibilitychange', async () => {
          if (!document.hidden && this.isPlaying) {
            try {
              await (navigator as any).wakeLock.request('screen');
            } catch (err) {
              console.log('Wake lock failed:', err);
            }
          }
        });
      } catch (err) {
        console.log('Wake lock not supported');
      }
    }
  }

  getPlaybackState() {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      playlist: this.playlist,
      currentIndex: this.currentIndex
    };
  }

  setVolume(volume: number) {
    this.volume = volume;
    this.savePlaybackState();
  }

  private handleServiceWorkerControl(action: string) {
    switch (action) {
      case 'play':
      case 'pause':
        this.onTogglePlay?.();
        break;
      case 'next':
        this.onNext?.();
        break;
      case 'previous':
        this.onPrevious?.();
        break;
    }
  }

  private notifyServiceWorkerAudioState(audioContextState?: string) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const currentAudioContextState = audioContextState || 
        (window as any).vibeScapeAudioContext?.state || 'suspended';
        
      navigator.serviceWorker.controller.postMessage({
        type: 'AUDIO_STATE_UPDATE',
        data: {
          isPlaying: this.isPlaying,
          currentTrack: this.currentTrack,
          currentTime: this.currentTime,
          duration: this.duration,
          audioContextState: currentAudioContextState
        }
      });
    }
  }

  private enableBackgroundOptimizations() {
    // Reduce update frequency when backgrounded
    this.updateInterval = 2000; // Update every 2 seconds instead of 500ms
  }

  private disableBackgroundOptimizations() {
    // Restore normal update frequency
    this.updateInterval = 500;
  }

  private syncStateFromBackground() {
    // Request current state from service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.type === 'KEEP_ALIVE_RESPONSE') {
          const { audioState } = event.data;
          if (audioState && audioState.currentTrack) {
            this.currentTrack = audioState.currentTrack;
            this.isPlaying = audioState.isAudioPlaying;
            this.currentTime = audioState.playbackPosition;
          }
        }
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'KEEP_ALIVE'
      }, [channel.port2]);
    }
  }

  private setupMobileWakeLock() {
    if ('wakeLock' in navigator) {
      let wakeLock: any = null;
      
      const requestWakeLock = async () => {
        try {
          if (this.isPlaying && !wakeLock) {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            console.log('Mobile wake lock acquired');
            
            wakeLock.addEventListener('release', () => {
              console.log('Mobile wake lock released');
              wakeLock = null;
            });
          }
        } catch (err) {
          console.log('Mobile wake lock failed:', err);
        }
      };

      this.enableMobileWakeLock = requestWakeLock;
      this.disableMobileWakeLock = async () => {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
      };
    }
  }

  private enableMobileWakeLock?: () => Promise<void>;
  private disableMobileWakeLock?: () => Promise<void>;

  private setupMobileAudioContextManagement() {
    if ('AudioContext' in window) {
      const handleMobileUserInteraction = async () => {
        try {
          this.createMobileAudioContext();
          
          if (this.mobileAudioContext?.state === 'suspended') {
            await this.mobileAudioContext.resume();
            console.log('Mobile audio context resumed');
          }
        } catch (err) {
          console.log('Mobile audio context setup failed:', err);
        }
      };

      // Mobile-specific interaction events
      const mobileEvents = ['touchstart', 'touchend', 'touchmove', 'click', 'tap'];
      mobileEvents.forEach(event => {
        document.addEventListener(event, handleMobileUserInteraction, { once: true, passive: true });
      });
    }
  }

  private updateInterval = 500;
  private mobileAudioContext: AudioContext | null = null;
  private backgroundAudioElement: HTMLAudioElement | null = null;

  private handleHeartbeat() {
    console.log('Responding to mobile SW heartbeat');
    this.notifyServiceWorkerAudioState();
  }

  private handleAudioContextRestore(audioState: any) {
    if (audioState) {
      console.log('Restoring mobile audio context:', audioState);
      
      if (audioState.currentTrack) {
        this.currentTrack = audioState.currentTrack;
        this.isPlaying = audioState.isAudioPlaying || false;
        this.currentTime = audioState.playbackPosition || 0;
      }
      
      this.resumeMobileAudioContext();
    }
  }

  private handleMobileBackgroundSync() {
    console.log('Mobile background sync triggered');
    this.maintainMobileAudioContext();
    this.keepMobileAudioAlive();
  }

  private setupMobileBackgroundPlayback() {
    // Mobile-specific background audio setup
    this.createMobileAudioContext();
    this.setupMobileAudioInterception();
    this.enableMobileMediaControls();
  }

  private createMobileAudioContext() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.mobileAudioContext = new AudioContext();
        (window as any).vibeScapeMobileAudioContext = this.mobileAudioContext;
        
        // Unlock audio on mobile
        const unlockAudio = async () => {
          if (this.mobileAudioContext?.state === 'suspended') {
            await this.mobileAudioContext.resume();
            console.log('Mobile audio context unlocked');
          }
        };
        
        // Setup unlock triggers
        const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
        events.forEach(event => {
          document.addEventListener(event, unlockAudio, { once: true });
        });
      }
    } catch (error) {
      console.error('Failed to create mobile audio context:', error);
    }
  }

  private maintainMobileAudioContext() {
    if (this.mobileAudioContext && this.isPlaying) {
      // Keep audio context alive during background
      const oscillator = this.mobileAudioContext.createOscillator();
      const gainNode = this.mobileAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.mobileAudioContext.destination);
      gainNode.gain.value = 0; // Silent
      
      oscillator.frequency.value = 440;
      oscillator.start();
      oscillator.stop(this.mobileAudioContext.currentTime + 0.001);
    }
  }

  private resumeMobileAudioContext() {
    if (this.mobileAudioContext?.state === 'suspended') {
      this.mobileAudioContext.resume().catch(console.error);
    }
  }

  private enableMobileBackgroundMode() {
    // Mobile background optimizations
    this.keepMobileAudioAlive();
    this.enableMobileWakeLock();
  }

  private disableMobileBackgroundMode() {
    // Restore normal mobile mode
    this.disableMobileWakeLock();
  }

  private keepMobileAudioAlive() {
    // Create silent audio to maintain mobile background playback
    if (!this.backgroundAudioElement && this.isPlaying) {
      this.backgroundAudioElement = document.createElement('audio');
      this.backgroundAudioElement.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2OBjQDfW1YdROfTFp0GQVWUlG9jQzm8lJ5pnULcdnGOvxElWWfSrQH9+4j8V1OPGfWWvvCJSUIflgcV8cWYwWtPNg0cMQPGIFJJvzSFBFILKxUeOZTKq1R/Tc0Dk0P4Ps9r8CmI7AgKRYKs=';
      this.backgroundAudioElement.loop = true;
      this.backgroundAudioElement.volume = 0;
      this.backgroundAudioElement.play().catch(console.error);
    }
  }

  private requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  private setupMobileAudioInterception() {
    // Intercept native audio events for mobile
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach(element => {
      element.addEventListener('play', () => {
        if (this.isPlaying) {
          this.maintainMobileAudioContext();
        }
      });
    });
  }

  private enableMobileMediaControls() {
    // Enhanced mobile media controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('stop', () => {
        this.onTogglePlay?.();
        if (this.backgroundAudioElement) {
          this.backgroundAudioElement.pause();
          this.backgroundAudioElement.remove();
          this.backgroundAudioElement = null;
        }
      });
    }
  }

  async destroy() {
    this.savePlaybackState();
    this.notifyServiceWorkerAudioState();
    
    // Clean up mobile audio resources
    if (this.backgroundAudioElement) {
      this.backgroundAudioElement.pause();
      this.backgroundAudioElement.remove();
      this.backgroundAudioElement = null;
    }
    
    if (this.mobileAudioContext) {
      await this.mobileAudioContext.close();
      this.mobileAudioContext = null;
    }
    
    await this.disableMobileWakeLock?.();
    
    if (!Capacitor.isNativePlatform()) return;
    console.log('Mobile audio service destroyed');
    this.isInitialized = false;
  }

  // Callback handlers - set these from your music player context
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
}

export default MobileAudioService;
