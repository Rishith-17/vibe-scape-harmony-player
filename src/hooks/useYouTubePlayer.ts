
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
  const [isApiReady, setIsApiReady] = useState(false);
  const timeUpdateInterval = useRef<NodeJS.Timeout>();

  // Check if YouTube API is ready
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
    } else {
      const checkAPI = () => {
        if (window.YT && window.YT.Player) {
          setIsApiReady(true);
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      checkAPI();
    }
  }, []);

  const initializePlayer = useCallback(() => {
    if (containerRef.current && !playerRef.current && playlist[currentIndex] && isApiReady) {
      console.log('Initializing YouTube player with video:', playlist[currentIndex].id);
      
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
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            setIsPlayerReady(true);
            // Get duration after a short delay to ensure video is loaded
            setTimeout(() => {
              if (event.target && event.target.getDuration) {
                const videoDuration = event.target.getDuration();
                console.log('Video duration:', videoDuration);
                setDuration(videoDuration);
              }
            }, 1000);
            startTimeUpdates();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            console.log('Player state changed:', state);
            
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTimeUpdates();
              // Update duration when playing starts
              if (event.target && event.target.getDuration) {
                setDuration(event.target.getDuration());
              }
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopTimeUpdates();
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopTimeUpdates();
              onTrackEnd();
            } else if (state === window.YT.PlayerState.BUFFERING) {
              // Update duration during buffering as well
              if (event.target && event.target.getDuration) {
                setDuration(event.target.getDuration());
              }
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
          }
        },
      });
    }
  }, [playlist, currentIndex, onTrackEnd, isApiReady]);

  const startTimeUpdates = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING) {
        const current = playerRef.current.getCurrentTime();
        setCurrentTime(current);
        
        // Also update duration if it's not set or changed
        if (playerRef.current.getDuration) {
          const dur = playerRef.current.getDuration();
          if (dur > 0 && dur !== duration) {
            setDuration(dur);
          }
        }
      }
    }, 500); // Update every 500ms for smoother updates
  };

  const stopTimeUpdates = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  };

  // Load YouTube API if not already loaded
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onload = () => {
        console.log('YouTube API script loaded');
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
        setIsApiReady(true);
      };
    } else {
      setIsApiReady(true);
    }

    return () => {
      stopTimeUpdates();
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (isApiReady && playlist[currentIndex]) {
      initializePlayer();
    }
  }, [initializePlayer, isApiReady]);

  // Handle track changes
  useEffect(() => {
    if (playerRef.current && isPlayerReady && playlist[currentIndex] && playerRef.current.loadVideoById) {
      console.log('Loading new video:', playlist[currentIndex].id);
      playerRef.current.loadVideoById(playlist[currentIndex].id);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentIndex, playlist, isPlayerReady]);

  const togglePlayPause = () => {
    if (playerRef.current && isPlayerReady) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }
  };

  const seekTo = (time: number) => {
    if (playerRef.current && isPlayerReady && playerRef.current.seekTo) {
      try {
        console.log('Seeking to:', time);
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const setVolume = (volume: number) => {
    if (playerRef.current && isPlayerReady && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(volume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
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
