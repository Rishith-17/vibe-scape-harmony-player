/**
 * Scroll Gesture Utilities
 * Detects vertical palm movement for page scrolling
 */

import { Landmark } from './gestureUtils';

export interface ScrollGestureConfig {
  velocityThreshold: number; // Min velocity (normalized) to trigger scroll
  stabilityMs: number; // Minimum time for stable direction (ms)
  cooldownMs: number; // Cooldown between scroll actions
  scrollAmount: number; // Pixels to scroll per gesture
  smoothingWindow: number; // Number of frames for rolling average
  sensitivity: number; // 0.5 = less sensitive, 1 = normal, 2 = more sensitive
}

export const DEFAULT_SCROLL_CONFIG: ScrollGestureConfig = {
  velocityThreshold: 0.015, // Normalized Y velocity threshold
  stabilityMs: 200, // 200ms stability required
  cooldownMs: 300, // 300ms cooldown
  scrollAmount: 200, // 200px scroll
  smoothingWindow: 5, // 5 frame rolling average
  sensitivity: 1.0,
};

interface ScrollState {
  palmYHistory: number[];
  timestampHistory: number[];
  lastScrollTime: number;
  stableDirection: 'up' | 'down' | null;
  stableDirectionStart: number;
}

export class ScrollGestureDetector {
  private config: ScrollGestureConfig;
  private state: ScrollState;
  private onScrollCallback: ((direction: 'up' | 'down') => void) | null = null;

  constructor(config?: Partial<ScrollGestureConfig>) {
    this.config = { ...DEFAULT_SCROLL_CONFIG, ...config };
    this.state = {
      palmYHistory: [],
      timestampHistory: [],
      lastScrollTime: 0,
      stableDirection: null,
      stableDirectionStart: 0,
    };
    console.log('📜 [ScrollGestureDetector] Initialized with config:', this.config);
  }

  /**
   * Get palm center Y position from landmarks
   * Uses average of wrist (0) and middle finger MCP (9)
   */
  private getPalmCenterY(landmarks: Landmark[]): number {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    return (wrist.y + middleMcp.y) / 2;
  }

  /**
   * Calculate smoothed velocity using rolling average
   */
  private calculateVelocity(): number {
    const { palmYHistory, timestampHistory } = this.state;
    
    if (palmYHistory.length < 2) return 0;
    
    // Calculate velocity over the smoothing window
    const startIdx = Math.max(0, palmYHistory.length - this.config.smoothingWindow);
    const endIdx = palmYHistory.length - 1;
    
    const deltaY = palmYHistory[endIdx] - palmYHistory[startIdx];
    const deltaTime = timestampHistory[endIdx] - timestampHistory[startIdx];
    
    if (deltaTime === 0) return 0;
    
    // Velocity in normalized Y units per ms, adjusted by sensitivity
    return (deltaY / deltaTime) * 1000 * this.config.sensitivity;
  }

  /**
   * Process landmarks and detect scroll gestures
   */
  processLandmarks(landmarks: Landmark[], isOpenHand: boolean): void {
    const now = Date.now();
    
    // Only detect scroll when open hand is shown
    if (!isOpenHand || !landmarks || landmarks.length < 21) {
      // Reset state if not open hand
      this.resetState();
      return;
    }

    const palmY = this.getPalmCenterY(landmarks);
    
    // Add to history
    this.state.palmYHistory.push(palmY);
    this.state.timestampHistory.push(now);
    
    // Keep history bounded
    const maxHistory = this.config.smoothingWindow * 2;
    if (this.state.palmYHistory.length > maxHistory) {
      this.state.palmYHistory = this.state.palmYHistory.slice(-maxHistory);
      this.state.timestampHistory = this.state.timestampHistory.slice(-maxHistory);
    }

    // Calculate velocity
    const velocity = this.calculateVelocity();
    
    // Determine direction based on velocity
    let direction: 'up' | 'down' | null = null;
    const effectiveThreshold = this.config.velocityThreshold / this.config.sensitivity;
    
    if (velocity > effectiveThreshold) {
      direction = 'down'; // Hand moving down in camera = scroll down
    } else if (velocity < -effectiveThreshold) {
      direction = 'up'; // Hand moving up in camera = scroll up
    }

    // Track stable direction
    if (direction !== this.state.stableDirection) {
      this.state.stableDirection = direction;
      this.state.stableDirectionStart = now;
    }

    // Check if we should trigger scroll
    if (direction && this.state.stableDirection === direction) {
      const stableDuration = now - this.state.stableDirectionStart;
      
      if (stableDuration >= this.config.stabilityMs) {
        // Check cooldown
        if (now - this.state.lastScrollTime >= this.config.cooldownMs) {
          this.triggerScroll(direction);
          this.state.lastScrollTime = now;
          // Reset stable direction to prevent repeated triggers
          this.state.stableDirection = null;
          this.state.stableDirectionStart = 0;
        }
      }
    }
  }

  private triggerScroll(direction: 'up' | 'down'): void {
    console.log(`📜 [ScrollGestureDetector] Scroll triggered: ${direction}`);
    
    if (this.onScrollCallback) {
      this.onScrollCallback(direction);
    }
  }

  private resetState(): void {
    this.state.palmYHistory = [];
    this.state.timestampHistory = [];
    this.state.stableDirection = null;
    this.state.stableDirectionStart = 0;
  }

  onScroll(callback: (direction: 'up' | 'down') => void): void {
    this.onScrollCallback = callback;
  }

  updateConfig(config: Partial<ScrollGestureConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📜 [ScrollGestureDetector] Config updated:', this.config);
  }

  getDebugInfo(): { palmY: number; velocity: number; direction: string | null; cooldownRemaining: number } {
    const velocity = this.calculateVelocity();
    const now = Date.now();
    const cooldownRemaining = Math.max(0, this.config.cooldownMs - (now - this.state.lastScrollTime));
    
    return {
      palmY: this.state.palmYHistory[this.state.palmYHistory.length - 1] || 0,
      velocity,
      direction: this.state.stableDirection,
      cooldownRemaining,
    };
  }
}
