/**
 * Advanced Gestures Hook
 * Combines scroll and click gesture detection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { ScrollGestureDetector, ScrollGestureConfig } from '@/gestures/scrollGestureUtils';
import { ClickGestureDetector, ClickGestureConfig, CursorPosition } from '@/gestures/clickGestureUtils';
import { detectOpenHand, Landmark } from '@/gestures/gestureUtils';

export interface AdvancedGestureSettings {
  scrollEnabled: boolean;
  clickEnabled: boolean;
  scrollSensitivity: number; // 0.5 - 2.0
  hoverTimeMs: number; // 300 - 600
  hapticFeedback: boolean;
  showDebugOverlay: boolean;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedGestureSettings = {
  scrollEnabled: true,
  clickEnabled: true,
  scrollSensitivity: 1.0,
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
  scrollVelocity: number;
  scrollDirection: string | null;
  scrollCooldown: number;
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
  
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<AdvancedGestureDebugInfo>({
    palmY: 0,
    scrollVelocity: 0,
    scrollDirection: null,
    scrollCooldown: 0,
    cursorX: 0,
    cursorY: 0,
    isPinching: false,
    hoveredElement: null,
    hoverProgress: 0,
    lastGesture: null,
    fps: 0,
  });

  const scrollDetectorRef = useRef<ScrollGestureDetector | null>(null);
  const clickDetectorRef = useRef<ClickGestureDetector | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const fpsRef = useRef(0);

  const { playTrack, playlist } = useMusicPlayer();
  const { toast } = useToast();

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

        // Haptic feedback
        if (settings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(50);
        }

        toast({
          title: `📜 Scroll ${direction === 'up' ? '⬆️' : '⬇️'}`,
          description: `Scrolled ${direction} by ${scrollAmount}px`,
          duration: 1500,
        });
      });
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
        
        // Add highlight to hovered element
        if (element) {
          element.classList.add('gesture-hover-highlight');
        }
      });

      clickDetectorRef.current.onClick((element, position) => {
        handleClickAction(element);
        setLastGesture('click');

        // Haptic feedback
        if (settings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      });
    }

    return () => {
      scrollDetectorRef.current = null;
      clickDetectorRef.current = null;
    };
  }, [options.enabled, settings.scrollEnabled, settings.clickEnabled, settings.scrollSensitivity, settings.hoverTimeMs, settings.hapticFeedback]);

  // Handle click action
  const handleClickAction = useCallback((element: Element) => {
    const songId = element.getAttribute('data-song-id');
    const songIndex = element.getAttribute('data-song-index');
    
    console.log('👆 [useAdvancedGestures] Click action:', { songId, songIndex, element });

    if (songId || songIndex !== null) {
      // Find track by ID or index
      const index = songIndex ? parseInt(songIndex, 10) : playlist.findIndex(t => t.id === songId);
      
      if (index >= 0 && index < playlist.length) {
        const track = playlist[index];
        playTrack(track, playlist, index);
        
        toast({
          title: '🎵 Playing',
          description: track.title,
          duration: 2000,
        });
      }
    } else {
      // Try to click the element natively
      if (element instanceof HTMLElement) {
        element.click();
      }
    }

    // Remove highlight
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

    // Check if open hand for scroll gestures
    const isOpenHand = detectOpenHand(landmarks).detected;

    // Process scroll detection
    if (scrollDetectorRef.current && settings.scrollEnabled) {
      scrollDetectorRef.current.processLandmarks(landmarks, isOpenHand);
    }

    // Process click detection (always active when enabled)
    if (clickDetectorRef.current && settings.clickEnabled) {
      const confidence = 0.85; // We already have valid landmarks
      clickDetectorRef.current.processLandmarks(landmarks, confidence);
      
      // Update pinching state
      const clickDebug = clickDetectorRef.current.getDebugInfo();
      setIsPinching(clickDebug.isPinching);
    }

    // Update debug info
    const scrollDebug = scrollDetectorRef.current?.getDebugInfo();
    const clickDebug = clickDetectorRef.current?.getDebugInfo();
    
    setDebugInfo({
      palmY: scrollDebug?.palmY || 0,
      scrollVelocity: scrollDebug?.velocity || 0,
      scrollDirection: scrollDebug?.direction || null,
      scrollCooldown: scrollDebug?.cooldownRemaining || 0,
      cursorX: clickDebug?.cursorX || 0,
      cursorY: clickDebug?.cursorY || 0,
      isPinching: clickDebug?.isPinching || false,
      hoveredElement: clickDebug?.hoveredElement || null,
      hoverProgress: clickDebug?.hoverProgress || 0,
      lastGesture,
      fps: fpsRef.current,
    });

    // Pass to parent if needed
    options.onLandmarks?.(landmarks);
  }, [options.enabled, settings.scrollEnabled, settings.clickEnabled, lastGesture, options.onLandmarks]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AdvancedGestureSettings>) => {
    if (scrollDetectorRef.current && newSettings.scrollSensitivity !== undefined) {
      scrollDetectorRef.current.updateConfig({ sensitivity: newSettings.scrollSensitivity });
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
