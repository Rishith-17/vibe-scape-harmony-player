
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
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.channelTitle,
          artwork: [
            {
              src: currentTrack.thumbnail,
              sizes: '480x360',
              type: 'image/jpeg'
            }
          ]
        });

        navigator.mediaSession.setActionHandler('play', onPlay);
        navigator.mediaSession.setActionHandler('pause', onPause);
        navigator.mediaSession.setActionHandler('nexttrack', onNext);
        navigator.mediaSession.setActionHandler('previoustrack', onPrevious);

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (error) {
        console.error('Error setting up media session:', error);
      }
    }
  }, [currentTrack, isPlaying, onPlay, onPause, onNext, onPrevious]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        console.log('App backgrounded, maintaining audio playback');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);
};
