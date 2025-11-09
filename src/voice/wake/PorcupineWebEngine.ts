import { WakeWordEngine } from '../types';

/**
 * Wake word engine using Picovoice Porcupine Web SDK
 * STUB - Requires Porcupine access key and keyword model
 * 
 * Setup:
 * 1. Sign up at https://console.picovoice.ai/
 * 2. Create "Hey Vibe" keyword
 * 3. Download .ppn file
 * 4. Add access key to environment
 */
export class PorcupineWebEngine implements WakeWordEngine {
  private isRunning = false;
  private detectionCallback: (() => void) | null = null;
  private sensitivity = 0.5;
  private worker: Worker | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('[PorcupineWebEngine] Starting wake word detection (STUB)');
    
    // TODO: Initialize Porcupine Web Worker
    // const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;
    // if (!accessKey) {
    //   throw new Error('VITE_PICOVOICE_ACCESS_KEY not configured');
    // }

    // For now, simulate with a simple voice activity detection
    this.startSimpleVad();
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('[PorcupineWebEngine] Stopping wake word detection');
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.isRunning = false;
  }

  onDetection(callback: () => void): void {
    this.detectionCallback = callback;
  }

  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(1, value));
  }

  private startSimpleVad(): void {
    // Simple stub: Manually trigger via keyboard for testing
    // Press 'V' key to simulate wake word detection
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v' && this.detectionCallback) {
        console.log('[PorcupineWebEngine] Wake word detected (simulated)');
        this.detectionCallback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
  }
}
