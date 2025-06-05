
import { useState, useEffect, useCallback } from 'react';
import YouTubePlayerManager from '@/lib/youtubePlayerManager';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  artist?: string;
}

interface UseGlobalYouTubePlayerProps {
  playlist: Track[];
  currentIndex: number;
  onTrackChange: (index: number) => void;
}

export const useGlobalYouTubePlayer = ({
  playlist,
  currentIndex,
  onTrackChange,
}: UseGlobalYouTubePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const playerManager = YouTubePlayerManager.getInstance();

  const updateState = useCallback(() => {
    setIsPlaying(playerManager.getIsPlaying());
    if (!isDragging) {
      setCurrentTime(playerManager.getCurrentTime());
    }
    setDuration(playerManager.getDuration());
  }, [isDragging, playerManager]);

  useEffect(() => {
    const unsubscribe = playerManager.subscribe(updateState);
    
    // Set up track end callback
    playerManager.setOnTrackEnd(() => {
      if (currentIndex < playlist.length - 1) {
        onTrackChange(currentIndex + 1);
      }
    });

    return unsubscribe;
  }, [updateState, playerManager, currentIndex, playlist.length, onTrackChange]);

  useEffect(() => {
    if (playlist[currentIndex]) {
      playerManager.playTrack(playlist[currentIndex]);
    }
  }, [currentIndex, playlist, playerManager]);

  const togglePlayPause = useCallback(() => {
    playerManager.togglePlayPause();
  }, [playerManager]);

  const seekTo = useCallback((time: number) => {
    playerManager.seekTo(time);
  }, [playerManager]);

  const setVolume = useCallback((volume: number) => {
    playerManager.setVolume(volume);
  }, [playerManager]);

  const handleDragStart = useCallback((time: number) => {
    setIsDragging(true);
    setDragTime(time);
  }, []);

  const handleDragMove = useCallback((time: number) => {
    if (isDragging) {
      setDragTime(time);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback((time: number) => {
    setIsDragging(false);
    seekTo(time);
  }, [seekTo]);

  const displayTime = isDragging ? dragTime : currentTime;

  return {
    isPlaying,
    currentTime: displayTime,
    duration,
    isDragging,
    togglePlayPause,
    seekTo,
    setVolume,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
};
