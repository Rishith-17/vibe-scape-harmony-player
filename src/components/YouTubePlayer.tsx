
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEnd: () => void;
}

const YouTubePlayer = ({ videoId, isPlaying, onPlay, onPause, onEnd }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current && !playerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '1',
          width: '1',
          videoId: videoId,
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
              // Configure for background playback
              if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', () => {
                  event.target.playVideo();
                  onPlay();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                  event.target.pauseVideo();
                  onPause();
                });
                navigator.mediaSession.setActionHandler('nexttrack', onEnd);
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === window.YT.PlayerState.PLAYING) {
                onPlay();
                updateMediaSession();
              } else if (state === window.YT.PlayerState.PAUSED) {
                onPause();
              } else if (state === window.YT.PlayerState.ENDED) {
                onEnd();
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
  }, []);

  // Update video when videoId changes
  useEffect(() => {
    if (playerRef.current && videoId) {
      try {
        playerRef.current.loadVideoById(videoId);
        updateMediaSession();
      } catch (error) {
        console.error('Error loading video:', error);
      }
    }
  }, [videoId]);

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
    if ('mediaSession' in navigator && playerRef.current) {
      try {
        const videoData = playerRef.current.getVideoData();
        navigator.mediaSession.metadata = new MediaMetadata({
          title: videoData.title || 'Unknown Track',
          artist: videoData.author || 'Unknown Artist',
          artwork: [
            {
              src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              sizes: '1280x720',
              type: 'image/jpeg'
            }
          ]
        });
      } catch (error) {
        console.error('Error updating media session:', error);
      }
    }
  };

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
