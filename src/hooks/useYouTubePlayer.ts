
import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration?: number;
}

interface UseYouTubePlayerProps {
  playlist: Track[];
  currentIndex: number;
  onTrackChange: (index: number) => void;
  onTrackEnd: () => void;
}

export const useYouTubePlayer = ({
  playlist,
  currentIndex,
  onTrackChange,
  onTrackEnd,
}: UseYouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const timeUpdateInterval = useRef<NodeJS.Timeout>();

  const initializePlayer = useCallback(() => {
    if (containerRef.current && !playerRef.current && playlist[currentIndex]) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId: playlist[currentIndex].id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            setDuration(event.target.getDuration());
            startTimeUpdates();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTimeUpdates();
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopTimeUpdates();
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopTimeUpdates();
              onTrackEnd();
            }
          },
        },
      });
    }
  }, [playlist, currentIndex, onTrackEnd]);

  const startTimeUpdates = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  };

  const stopTimeUpdates = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      stopTimeUpdates();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    if (playerRef.current && isPlayerReady && playlist[currentIndex]) {
      playerRef.current.loadVideoById(playlist[currentIndex].id);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentIndex, playlist, isPlayerReady]);

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const seekTo = (time: number) => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const setVolume = (volume: number) => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.setVolume(volume);
    }
  };

  return {
    playerRef: containerRef,
    isPlaying,
    currentTime,
    duration,
    isPlayerReady,
    togglePlayPause,
    seekTo,
    setVolume,
  };
};
