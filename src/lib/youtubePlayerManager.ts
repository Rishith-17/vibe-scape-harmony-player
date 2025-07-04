
class YouTubePlayerManager {
  private static instance: YouTubePlayerManager;
  private player: any = null;
  private playerContainer: HTMLDivElement | null = null;
  private currentTrack: any = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private isLoading = false;
  private hasError = false;
  private listeners = new Set<() => void>();
  private timeUpdateInterval: NodeJS.Timeout | null = null;
  private isApiReady = false;
  private playerReady = false;
  private onTrackEndCallback: (() => void) | null = null;
  private onErrorCallback: (() => void) | null = null;

  private constructor() {
    this.initializeAPI();
  }

  static getInstance(): YouTubePlayerManager {
    if (!YouTubePlayerManager.instance) {
      YouTubePlayerManager.instance = new YouTubePlayerManager();
    }
    return YouTubePlayerManager.instance;
  }

  private initializeAPI() {
    // Restore previous state if available
    this.restoreState();

    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      this.createPlayer();
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready for Chrome background playback');
      this.isApiReady = true;
      this.setupChromeAudioContext();
      this.createPlayer();
    };

    // Setup background playback support
    this.setupBackgroundPlayback();
  }

  private createPlayer() {
    if (!this.isApiReady || this.player) return;

    console.log('Creating YouTube player');

    if (!this.playerContainer) {
      this.playerContainer = document.createElement('div');
      this.playerContainer.id = 'youtube-player-container';
      this.playerContainer.style.position = 'absolute';
      this.playerContainer.style.left = '-9999px';
      this.playerContainer.style.top = '-9999px';
      this.playerContainer.style.width = '1px';
      this.playerContainer.style.height = '1px';
      document.body.appendChild(this.playerContainer);
    }

    this.player = new window.YT.Player(this.playerContainer, {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube player ready');
          this.playerReady = true;
          this.startTimeUpdates();
          this.notifyListeners();
        },
        onStateChange: (event: any) => {
          this.handleStateChange(event.data);
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          this.hasError = true;
          this.isLoading = false;
          this.notifyListeners();
          if (this.onErrorCallback) {
            this.onErrorCallback();
          }
        }
      },
    });
  }

  private handleStateChange(state: number) {
    const YT = window.YT;
    if (!YT) return;

    console.log('Player state changed:', state);
    this.hasError = false;

    switch (state) {
      case YT.PlayerState.UNSTARTED:
        this.isLoading = true;
        break;
      case YT.PlayerState.PLAYING:
        console.log('Player started playing');
        this.isPlaying = true;
        this.isLoading = false;
        this.updateDuration();
        break;
      case YT.PlayerState.PAUSED:
        console.log('Player paused');
        this.isPlaying = false;
        this.isLoading = false;
        break;
      case YT.PlayerState.ENDED:
        console.log('Player ended');
        this.isPlaying = false;
        this.isLoading = false;
        this.currentTime = 0;
        if (this.onTrackEndCallback) {
          setTimeout(() => {
            this.onTrackEndCallback?.();
          }, 500);
        }
        break;
      case YT.PlayerState.BUFFERING:
        console.log('Player buffering');
        this.isLoading = true;
        this.updateDuration();
        break;
      case YT.PlayerState.CUED:
        console.log('Player cued');
        this.isLoading = false;
        setTimeout(() => {
          if (this.player && this.player.playVideo) {
            console.log('Auto-playing cued video');
            this.player.playVideo();
          }
        }, 100);
        break;
    }
    this.notifyListeners();
  }

  private updateDuration() {
    if (this.player && this.player.getDuration) {
      const dur = this.player.getDuration();
      if (dur > 0) {
        this.duration = dur;
      }
    }
  }

  private startTimeUpdates() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    this.timeUpdateInterval = setInterval(() => {
      if (this.player && this.player.getCurrentTime && this.isPlaying) {
        this.currentTime = this.player.getCurrentTime();
        this.notifyListeners();
      }
    }, 500);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async playTrack(track: any) {
    if (!track || !track.id) {
      console.error('Invalid track provided to playTrack');
      return;
    }

    if (!this.isApiReady) {
      console.log('API not ready, waiting...');
      setTimeout(() => this.playTrack(track), 200);
      return;
    }

    if (!this.player) {
      console.log('Player not created, creating and retrying...');
      this.createPlayer();
      setTimeout(() => this.playTrack(track), 500);
      return;
    }

    if (!this.playerReady) {
      console.log('Player not ready, waiting...');
      setTimeout(() => this.playTrack(track), 200);
      return;
    }

    console.log('Playing track:', track.id, track.title);
    
    // Stop current playback immediately
    try {
      if (this.isPlaying) {
        this.player.stopVideo();
      }
    } catch (error) {
      console.error('Error stopping current video:', error);
    }

    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = 0;
    this.hasError = false;
    this.isLoading = true;

    try {
      // Load and play new video
      this.player.loadVideoById({
        videoId: track.id,
        startSeconds: 0
      });
      
      console.log('Video loaded successfully');
    } catch (error) {
      console.error('Error loading track:', error);
      this.hasError = true;
      this.isLoading = false;
    }

    this.notifyListeners();
  }

  togglePlayPause() {
    if (!this.player || !this.playerReady) {
      console.log('Player not ready for toggle');
      return;
    }

    try {
      if (this.isPlaying) {
        console.log('Pausing player');
        this.player.pauseVideo();
      } else {
        console.log('Playing player');
        this.player.playVideo();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }

  seekTo(seconds: number) {
    if (!this.player || !this.playerReady) return;

    try {
      this.player.seekTo(seconds, true);
      this.currentTime = seconds;
      this.notifyListeners();
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }

  setVolume(volume: number) {
    if (!this.player || !this.playerReady) return;

    try {
      this.player.setVolume(volume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  setOnTrackEnd(callback: () => void) {
    this.onTrackEndCallback = callback;
  }

  setOnError(callback: () => void) {
    this.onErrorCallback = callback;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getDuration() {
    return this.duration;
  }

  getIsLoading() {
    return this.isLoading;
  }

  getHasError() {
    return this.hasError;
  }

  private restoreState() {
    try {
      const savedState = localStorage.getItem('youtube_player_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only restore if state is recent (within 1 hour)
        if (Date.now() - state.timestamp < 60 * 60 * 1000) {
          this.currentTrack = state.currentTrack;
          this.currentTime = state.currentTime || 0;
          this.duration = state.duration || 0;
          console.log('YouTube player state restored');
        }
      }
    } catch (error) {
      console.error('Failed to restore YouTube player state:', error);
    }
  }

  private saveState() {
    try {
      const state = {
        currentTrack: this.currentTrack,
        currentTime: this.currentTime,
        duration: this.duration,
        timestamp: Date.now()
      };
      localStorage.setItem('youtube_player_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save YouTube player state:', error);
    }
  }

  private setupChromeAudioContext() {
    // Chrome-specific: Ensure audio context is ready for background playback
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const handleFirstInteraction = () => {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!((window as any).vibeScapeAudioContext)) {
            const audioContext = new AudioContext();
            (window as any).vibeScapeAudioContext = audioContext;
            
            // Resume if suspended
            if (audioContext.state === 'suspended') {
              audioContext.resume().then(() => {
                console.log('Chrome AudioContext resumed for background playback');
              });
            }
          }
        } catch (error) {
          console.log('AudioContext setup failed:', error);
        }
        
        // Remove listeners after first interaction
        ['click', 'touchstart', 'keydown'].forEach(event => {
          document.removeEventListener(event, handleFirstInteraction);
        });
      };

      // Setup listeners for first user interaction
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, handleFirstInteraction, { once: true });
      });
    }
  }

  private setupBackgroundPlayback() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden - maintaining YouTube playback');
        this.saveState();
      } else {
        console.log('Page visible - syncing YouTube state');
        // Force a time update when page becomes visible
        if (this.player && this.player.getCurrentTime) {
          this.currentTime = this.player.getCurrentTime();
          this.notifyListeners();
        }
      }
    });

    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });

    // Prevent audio context suspension on mobile
    if ('AudioContext' in window) {
      const handleUserInteraction = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('Audio context resumed for background playback');
            });
          }
        }
        // Remove listener after first interaction
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      };

      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('click', handleUserInteraction, { once: true });
    }
  }

  destroy() {
    this.saveState();
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    if (this.player) {
      try {
        this.player.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    }
    if (this.playerContainer) {
      document.body.removeChild(this.playerContainer);
    }
    this.listeners.clear();
  }
}

export default YouTubePlayerManager;
