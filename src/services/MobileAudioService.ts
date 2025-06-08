
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@capacitor/background-mode';
import { LocalNotifications } from '@capacitor/local-notifications';

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

  static getInstance(): MobileAudioService {
    if (!MobileAudioService.instance) {
      MobileAudioService.instance = new MobileAudioService();
    }
    return MobileAudioService.instance;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform() || this.isInitialized) {
      return;
    }

    try {
      // Request notification permissions
      await LocalNotifications.requestPermissions();

      // Initialize background mode
      await BackgroundMode.enable();

      // Initialize music controls if available
      if (window.MusicControls) {
        await this.setupMusicControls();
      }

      this.isInitialized = true;
      console.log('Mobile audio service initialized');
    } catch (error) {
      console.error('Failed to initialize mobile audio service:', error);
    }
  }

  private async setupMusicControls() {
    if (!window.MusicControls) return;

    const controls = window.MusicControls;

    // Create music controls
    await controls.create({
      track: 'Loading...',
      artist: 'Music Player',
      cover: '',
      isPlaying: false,
      dismissable: false,
      hasPrev: true,
      hasNext: true,
      hasClose: false,
      album: '',
      duration: 0,
      elapsed: 0,
      hasSkipForward: true,
      hasSkipBackward: true,
      skipForwardInterval: 15,
      skipBackwardInterval: 15,
      hasScrubbing: true,
      ticker: 'Now playing'
    });

    // Listen to control events
    controls.subscribe((action: string) => {
      console.log('Music control action:', action);
      
      switch (action) {
        case 'music-controls-next':
          this.onNext?.();
          break;
        case 'music-controls-previous':
          this.onPrevious?.();
          break;
        case 'music-controls-pause':
        case 'music-controls-play':
          this.onTogglePlay?.();
          break;
        case 'music-controls-destroy':
          this.destroy();
          break;
      }
    });

    controls.listen();
  }

  async updateNowPlaying(track: Track, isPlaying: boolean, currentTime = 0, duration = 0) {
    this.currentTrack = track;
    this.isPlaying = isPlaying;

    if (!Capacitor.isNativePlatform()) {
      // Web PWA - Update document title and media session
      this.updateWebMediaSession(track, isPlaying, currentTime, duration);
      return;
    }

    try {
      // Update music controls
      if (window.MusicControls) {
        await window.MusicControls.updateIsPlaying(isPlaying);
        await window.MusicControls.updateElapsed({
          elapsed: Math.floor(currentTime),
          isPlaying: isPlaying
        });
        
        if (track) {
          await window.MusicControls.updateMetas({
            track: track.title,
            artist: track.channelTitle,
            album: 'YouTube Music',
            cover: track.thumbnail,
            duration: Math.floor(duration)
          });
        }
      }

      // Update background mode notification
      if (BackgroundMode.isEnabled()) {
        await BackgroundMode.configure({
          title: track?.title || 'Music Player',
          text: `${track?.channelTitle || 'Unknown Artist'} • ${isPlaying ? 'Playing' : 'Paused'}`,
          icon: 'icon'
        });
      }
    } catch (error) {
      console.error('Failed to update now playing:', error);
    }
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

    try {
      await BackgroundMode.enable();
      console.log('Background mode enabled');
    } catch (error) {
      console.error('Failed to enable background mode:', error);
    }
  }

  async disableBackgroundMode() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await BackgroundMode.disable();
      console.log('Background mode disabled');
    } catch (error) {
      console.error('Failed to disable background mode:', error);
    }
  }

  async destroy() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (window.MusicControls) {
        await window.MusicControls.destroy();
      }
      await this.disableBackgroundMode();
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to destroy mobile audio service:', error);
    }
  }

  // Callback handlers - set these from your music player context
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default MobileAudioService;
