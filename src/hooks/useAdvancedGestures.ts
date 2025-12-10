/**
 * Advanced Gestures Hook
 * Combines scroll, swipe, and click gesture detection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { ScrollGestureDetector, ScrollGestureConfig } from '@/gestures/scrollGestureUtils';
import { SwipeGestureDetector, SwipeGestureConfig } from '@/gestures/swipeGestureUtils';
import { ClickGestureDetector, ClickGestureConfig, CursorPosition } from '@/gestures/clickGestureUtils';
import { detectOpenHand, Landmark } from '@/gestures/gestureUtils';

export interface AdvancedGestureSettings {
  scrollEnabled: boolean;
  swipeEnabled: boolean;
  clickEnabled: boolean;
  scrollSensitivity: number;
  swipeSensitivity: number;
  hoverTimeMs: number;
  hapticFeedback: boolean;
  showDebugOverlay: boolean;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedGestureSettings = {
  scrollEnabled: true,
  swipeEnabled: true,
  clickEnabled: true,
  scrollSensitivity: 1.0,
  swipeSensitivity: 1.0,
  hoverTimeMs: 400,
  hapticFeedback: true,
  showDebugOverlay: false,
};

interface AdvancedGesturesOptions {
  enabled: boolean;
  settings?: Partial<AdvancedGestureSettings>;
  onLandmarks?: (landmarks: Landmark[]) => void;
}

export interface AdvancedGestureDebugInfo {
  palmY: number;
  palmX: number;
  scrollVelocity: number;
  scrollDirection: string | null;
  scrollCooldown: number;
  swipeVelocity: number;
  swipeDirection: string | null;
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  hoveredElement: string | null;
  hoverProgress: number;
  lastGesture: string | null;
  fps: number;
}

export const useAdvancedGestures = (options: AdvancedGesturesOptions) => {
  const settings = { ...DEFAULT_ADVANCED_SETTINGS, ...options.settings };
  const location = useLocation();
  const { toast } = useToast();
  
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [songIndex, setSongIndex] = useState(0);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState<AdvancedGestureDebugInfo>({
    palmY: 0,
    palmX: 0,
    scrollVelocity: 0,
    scrollDirection: null,
    scrollCooldown: 0,
    swipeVelocity: 0,
    swipeDirection: null,
    cursorX: 0,
    cursorY: 0,
    isPinching: false,
    hoveredElement: null,
    hoverProgress: 0,
    lastGesture: null,
    fps: 0,
  });

  const scrollDetectorRef = useRef<ScrollGestureDetector | null>(null);
  const swipeDetectorRef = useRef<SwipeGestureDetector | null>(null);
  const clickDetectorRef = useRef<ClickGestureDetector | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const fpsRef = useRef(0);

  const { playTrack, playlist, skipNext, skipPrevious } = useMusicPlayer();

  // Handle swipe actions based on current page
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const isHomePage = location.pathname === '/home' || location.pathname === '/';
    const isLibraryPage = location.pathname === '/library';
    const isPlaylistPage = location.pathname.startsWith('/playlist/');

    if (isHomePage) {
      // On home page: swipe through recommendation songs
      const songCards = document.querySelectorAll('[data-song-id], [data-song-index], [data-gesture-clickable]');
      if (songCards.length === 0) return;

      let newIndex = songIndex;
      if (direction === 'left') {
        newIndex = (songIndex + 1) % songCards.length;
      } else {
        newIndex = (songIndex - 1 + songCards.length) % songCards.length;
      }
      setSongIndex(newIndex);

      // Scroll to and highlight the card
      const targetCard = songCards[newIndex] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Remove previous highlights
        songCards.forEach(card => card.classList.remove('gesture-swipe-highlight'));
        targetCard.classList.add('gesture-swipe-highlight');

        toast({
          title: direction === 'left' ? '👈 Next Song' : '👉 Previous Song',
          description: `Song ${newIndex + 1} of ${songCards.length}`,
          duration: 1500,
        });
      }
    } else if (isLibraryPage) {
      // On library page: swipe through playlists
      const playlistCards = document.querySelectorAll('[data-playlist-id], .playlist-card');
      if (playlistCards.length === 0) return;

      let newIndex = playlistIndex;
      if (direction === 'left') {
        newIndex = (playlistIndex + 1) % playlistCards.length;
      } else {
        newIndex = (playlistIndex - 1 + playlistCards.length) % playlistCards.length;
      }
      setPlaylistIndex(newIndex);

      // Scroll to and highlight the playlist
      const targetPlaylist = playlistCards[newIndex] as HTMLElement;
      if (targetPlaylist) {
        targetPlaylist.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        playlistCards.forEach(card => card.classList.remove('gesture-swipe-highlight'));
        targetPlaylist.classList.add('gesture-swipe-highlight');

        toast({
          title: direction === 'left' ? '👈 Next Playlist' : '👉 Previous Playlist',
          description: `Playlist ${newIndex + 1} of ${playlistCards.length}`,
          duration: 1500,
        });
      }
    } else if (isPlaylistPage) {
      // On playlist detail page: swipe to play next/previous song
      if (direction === 'left') {
        skipNext();
        toast({ title: '⏭️ Next Track', duration: 1500 });
      } else {
        skipPrevious();
        toast({ title: '⏮️ Previous Track', duration: 1500 });
      }
    }

    setLastGesture(`swipe_${direction}`);

    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [location.pathname, songIndex, playlistIndex, skipNext, skipPrevious, toast, settings.hapticFeedback]);

  // Initialize detectors
  useEffect(() => {
    if (!options.enabled) return;

    console.log('🎮 [useAdvancedGestures] Initializing detectors...');

    // Initialize scroll detector
    if (settings.scrollEnabled) {
      const scrollConfig: Partial<ScrollGestureConfig> = {
        sensitivity: settings.scrollSensitivity,
      };
      scrollDetectorRef.current = new ScrollGestureDetector(scrollConfig);
      
      scrollDetectorRef.current.onScroll((direction) => {
        const scrollAmount = 200;
        const scrollY = direction === 'down' ? scrollAmount : -scrollAmount;
        
        window.scrollBy({
          top: scrollY,
          behavior: 'smooth',
        });

        setLastGesture(`scroll_${direction}`);

        if (settings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(50);
        }

        toast({
          title: `📜 Scroll ${direction === 'up' ? '⬆️' : '⬇️'}`,
          description: `Scrolled ${direction}`,
          duration: 1500,
        });
      });
    }

    // Initialize swipe detector
    if (settings.swipeEnabled) {
      const swipeConfig: Partial<SwipeGestureConfig> = {
        sensitivity: settings.swipeSensitivity,
      };
      swipeDetectorRef.current = new SwipeGestureDetector(swipeConfig);
      swipeDetectorRef.current.onSwipe(handleSwipe);
    }

    // Initialize click detector
    if (settings.clickEnabled) {
      const clickConfig: Partial<ClickGestureConfig> = {
        hoverTimeMs: settings.hoverTimeMs,
      };
      clickDetectorRef.current = new ClickGestureDetector(clickConfig);

      clickDetectorRef.current.onCursorMove((position) => {
        setCursorPosition(position);
      });

      clickDetectorRef.current.onHover((element, progress) => {
        setHoveredElement(element);
        setHoverProgress(progress);
        
        if (element) {
          element.classList.add('gesture-hover-highlight');
        }
      });

      clickDetectorRef.current.onClick((element) => {
        handleClickAction(element);
        setLastGesture('click');

        if (settings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      });
    }

    return () => {
      scrollDetectorRef.current = null;
      swipeDetectorRef.current = null;
      clickDetectorRef.current = null;
    };
  }, [options.enabled, settings.scrollEnabled, settings.swipeEnabled, settings.clickEnabled, settings.scrollSensitivity, settings.swipeSensitivity, settings.hoverTimeMs, settings.hapticFeedback, handleSwipe, toast]);

  // Handle click action
  const handleClickAction = useCallback((element: Element) => {
    const songId = element.getAttribute('data-song-id');
    const songIndexAttr = element.getAttribute('data-song-index');
    const playlistId = element.getAttribute('data-playlist-id');
    
    console.log('👆 [useAdvancedGestures] Click action:', { songId, songIndex: songIndexAttr, playlistId });

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
      }
    } else if (playlistId) {
      // Navigate to playlist - trigger click
      if (element instanceof HTMLElement) {
        element.click();
      }
    } else {
      if (element instanceof HTMLElement) {
        element.click();
      }
    }

    element.classList.remove('gesture-hover-highlight');
  }, [playTrack, playlist, toast]);

  // Process landmarks
  const processLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!options.enabled) return;

    // Update FPS counter
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    const isOpenHand = detectOpenHand(landmarks).detected;

    // Process scroll detection
    if (scrollDetectorRef.current && settings.scrollEnabled) {
      scrollDetectorRef.current.processLandmarks(landmarks, isOpenHand);
    }

    // Process swipe detection
    if (swipeDetectorRef.current && settings.swipeEnabled) {
      swipeDetectorRef.current.processLandmarks(landmarks, isOpenHand);
    }

    // Process click detection
    if (clickDetectorRef.current && settings.clickEnabled) {
      const confidence = 0.85;
      clickDetectorRef.current.processLandmarks(landmarks, confidence);
      
      const clickDebug = clickDetectorRef.current.getDebugInfo();
      setIsPinching(clickDebug.isPinching);
    }

    // Update debug info
    const scrollDebug = scrollDetectorRef.current?.getDebugInfo();
    const swipeDebug = swipeDetectorRef.current?.getDebugInfo();
    const clickDebug = clickDetectorRef.current?.getDebugInfo();
    
    setDebugInfo({
      palmY: scrollDebug?.palmY || 0,
      palmX: swipeDebug?.palmX || 0,
      scrollVelocity: scrollDebug?.velocity || 0,
      scrollDirection: scrollDebug?.direction || null,
      scrollCooldown: scrollDebug?.cooldownRemaining || 0,
      swipeVelocity: swipeDebug?.velocity || 0,
      swipeDirection: swipeDebug?.direction || null,
      cursorX: clickDebug?.cursorX || 0,
      cursorY: clickDebug?.cursorY || 0,
      isPinching: clickDebug?.isPinching || false,
      hoveredElement: clickDebug?.hoveredElement || null,
      hoverProgress: clickDebug?.hoverProgress || 0,
      lastGesture,
      fps: fpsRef.current,
    });

    options.onLandmarks?.(landmarks);
  }, [options.enabled, settings.scrollEnabled, settings.swipeEnabled, settings.clickEnabled, lastGesture, options.onLandmarks]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AdvancedGestureSettings>) => {
    if (scrollDetectorRef.current && newSettings.scrollSensitivity !== undefined) {
      scrollDetectorRef.current.updateConfig({ sensitivity: newSettings.scrollSensitivity });
    }
    if (swipeDetectorRef.current && newSettings.swipeSensitivity !== undefined) {
      swipeDetectorRef.current.updateConfig({ sensitivity: newSettings.swipeSensitivity });
    }
    if (clickDetectorRef.current && newSettings.hoverTimeMs !== undefined) {
      clickDetectorRef.current.updateConfig({ hoverTimeMs: newSettings.hoverTimeMs });
    }
  }, []);

  return {
    processLandmarks,
    cursorPosition,
    isPinching,
    hoverProgress,
    hoveredElement,
    lastGesture,
    debugInfo,
    updateSettings,
    showCursor: settings.clickEnabled && options.enabled,
    showDebugOverlay: settings.showDebugOverlay && options.enabled,
  };
};
