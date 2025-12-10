/**
 * Horizontal Swipe Gesture Utilities
 * Detects left/right hand swipes for song/playlist navigation
 */

import { Landmark } from './gestureUtils';

export interface SwipeGestureConfig {
  velocityThreshold: number;
  stabilityMs: number;
  cooldownMs: number;
  smoothingWindow: number;
  sensitivity: number;
}

export const DEFAULT_SWIPE_CONFIG: SwipeGestureConfig = {
  velocityThreshold: 0.02,
  stabilityMs: 150,
  cooldownMs: 400,
  smoothingWindow: 5,
  sensitivity: 1.0,
};

interface SwipeState {
  palmXHistory: number[];
  timestampHistory: number[];
  lastSwipeTime: number;
  stableDirection: 'left' | 'right' | null;
  stableDirectionStart: number;
}

export class SwipeGestureDetector {
  private config: SwipeGestureConfig;
  private state: SwipeState;
  private onSwipeCallback: ((direction: 'left' | 'right') => void) | null = null;

  constructor(config?: Partial<SwipeGestureConfig>) {
    this.config = { ...DEFAULT_SWIPE_CONFIG, ...config };
    this.state = {
      palmXHistory: [],
      timestampHistory: [],
      lastSwipeTime: 0,
      stableDirection: null,
      stableDirectionStart: 0,
    };
    console.log('👋 [SwipeGestureDetector] Initialized');
  }

  private getPalmCenterX(landmarks: Landmark[]): number {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    return (wrist.x + middleMcp.x) / 2;
  }

  private calculateVelocity(): number {
    const { palmXHistory, timestampHistory } = this.state;
    
    if (palmXHistory.length < 2) return 0;
    
    const startIdx = Math.max(0, palmXHistory.length - this.config.smoothingWindow);
    const endIdx = palmXHistory.length - 1;
    
    const deltaX = palmXHistory[endIdx] - palmXHistory[startIdx];
    const deltaTime = timestampHistory[endIdx] - timestampHistory[startIdx];
    
    if (deltaTime === 0) return 0;
    
    return (deltaX / deltaTime) * 1000 * this.config.sensitivity;
  }

  processLandmarks(landmarks: Landmark[], isOpenHand: boolean): void {
    const now = Date.now();
    
    if (!isOpenHand || !landmarks || landmarks.length < 21) {
      this.resetState();
      return;
    }

    const palmX = this.getPalmCenterX(landmarks);
    
    this.state.palmXHistory.push(palmX);
    this.state.timestampHistory.push(now);
    
    const maxHistory = this.config.smoothingWindow * 2;
    if (this.state.palmXHistory.length > maxHistory) {
      this.state.palmXHistory = this.state.palmXHistory.slice(-maxHistory);
      this.state.timestampHistory = this.state.timestampHistory.slice(-maxHistory);
    }

    const velocity = this.calculateVelocity();
    
    let direction: 'left' | 'right' | null = null;
    const effectiveThreshold = this.config.velocityThreshold / this.config.sensitivity;
    
    // In camera view: hand moving left (negative X) = swipe left
    if (velocity < -effectiveThreshold) {
      direction = 'left';
    } else if (velocity > effectiveThreshold) {
      direction = 'right';
    }

    if (direction !== this.state.stableDirection) {
      this.state.stableDirection = direction;
      this.state.stableDirectionStart = now;
    }

    if (direction && this.state.stableDirection === direction) {
      const stableDuration = now - this.state.stableDirectionStart;
      
      if (stableDuration >= this.config.stabilityMs) {
        if (now - this.state.lastSwipeTime >= this.config.cooldownMs) {
          this.triggerSwipe(direction);
          this.state.lastSwipeTime = now;
          this.state.stableDirection = null;
          this.state.stableDirectionStart = 0;
        }
      }
    }
  }

  private triggerSwipe(direction: 'left' | 'right'): void {
    console.log(`👋 [SwipeGestureDetector] Swipe: ${direction}`);
    if (this.onSwipeCallback) {
      this.onSwipeCallback(direction);
    }
  }

  private resetState(): void {
    this.state.palmXHistory = [];
    this.state.timestampHistory = [];
    this.state.stableDirection = null;
    this.state.stableDirectionStart = 0;
  }

  onSwipe(callback: (direction: 'left' | 'right') => void): void {
    this.onSwipeCallback = callback;
  }

  updateConfig(config: Partial<SwipeGestureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getDebugInfo(): { palmX: number; velocity: number; direction: string | null } {
    return {
      palmX: this.state.palmXHistory[this.state.palmXHistory.length - 1] || 0,
      velocity: this.calculateVelocity(),
      direction: this.state.stableDirection,
    };
  }
}
