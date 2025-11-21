/**
 * Gesture Controller - Central gesture event management
 * Handles debouncing, stabilization, and action mapping
 */

import { analyzeGestureFromLandmarks, GestureAnalysis } from './gestureUtils';

export interface GestureConfig {
  confidenceThreshold: number;
  debounceMs: number;
  stabilityFrames: {
    thumbs_up: number;
    open_hand: number;
    fist: number;
    rock: number;
    peace: number;
  };
}

const DEFAULT_CONFIG: GestureConfig = {
  confidenceThreshold: 0.80, // Lower for faster response
  debounceMs: 300, // Cooldown between gestures
  stabilityFrames: {
    thumbs_up: 1, // Legacy - not used
    open_hand: 1, // Instant for voice control
    fist: 1, // Instant for play/pause
    rock: 2, // Require 2 frames for volume
    peace: 2, // Require 2 frames for volume
  },
};

export class GesturesController {
  private config: GestureConfig;
  private lastGestureTime: number = 0;
  private lastGestureLabel: string | null = null;
  private stabilityTracker: {
    label: string | null;
    count: number;
    firstSeen: number;
  } = { label: null, count: 0, firstSeen: 0 };
  
  private onGestureCallback: ((gesture: string, confidence: number) => void) | null = null;

  constructor(config?: Partial<GestureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🎮 [GesturesController] Initialized with config:', this.config);
  }

  /**
   * Process landmarks and emit gesture events
   */
  processLandmarks(landmarks: any[]): void {
    const now = Date.now();
    
    // Analyze gesture using fast heuristics
    const analysis = analyzeGestureFromLandmarks(landmarks);
    
    if (!analysis.label || analysis.confidence < this.config.confidenceThreshold) {
      // Reset stability if no valid gesture
      this.stabilityTracker = { label: null, count: 0, firstSeen: 0 };
      return;
    }

    // Track stability
    if (this.stabilityTracker.label === analysis.label) {
      this.stabilityTracker.count++;
    } else {
      this.stabilityTracker = {
        label: analysis.label,
        count: 1,
        firstSeen: now,
      };
    }

    // Check if gesture meets stability requirements
    const requiredFrames = this.config.stabilityFrames[analysis.label as keyof typeof this.config.stabilityFrames] || 2;
    
    if (this.stabilityTracker.count < requiredFrames) {
      console.log(`⏳ [GesturesController] ${analysis.label} stability: ${this.stabilityTracker.count}/${requiredFrames}`);
      return;
    }

    // Check debounce
    if (now - this.lastGestureTime < this.config.debounceMs) {
      console.log(`🚫 [GesturesController] ${analysis.label} debounced (${now - this.lastGestureTime}ms)`);
      return;
    }

    // Fire gesture event
    this.fireGesture(analysis.label, analysis.confidence, now);
    
    // Reset stability after firing
    this.stabilityTracker = { label: null, count: 0, firstSeen: 0 };
  }

  private fireGesture(label: string, confidence: number, timestamp: number): void {
    console.log(`✅ [GesturesController] Gesture fired: ${label} (confidence: ${confidence.toFixed(2)})`);
    
    this.lastGestureTime = timestamp;
    this.lastGestureLabel = label;

    if (this.onGestureCallback) {
      this.onGestureCallback(label, confidence);
    }
  }

  /**
   * Register callback for gesture events
   */
  onGesture(callback: (gesture: string, confidence: number) => void): void {
    this.onGestureCallback = callback;
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🎮 [GesturesController] Config updated:', this.config);
  }

  /**
   * Get last detected gesture info (for debugging)
   */
  getLastGesture(): { label: string | null; timestamp: number } {
    return {
      label: this.lastGestureLabel,
      timestamp: this.lastGestureTime,
    };
  }
}
