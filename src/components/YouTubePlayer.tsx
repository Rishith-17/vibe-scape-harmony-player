
import { useEffect, useRef } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer = () => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTrack, isPlaying, setIsPlaying, skipNext } = useMusicPlayer();

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    function initializePlayer() {
      if (containerRef.current && !playerRef.current && currentTrack) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '1',
          width: '1',
          videoId: currentTrack.id,
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
              console.log('YouTube player ready');
              updateMediaSession();
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                updateMediaSession();
              } else if (state === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (state === window.YT.PlayerState.ENDED) {
                skipNext();
              }
            },
          },
        });
      }
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [currentTrack]);

  // Update video when currentTrack changes
  useEffect(() => {
    if (playerRef.current && currentTrack) {
      try {
        playerRef.current.loadVideoById(currentTrack.id);
        updateMediaSession();
      } catch (error) {
        console.error('Error loading video:', error);
      }
    }
  }, [currentTrack?.id]);

  // Control playback
  useEffect(() => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (error) {
        console.error('Error controlling playback:', error);
      }
    }
  }, [isPlaying]);

  const updateMediaSession = () => {
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
            },
            {
              src: `https://img.youtube.com/vi/${currentTrack.id}/maxresdefault.jpg`,
              sizes: '1280x720',
              type: 'image/jpeg'
            }
          ]
        });
        
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (error) {
        console.error('Error updating media session:', error);
      }
    }
  };

  if (!currentTrack) return null;

  return (
    <div 
      className="fixed -top-full -left-full opacity-0 pointer-events-none"
      style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
    >
      <div ref={containerRef} />
    </div>
  );
};

export default YouTubePlayer;
