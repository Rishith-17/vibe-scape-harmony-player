
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
        this.setupWebBackgroundPlayback();
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

  private setupWebBackgroundPlayback() {
    // Enhanced service worker communication
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered for background audio');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_AUDIO_CONTROL') {
            this.handleServiceWorkerControl(event.data.action);
          }
        });
      }).catch(console.error);
    }

    // Handle page visibility changes with enhanced state sync
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App backgrounded - optimizing for background playback');
        this.savePlaybackState();
        this.notifyServiceWorkerAudioState();
        this.enableBackgroundOptimizations();
      } else {
        console.log('App foregrounded - restoring active state');
        this.disableBackgroundOptimizations();
        this.syncStateFromBackground();
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

    // Enhanced wake lock and audio context management
    this.setupEnhancedWakeLock();
    this.setupAudioContextManagement();
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

  private notifyServiceWorkerAudioState() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'AUDIO_STATE_UPDATE',
        data: {
          isPlaying: this.isPlaying,
          currentTrack: this.currentTrack,
          currentTime: this.currentTime,
          duration: this.duration
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

  private setupEnhancedWakeLock() {
    if ('wakeLock' in navigator) {
      let wakeLock: any = null;
      
      const requestWakeLock = async () => {
        try {
          if (this.isPlaying && !wakeLock) {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            console.log('Screen wake lock acquired for background playback');
            
            wakeLock.addEventListener('release', () => {
              console.log('Wake lock released');
              wakeLock = null;
            });
          }
        } catch (err) {
          console.log('Wake lock request failed:', err);
        }
      };

      const releaseWakeLock = async () => {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
      };

      // Request wake lock when playing starts
      document.addEventListener('visibilitychange', () => {
        if (this.isPlaying) {
          if (document.hidden) {
            requestWakeLock();
          } else {
            releaseWakeLock();
          }
        }
      });
    }
  }

  private setupAudioContextManagement() {
    // Enhanced audio context management for better background playback
    if ('AudioContext' in window) {
      const handleUserInteraction = async () => {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContext();
          
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('Audio context resumed for optimal background playback');
          }
          
          // Store reference for future use
          (window as any).vibeScapeAudioContext = audioContext;
        } catch (err) {
          console.log('Audio context setup failed:', err);
        }
      };

      // Setup on first user interaction
      const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
      events.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
      });
    }
  }

  private updateInterval = 500;

  async destroy() {
    this.savePlaybackState();
    this.notifyServiceWorkerAudioState();
    if (!Capacitor.isNativePlatform()) return;
    console.log('Mobile audio service would be destroyed for native platform');
    this.isInitialized = false;
  }

  // Callback handlers - set these from your music player context
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
}

export default MobileAudioService;
