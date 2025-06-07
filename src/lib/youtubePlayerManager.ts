
class YouTubePlayerManager {
  private static instance: YouTubePlayerManager;
  private player: any = null;
  private playerContainer: HTMLDivElement | null = null;
  private currentTrack: any = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private listeners = new Set<() => void>();
  private timeUpdateInterval: NodeJS.Timeout | null = null;
  private isApiReady = false;
  private playerReady = false;
  private onTrackEndCallback: (() => void) | null = null;
  private isLoadingNewTrack = false;
  private lastTrackId: string | null = null;

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
      console.log('YouTube API ready');
      this.isApiReady = true;
      this.createPlayer();
    };
  }

  private createPlayer() {
    if (!this.isApiReady || this.player) return;

    console.log('Creating YouTube player');

    // Create hidden container if it doesn't exist
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
          if (this.onTrackEndCallback) {
            this.onTrackEndCallback();
          }
        }
      },
    });
  }

  private handleStateChange(state: number) {
    const YT = window.YT;
    if (!YT) return;

    console.log('Player state changed:', state);

    switch (state) {
      case YT.PlayerState.PLAYING:
        console.log('Player started playing');
        this.isPlaying = true;
        this.isLoadingNewTrack = false;
        this.updateDuration();
        break;
      case YT.PlayerState.PAUSED:
        console.log('Player paused');
        this.isPlaying = false;
        break;
      case YT.PlayerState.ENDED:
        console.log('Player ended');
        this.isPlaying = false;
        this.currentTime = 0;
        if (this.onTrackEndCallback && !this.isLoadingNewTrack) {
          setTimeout(() => {
            this.onTrackEndCallback?.();
          }, 500);
        }
        break;
      case YT.PlayerState.BUFFERING:
        console.log('Player buffering');
        this.updateDuration();
        break;
      case YT.PlayerState.CUED:
        console.log('Player cued');
        // Video is loaded and ready to play
        if (this.isLoadingNewTrack) {
          setTimeout(() => {
            if (this.player && this.player.playVideo) {
              console.log('Auto-playing cued video');
              this.player.playVideo();
            }
          }, 100);
        }
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

    // Prevent infinite loops - check if we're already loading this track
    if (this.isLoadingNewTrack && this.lastTrackId === track.id) {
      console.log('Already loading this track, skipping duplicate request');
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
    
    // Set loading flag and track ID to prevent duplicates
    this.isLoadingNewTrack = true;
    this.lastTrackId = track.id;
    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = 0;

    try {
      // Use loadVideoById for fast switching
      this.player.loadVideoById({
        videoId: track.id,
        startSeconds: 0
      });
      
      console.log('Video loaded successfully');
    } catch (error) {
      console.error('Error loading track:', error);
      this.isLoadingNewTrack = false;
      this.lastTrackId = null;
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

  destroy() {
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
