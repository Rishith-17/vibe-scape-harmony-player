/**
 * Click Gesture Utilities
 * Detects pinch gesture for virtual cursor click
 */

import { Landmark } from './gestureUtils';

export interface ClickGestureConfig {
  pinchThreshold: number; // Distance threshold for pinch detection (normalized)
  hoverTimeMs: number; // Time required hovering over element before click accepted
  cooldownMs: number; // Cooldown between clicks
  confidenceThreshold: number; // Minimum confidence for click
  cursorSmoothing: number; // Smoothing factor for cursor position (0-1)
}

export const DEFAULT_CLICK_CONFIG: ClickGestureConfig = {
  pinchThreshold: 0.05, // 5% of normalized space
  hoverTimeMs: 400, // 400ms hover required
  cooldownMs: 500, // 500ms cooldown
  confidenceThreshold: 0.8,
  cursorSmoothing: 0.3, // Smooth cursor movement
};

export interface CursorPosition {
  x: number; // Screen X (pixels)
  y: number; // Screen Y (pixels)
  normalizedX: number; // 0-1 normalized
  normalizedY: number; // 0-1 normalized
}

interface ClickState {
  cursorHistory: CursorPosition[];
  hoveredElement: Element | null;
  hoverStartTime: number;
  lastClickTime: number;
  isPinching: boolean;
  pinchStartTime: number;
}

export class ClickGestureDetector {
  private config: ClickGestureConfig;
  private state: ClickState;
  private onClickCallback: ((element: Element, position: CursorPosition) => void) | null = null;
  private onCursorMoveCallback: ((position: CursorPosition) => void) | null = null;
  private onHoverCallback: ((element: Element | null, hoverProgress: number) => void) | null = null;

  constructor(config?: Partial<ClickGestureConfig>) {
    this.config = { ...DEFAULT_CLICK_CONFIG, ...config };
    this.state = {
      cursorHistory: [],
      hoveredElement: null,
      hoverStartTime: 0,
      lastClickTime: 0,
      isPinching: false,
      pinchStartTime: 0,
    };
    console.log('👆 [ClickGestureDetector] Initialized with config:', this.config);
  }

  /**
   * Get index finger tip position in screen coordinates
   */
  private getIndexFingerPosition(landmarks: Landmark[]): CursorPosition {
    const indexTip = landmarks[8];
    
    // Mirror X since camera is mirrored, and convert to screen coordinates
    const normalizedX = 1 - indexTip.x;
    const normalizedY = indexTip.y;
    
    return {
      x: normalizedX * window.innerWidth,
      y: normalizedY * window.innerHeight,
      normalizedX,
      normalizedY,
    };
  }

  /**
   * Detect pinch gesture (thumb tip close to index tip)
   */
  private detectPinch(landmarks: Landmark[]): boolean {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    // Calculate distance between thumb and index finger tips
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = thumbTip.z - indexTip.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    return distance < this.config.pinchThreshold;
  }

  /**
   * Smooth cursor position using exponential moving average
   */
  private smoothCursorPosition(newPos: CursorPosition): CursorPosition {
    if (this.state.cursorHistory.length === 0) {
      return newPos;
    }
    
    const lastPos = this.state.cursorHistory[this.state.cursorHistory.length - 1];
    const alpha = this.config.cursorSmoothing;
    
    return {
      x: lastPos.x + alpha * (newPos.x - lastPos.x),
      y: lastPos.y + alpha * (newPos.y - lastPos.y),
      normalizedX: lastPos.normalizedX + alpha * (newPos.normalizedX - lastPos.normalizedX),
      normalizedY: lastPos.normalizedY + alpha * (newPos.normalizedY - lastPos.normalizedY),
    };
  }

  /**
   * Find clickable element at cursor position
   */
  private findClickableElement(position: CursorPosition): Element | null {
    // Get all elements at cursor position
    const elements = document.elementsFromPoint(position.x, position.y);
    
    // Find song card or clickable element
    for (const element of elements) {
      // Check for data-song-id attribute (song cards)
      if (element.hasAttribute('data-song-id')) {
        return element;
      }
      
      // Check for data-gesture-clickable attribute
      if (element.hasAttribute('data-gesture-clickable')) {
        return element;
      }
      
      // Check for common clickable patterns
      if (element.matches('button, [role="button"], a, .song-card, .track-item, .playlist-item')) {
        return element;
      }
      
      // Check parent for song card
      const songCard = element.closest('[data-song-id], [data-gesture-clickable], .song-card, .track-item');
      if (songCard) {
        return songCard;
      }
    }
    
    return null;
  }

