import { useEffect, useCallback } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useMobileAudio } from './useMobileAudio';

export const useBackgroundPlayback = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration,
    playlist,
    currentIndex,
    playTrack,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume
  } = useMusicPlayer();
  
  const { mobileAudioService } = useMobileAudio();

  // Initialize background playback and restore state
  useEffect(() => {
    const initializeBackgroundPlayback = async () => {
      try {
        // Get saved state from mobile audio service
        const savedState = mobileAudioService.getPlaybackState();
        
        // If we have a saved track but no current track, restore it
        if (savedState.currentTrack && !currentTrack) {
          console.log('Restoring previous playback state');
          
          // Only restore the track info, don't auto-play to respect autoplay policies
          if (savedState.playlist.length > 0) {
            // The playTrack function will handle setting up the track without auto-playing
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure context is ready
          }
        }
      } catch (error) {
        console.error('Failed to initialize background playback:', error);
      }
    };

    initializeBackgroundPlayback();
  }, []);

  // Enhanced media session handlers
  const handleMediaSessionActions = useCallback(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // Set up action handlers with proper error handling
      navigator.mediaSession.setActionHandler('play', () => {
        try {
          if (!isPlaying) {
            togglePlayPause();
          }
        } catch (error) {
          console.error('Media session play error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        try {
          if (isPlaying) {
            togglePlayPause();
          }
        } catch (error) {
          console.error('Media session pause error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        try {
          skipNext();
        } catch (error) {
          console.error('Media session next error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        try {
          skipPrevious();
        } catch (error) {
          console.error('Media session previous error:', error);
        }
      });

      // Handle seek if supported
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        try {
          if (details.seekTime !== undefined) {
            seekTo(details.seekTime);
          }
        } catch (error) {
          console.error('Media session seek error:', error);
        }
      });

      // Update position state for better scrubbing support
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: Math.min(currentTime, duration)
        });
      }
    }
  }, [currentTrack, isPlaying, currentTime, duration, togglePlayPause, skipNext, skipPrevious, seekTo]);

  // Set up media session whenever track or state changes
  useEffect(() => {
    handleMediaSessionActions();
  }, [handleMediaSessionActions]);

  // Handle autoplay resumption when user interacts with the page
  useEffect(() => {
    const handleUserInteraction = () => {
      // Only attempt to resume if we have a saved playing state
      const savedState = mobileAudioService.getPlaybackState();
      if (savedState.currentTrack && savedState.isPlaying && !isPlaying && currentTrack) {
        console.log('User interaction detected, attempting to resume playback');
        // Don't auto-resume, let user manually play
      }
    };

    // Add listeners for user interaction events
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [isPlaying, currentTrack, mobileAudioService]);

  // Prevent audio interruption on navigation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Save current state before page unload
      mobileAudioService.savePlaybackState();
      
      // Don't show confirmation dialog for music apps
      // Just save state silently
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mobileAudioService]);

  return {
    // Return utility functions if needed
    restorePlaybackState: () => mobileAudioService.getPlaybackState(),
    isBackgroundPlaybackSupported: 'mediaSession' in navigator
  };
};