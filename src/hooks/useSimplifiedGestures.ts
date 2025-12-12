/**
 * Simplified Gestures Hook
 * - Index finger point = click (only gesture)
 * No swipe, no cursor display
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Landmark } from '@/gestures/gestureUtils';
import { PointClickDetector } from '@/gestures/pointClickGestureUtils';

export interface SimplifiedGestureSettings {
  enabled: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_SIMPLIFIED_SETTINGS: SimplifiedGestureSettings = {
  enabled: true,
  hapticFeedback: true,
};

export interface SimplifiedGestureDebugInfo {
  palmX: number;
  palmY: number;
  isPointing: boolean;
  lastAction: string | null;
}

export const useSimplifiedGestures = (options: {
  enabled: boolean;
  settings?: Partial<SimplifiedGestureSettings>;
}) => {
  const settings = { ...DEFAULT_SIMPLIFIED_SETTINGS, ...options.settings };
  const { toast } = useToast();
  const { playTrack, playlist } = useMusicPlayer();

  const [lastAction, setLastAction] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<SimplifiedGestureDebugInfo>({
    palmX: 0,
    palmY: 0,
    isPointing: false,
    lastAction: null,
  });

  const pointClickDetectorRef = useRef<PointClickDetector | null>(null);

  // Initialize point click detector
  useEffect(() => {
    if (!options.enabled) return;

    pointClickDetectorRef.current = new PointClickDetector();
    
    pointClickDetectorRef.current.onClick((element) => {
      handleClickAction(element);
    });

    return () => {
      pointClickDetectorRef.current = null;
    };
  }, [options.enabled]);

  // Handle click action
  const handleClickAction = useCallback((element: Element) => {
    const songId = element.getAttribute('data-song-id');
    const songIndexAttr = element.getAttribute('data-song-index');
    const playlistId = element.getAttribute('data-playlist-id');
    
    console.log('👆 Click action:', { songId, songIndexAttr, playlistId });

    if (songId || songIndexAttr !== null) {
      const index = songIndexAttr ? parseInt(songIndexAttr, 10) : playlist.findIndex(t => t.id === songId);
      
      if (index >= 0 && index < playlist.length) {
        const track = playlist[index];
        playTrack(track, playlist, index);
        
        toast({
          title: '🎵 Playing',
          description: track.title,
          duration: 2000,
        });
        setLastAction('click_play');
      }
    } else if (playlistId || element instanceof HTMLElement) {
      (element as HTMLElement).click();
      setLastAction('click_nav');
    }

    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  }, [playTrack, playlist, toast, settings.hapticFeedback]);

  // Process landmarks
  const processLandmarks = useCallback((landmarks: Landmark[], confidence: number) => {
    if (!options.enabled || !landmarks || landmarks.length < 21) return;

    // Get palm center (wrist landmark 0)
    const wrist = landmarks[0];
    const palmX = 1 - wrist.x; // Mirror for natural movement
    const palmY = wrist.y;

    // Process point-to-click only
    if (pointClickDetectorRef.current) {
      pointClickDetectorRef.current.processLandmarks(landmarks, confidence);
    }

    // Update debug info
    const pointDebug = pointClickDetectorRef.current?.getDebugInfo();
    setDebugInfo({
      palmX,
      palmY,
      isPointing: pointDebug?.isPointing || false,
      lastAction,
    });
  }, [options.enabled, lastAction]);

  return {
    processLandmarks,
    debugInfo,
    lastAction,
  };
};