  /**
   * Process landmarks and detect click gestures
   */
  processLandmarks(landmarks: Landmark[], confidence: number): void {
    const now = Date.now();
    
    if (!landmarks || landmarks.length < 21 || confidence < this.config.confidenceThreshold) {
      // Reset hover state if no valid hand
      if (this.state.hoveredElement) {
        this.onHoverCallback?.(null, 0);
        this.state.hoveredElement = null;
        this.state.hoverStartTime = 0;
      }
      return;
    }

    // Get cursor position
    const rawPosition = this.getIndexFingerPosition(landmarks);
    const smoothedPosition = this.smoothCursorPosition(rawPosition);
    
    // Update cursor history
    this.state.cursorHistory.push(smoothedPosition);
    if (this.state.cursorHistory.length > 10) {
      this.state.cursorHistory = this.state.cursorHistory.slice(-10);
    }

    // Notify cursor position
    this.onCursorMoveCallback?.(smoothedPosition);

    // Check for pinch
    const isPinching = this.detectPinch(landmarks);
    
    // Track pinch state changes
    if (isPinching && !this.state.isPinching) {
      this.state.isPinching = true;
      this.state.pinchStartTime = now;
    } else if (!isPinching && this.state.isPinching) {
      this.state.isPinching = false;
    }

    // Find element under cursor
    const hoveredElement = this.findClickableElement(smoothedPosition);
    
    // Track hover state
    if (hoveredElement !== this.state.hoveredElement) {
      this.state.hoveredElement = hoveredElement;
      this.state.hoverStartTime = hoveredElement ? now : 0;
    }

    // Calculate hover progress
    let hoverProgress = 0;
    if (this.state.hoveredElement && this.state.hoverStartTime > 0) {
      hoverProgress = Math.min(1, (now - this.state.hoverStartTime) / this.config.hoverTimeMs);
    }
    
    // Notify hover state
    this.onHoverCallback?.(this.state.hoveredElement, hoverProgress);

    // Check for click trigger
    if (isPinching && this.state.hoveredElement) {
      const hoverDuration = now - this.state.hoverStartTime;
      
      if (hoverDuration >= this.config.hoverTimeMs) {
        // Check cooldown
        if (now - this.state.lastClickTime >= this.config.cooldownMs) {
          this.triggerClick(this.state.hoveredElement, smoothedPosition);
          this.state.lastClickTime = now;
          // Reset hover to prevent repeated clicks
          this.state.hoveredElement = null;
          this.state.hoverStartTime = 0;
        }
      }
    }
  }

  private triggerClick(element: Element, position: CursorPosition): void {
    console.log(`👆 [ClickGestureDetector] Click triggered on:`, element);
    
    if (this.onClickCallback) {
      this.onClickCallback(element, position);
    }
  }

  onClick(callback: (element: Element, position: CursorPosition) => void): void {
    this.onClickCallback = callback;
  }

  onCursorMove(callback: (position: CursorPosition) => void): void {
    this.onCursorMoveCallback = callback;
  }

  onHover(callback: (element: Element | null, hoverProgress: number) => void): void {
    this.onHoverCallback = callback;
  }

  updateConfig(config: Partial<ClickGestureConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('👆 [ClickGestureDetector] Config updated:', this.config);
  }

  getDebugInfo(): { cursorX: number; cursorY: number; isPinching: boolean; hoveredElement: string | null; hoverProgress: number } {
    const lastPos = this.state.cursorHistory[this.state.cursorHistory.length - 1];
    const now = Date.now();
    let hoverProgress = 0;
    if (this.state.hoveredElement && this.state.hoverStartTime > 0) {
      hoverProgress = Math.min(1, (now - this.state.hoverStartTime) / this.config.hoverTimeMs);
    }
    
    return {
      cursorX: lastPos?.x || 0,
      cursorY: lastPos?.y || 0,
      isPinching: this.state.isPinching,
      hoveredElement: this.state.hoveredElement?.getAttribute('data-song-id') || 
                      this.state.hoveredElement?.className.split(' ')[0] || null,
      hoverProgress,
    };
  }
}
