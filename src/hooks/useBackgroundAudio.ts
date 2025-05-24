
import { useEffect } from 'react';

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

interface UseBackgroundAudioProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const useBackgroundAudio = ({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: UseBackgroundAudioProps) => {
  useEffect(() => {
    // Configure audio session for background playback
    const configureAudioSession = async () => {
      try {
        // Request audio permissions for background playback
        if ('mediaSession' in navigator) {
          // Set up media session metadata
          if (currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: currentTrack.title,
              artist: currentTrack.channelTitle,
              artwork: [
                {
                  src: currentTrack.thumbnail,
                  sizes: '480x360',
                  type: 'image/jpeg'
                },
                {
                  src: `https://img.youtube.com/vi/${currentTrack.id}/maxresdefault.jpg`,
                  sizes: '1280x720',
                  type: 'image/jpeg'
                }
              ]
            });
          }

          // Set up action handlers
          navigator.mediaSession.setActionHandler('play', onPlay);
          navigator.mediaSession.setActionHandler('pause', onPause);
          navigator.mediaSession.setActionHandler('nexttrack', onNext);
          navigator.mediaSession.setActionHandler('previoustrack', onPrevious);

          // Update playback state
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }

        // For mobile devices, configure audio context
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContext();
          
          // Resume audio context on user interaction if needed
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        }

        // Configure wake lock to prevent screen from turning off during playback
        if ('wakeLock' in navigator && isPlaying) {
          try {
            await (navigator as any).wakeLock.request('screen');
          } catch (err) {
            console.log('Wake lock not supported or failed:', err);
          }
        }

      } catch (error) {
        console.error('Error configuring audio session:', error);
      }
    };

    configureAudioSession();
  }, [currentTrack, isPlaying, onPlay, onPause, onNext, onPrevious]);

  useEffect(() => {
    // Handle visibility change for background playback
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        // App is in background, ensure audio continues
        console.log('App backgrounded, maintaining audio playback');
      } else if (!document.hidden) {
        // App is back in foreground
        console.log('App foregrounded');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  useEffect(() => {
    // Configure page to prevent accidental navigation during playback
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPlaying) {
        e.preventDefault();
        e.returnValue = 'Music is currently playing. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying]);
};
