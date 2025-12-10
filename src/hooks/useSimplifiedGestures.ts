/**
 * Simplified Gestures Hook
 * - Swipe up/down for scroll
 * - Swipe left/right for navigation
 * - Index finger point = click
 * No cursor display, faster detection
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Landmark } from '@/gestures/gestureUtils';
import { PointClickDetector } from '@/gestures/pointClickGestureUtils';

export interface SimplifiedGestureSettings {
  enabled: boolean;
  swipeSensitivity: number;
  scrollAmount: number;
  cooldownMs: number;
  hapticFeedback: boolean;
}

export const DEFAULT_SIMPLIFIED_SETTINGS: SimplifiedGestureSettings = {
  enabled: true,
  swipeSensitivity: 0.08,
  scrollAmount: 200,
  cooldownMs: 300,
  hapticFeedback: true,
};

interface SwipeState {
  lastPalmX: number;
  lastPalmY: number;
  velocityX: number;
  velocityY: number;
  lastSwipeTime: number;
  lastScrollTime: number;
}

export interface SimplifiedGestureDebugInfo {
  palmX: number;
  palmY: number;
  velocityX: number;
  velocityY: number;
  isPointing: boolean;
  lastAction: string | null;
}

export const useSimplifiedGestures = (options: {
  enabled: boolean;
  settings?: Partial<SimplifiedGestureSettings>;
}) => {
  const settings = { ...DEFAULT_SIMPLIFIED_SETTINGS, ...options.settings };
  const location = useLocation();
  const { toast } = useToast();
  const { playTrack, playlist, skipNext, skipPrevious } = useMusicPlayer();

  const [songIndex, setSongIndex] = useState(0);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<SimplifiedGestureDebugInfo>({
    palmX: 0,
    palmY: 0,
    velocityX: 0,
    velocityY: 0,
    isPointing: false,
    lastAction: null,
  });

  const swipeStateRef = useRef<SwipeState>({
    lastPalmX: 0,
    lastPalmY: 0,
    velocityX: 0,
    velocityY: 0,
    lastSwipeTime: 0,
    lastScrollTime: 0,
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

  // Handle swipe actions
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    const now = Date.now();
    const state = swipeStateRef.current;

    // Vertical swipes = scroll
    if (direction === 'up' || direction === 'down') {
      if (now - state.lastScrollTime < settings.cooldownMs) return;
      state.lastScrollTime = now;

      // Hand up -> scroll up, hand down -> scroll down (natural direction)
      const scrollY = direction === 'up' ? -settings.scrollAmount : settings.scrollAmount;
      window.scrollBy({ top: scrollY, behavior: 'smooth' });
      
      setLastAction(`scroll_${direction}`);
      
      if (settings.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(30);
      }
      return;
    }

    // Horizontal swipes = navigate
    if (now - state.lastSwipeTime < settings.cooldownMs) return;
    state.lastSwipeTime = now;

    const isHomePage = location.pathname === '/home' || location.pathname === '/';
    const isLibraryPage = location.pathname === '/library';
    const isPlaylistPage = location.pathname.startsWith('/playlist/');

    if (isHomePage) {
      // Swipe through songs
      const songCards = document.querySelectorAll('[data-song-id], [data-song-index], [data-gesture-clickable]');
      if (songCards.length === 0) return;

      let newIndex = songIndex;
      if (direction === 'left') {
        newIndex = (songIndex + 1) % songCards.length;
      } else {
        newIndex = (songIndex - 1 + songCards.length) % songCards.length;
      }
      setSongIndex(newIndex);

      const targetCard = songCards[newIndex] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        songCards.forEach(card => card.classList.remove('gesture-swipe-highlight'));
        targetCard.classList.add('gesture-swipe-highlight');
      }
      
      setLastAction(`swipe_song_${direction}`);
    } else if (isLibraryPage) {
      // Swipe through playlists
      const playlistCards = document.querySelectorAll('[data-playlist-id], .playlist-card');
      if (playlistCards.length === 0) return;

      let newIndex = playlistIndex;
      if (direction === 'left') {
        newIndex = (playlistIndex + 1) % playlistCards.length;
      } else {
        newIndex = (playlistIndex - 1 + playlistCards.length) % playlistCards.length;
      }
      setPlaylistIndex(newIndex);

      const targetPlaylist = playlistCards[newIndex] as HTMLElement;
      if (targetPlaylist) {
        targetPlaylist.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        playlistCards.forEach(card => card.classList.remove('gesture-swipe-highlight'));
        targetPlaylist.classList.add('gesture-swipe-highlight');
      }
      
      setLastAction(`swipe_playlist_${direction}`);
    } else if (isPlaylistPage) {
      // Skip tracks
      if (direction === 'left') {
        skipNext();
        setLastAction('skip_next');
      } else {
        skipPrevious();
        setLastAction('skip_prev');
      }
    }

    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [location.pathname, songIndex, playlistIndex, skipNext, skipPrevious, settings]);

  // Process landmarks
  const processLandmarks = useCallback((landmarks: Landmark[], confidence: number) => {
    if (!options.enabled || !landmarks || landmarks.length < 21) return;

    // Get palm center (wrist landmark 0)
    const wrist = landmarks[0];
    const palmX = 1 - wrist.x; // Mirror for natural movement
    const palmY = wrist.y;

    const state = swipeStateRef.current;
    
    // Calculate velocity
    if (state.lastPalmX !== 0) {
      state.velocityX = palmX - state.lastPalmX;
      state.velocityY = palmY - state.lastPalmY;
    }

    // Detect swipes based on velocity
    const threshold = settings.swipeSensitivity;
    
    if (Math.abs(state.velocityX) > threshold && Math.abs(state.velocityX) > Math.abs(state.velocityY)) {
      // Horizontal swipe
      if (state.velocityX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    } else if (Math.abs(state.velocityY) > threshold && Math.abs(state.velocityY) > Math.abs(state.velocityX)) {
      // Vertical swipe
      if (state.velocityY > 0) {
        handleSwipe('down');
      } else {
        handleSwipe('up');
      }
    }

    state.lastPalmX = palmX;
    state.lastPalmY = palmY;

    // Process point-to-click
    if (pointClickDetectorRef.current) {
      pointClickDetectorRef.current.processLandmarks(landmarks, confidence);
    }

    // Update debug info
    const pointDebug = pointClickDetectorRef.current?.getDebugInfo();
    setDebugInfo({
      palmX,
      palmY,
      velocityX: state.velocityX,
      velocityY: state.velocityY,
      isPointing: pointDebug?.isPointing || false,
      lastAction,
    });
  }, [options.enabled, settings.swipeSensitivity, handleSwipe, lastAction]);

  return {
    processLandmarks,
    debugInfo,
    lastAction,
  };
};
