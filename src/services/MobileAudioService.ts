
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
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channelTitle,
        album: 'YouTube Music',
        artwork: [
          { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '384x384', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: currentTime
      });

      // Set action handlers
      navigator.mediaSession.setActionHandler('play', () => this.onTogglePlay?.());
      navigator.mediaSession.setActionHandler('pause', () => this.onTogglePlay?.());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.onPrevious?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.onNext?.());
    }

    // Update document title
    document.title = isPlaying 
      ? `▶ ${track.title} - ${track.channelTitle}` 
      : `⏸ ${track.title} - ${track.channelTitle}`;
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
    // Enable background audio context
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App backgrounded - maintaining playback');
      } else {
        console.log('App foregrounded - syncing state');
        if (this.currentTrack) {
          this.updateWebMediaSession(this.currentTrack, this.isPlaying, this.currentTime, this.duration);
        }
      }
    });

    // Handle beforeunload to save state
    window.addEventListener('beforeunload', () => {
      this.savePlaybackState();
    });

    // Setup wake lock for mobile devices
    this.setupWakeLock();
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

  async destroy() {
    this.savePlaybackState();
    if (!Capacitor.isNativePlatform()) return;
    console.log('Mobile audio service would be destroyed for native platform');
    this.isInitialized = false;
  }

  // Callback handlers - set these from your music player context
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default MobileAudioService;
