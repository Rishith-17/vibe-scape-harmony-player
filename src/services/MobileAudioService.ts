
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
      if (!Capacitor.isNativePlatform()) {
        console.log('Running in web mode - native features disabled');
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

  async updateNowPlaying(track: Track, isPlaying: boolean, currentTime = 0, duration = 0) {
    this.currentTrack = track;
    this.isPlaying = isPlaying;

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

  async destroy() {
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
