
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import MobileAudioService from '@/services/MobileAudioService';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export const useMobileAudio = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    playlist,
    currentIndex,
    togglePlayPause, 
    skipNext, 
    skipPrevious 
  } = useMusicPlayer();

  const mobileAudioService = MobileAudioService.getInstance();

  useEffect(() => {
    // Initialize mobile audio service
    mobileAudioService.initialize();

    // Set callback handlers
    mobileAudioService.onTogglePlay = togglePlayPause;
    mobileAudioService.onNext = skipNext;
    mobileAudioService.onPrevious = skipPrevious;

    return () => {
      mobileAudioService.destroy();
    };
  }, [togglePlayPause, skipNext, skipPrevious]);

  useEffect(() => {
    // Update now playing info whenever track or state changes
    if (currentTrack) {
      mobileAudioService.updateNowPlaying(
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playlist,
        currentIndex
      );
    }
  }, [currentTrack, isPlaying, currentTime, duration, playlist, currentIndex]);

  useEffect(() => {
    // Enable background mode when playing
    if (isPlaying && Capacitor.isNativePlatform()) {
      mobileAudioService.enableBackgroundMode();
    } else if (!isPlaying) {
      mobileAudioService.disableBackgroundMode();
    }
  }, [isPlaying]);

  return {
    isNativePlatform: Capacitor.isNativePlatform(),
    mobileAudioService
  };
};
