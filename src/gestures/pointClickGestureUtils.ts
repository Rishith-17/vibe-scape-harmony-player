/**
 * Point-to-Click Gesture Utilities
 * Index finger pointing = instant click (like mouse click)
 * No virtual cursor display - just detect where finger is pointing and click
 */

import { Landmark } from './gestureUtils';

export interface PointClickConfig {
  cooldownMs: number;
  confidenceThreshold: number;
  fingerExtendedThreshold: number; // How extended index finger must be
  otherFingersCurledThreshold: number; // How curled other fingers must be
}

export const DEFAULT_POINT_CLICK_CONFIG: PointClickConfig = {
  cooldownMs: 400,
  confidenceThreshold: 0.8,
  fingerExtendedThreshold: 0.15, // Index tip must be 15% higher than knuckle
  otherFingersCurledThreshold: 0.05, // Other fingers curled
};

export class PointClickDetector {
  private config: PointClickConfig;
  private lastClickTime: number = 0;
  private isPointing: boolean = false;
  private pointStartTime: number = 0;
  private onClickCallback: ((element: Element) => void) | null = null;

  constructor(config?: Partial<PointClickConfig>) {
    this.config = { ...DEFAULT_POINT_CLICK_CONFIG, ...config };
    console.log('👆 [PointClickDetector] Initialized');
  }

  /**
   * Detect if hand is in pointing position (index extended, others curled)
   */
  private detectPointing(landmarks: Landmark[]): boolean {
    // Index finger: landmarks 5 (MCP), 6 (PIP), 7 (DIP), 8 (TIP)
    const indexMCP = landmarks[5];
    const indexTip = landmarks[8];
    
    // Middle finger: 9 (MCP), 12 (TIP)
    const middleMCP = landmarks[9];
    const middleTip = landmarks[12];
    
    // Ring finger: 13 (MCP), 16 (TIP)
    const ringMCP = landmarks[13];
    const ringTip = landmarks[16];
    
    // Pinky: 17 (MCP), 20 (TIP)
    const pinkyMCP = landmarks[17];
    const pinkyTip = landmarks[20];
    
    // Check index is extended (tip higher than MCP in Y)
    const indexExtended = (indexMCP.y - indexTip.y) > this.config.fingerExtendedThreshold;
    
    // Check other fingers are curled (tips below or near MCPs)
    const middleCurled = (middleMCP.y - middleTip.y) < this.config.otherFingersCurledThreshold;
    const ringCurled = (ringMCP.y - ringTip.y) < this.config.otherFingersCurledThreshold;
    const pinkyCurled = (pinkyMCP.y - pinkyTip.y) < this.config.otherFingersCurledThreshold;
    
    return indexExtended && middleCurled && ringCurled && pinkyCurled;
  }

  /**
   * Get screen position where index finger is pointing
   */
  private getPointingPosition(landmarks: Landmark[]): { x: number; y: number } {
    const indexTip = landmarks[8];
    
    // Mirror X for screen coordinates
    const x = (1 - indexTip.x) * window.innerWidth;
    const y = indexTip.y * window.innerHeight;
    
    return { x, y };
  }

  /**
   * Find clickable element at position
   */
  private findClickableElement(x: number, y: number): Element | null {
    const elements = document.elementsFromPoint(x, y);
    
    for (const element of elements) {
      if (element.hasAttribute('data-song-id') ||
          element.hasAttribute('data-song-index') ||
          element.hasAttribute('data-gesture-clickable') ||
          element.hasAttribute('data-playlist-id')) {
        return element;
      }
      
      if (element.matches('button, [role="button"], a, .song-card, .track-item, .playlist-item')) {
        return element;
      }
      
      const clickable = element.closest('[data-song-id], [data-gesture-clickable], [data-playlist-id], .song-card, .track-item');
      if (clickable) {
        return clickable;
      }
    }
    
    return null;
  }

  processLandmarks(landmarks: Landmark[], confidence: number): void {
    const now = Date.now();
    
    if (!landmarks || landmarks.length < 21 || confidence < this.config.confidenceThreshold) {
      this.isPointing = false;
      return;
    }

    const isCurrentlyPointing = this.detectPointing(landmarks);
    
    // Detect transition from not pointing to pointing (the "click" moment)
    if (isCurrentlyPointing && !this.isPointing) {
      // Just started pointing - this is the click
      if (now - this.lastClickTime >= this.config.cooldownMs) {
        const pos = this.getPointingPosition(landmarks);
        const element = this.findClickableElement(pos.x, pos.y);
        
        if (element) {
          this.triggerClick(element);
          this.lastClickTime = now;
        }
      }
    }
    
    this.isPointing = isCurrentlyPointing;
  }

  private triggerClick(element: Element): void {
    console.log('👆 [PointClickDetector] Click!', element);
    
    // Visual feedback
    element.classList.add('gesture-click-feedback');
    setTimeout(() => element.classList.remove('gesture-click-feedback'), 300);
    
    if (this.onClickCallback) {
      this.onClickCallback(element);
    }
  }

  onClick(callback: (element: Element) => void): void {
    this.onClickCallback = callback;
  }

  updateConfig(config: Partial<PointClickConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getDebugInfo(): { isPointing: boolean } {
    return { isPointing: this.isPointing };
  }
}
