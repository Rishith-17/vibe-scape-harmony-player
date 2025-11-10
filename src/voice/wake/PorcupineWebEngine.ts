import { WakeWordEngine } from '../types';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

/**
 * Wake word engine using Picovoice Porcupine Web SDK
 * Detects "Hey Vibe" wake word on-device
 */
export class PorcupineWebEngine implements WakeWordEngine {
  private isRunning = false;
  private detectionCallback: (() => void) | null = null;
  private sensitivity = 0.5;
  private porcupine: PorcupineWorker | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('[PorcupineWebEngine] Starting wake word detection');
    
    // Always mark as running to enable manual trigger
    this.isRunning = true;
    
    try {
      // Get access key from environment
      const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;
      console.log('[PorcupineWebEngine] Access key available:', !!accessKey);
      
      if (!accessKey) {
        console.warn('[PorcupineWebEngine] No access key - manual trigger only');
        return;
      }

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[PorcupineWebEngine] Microphone permission granted');

      // Initialize Porcupine with the custom "Hey Vibe" model
      this.porcupine = await PorcupineWorker.create(
        accessKey,
        [{ publicPath: '/models/Hey-vibe_en_wasm_v3_0_0.ppn', label: 'Hey Vibe', sensitivity: this.sensitivity }],
        (detection) => {
          if (detection.label === 'Hey Vibe' && this.detectionCallback) {
            console.log('[PorcupineWebEngine] 🎤 Wake word "Hey Vibe" detected!');
            this.detectionCallback();
          }
        },
        {} // Model parameters (using default)
      );

      console.log('[PorcupineWebEngine] Porcupine worker created, subscribing to voice processor...');
      
      // Subscribe to WebVoiceProcessor to start listening
      await WebVoiceProcessor.subscribe(this.porcupine);

      console.log('[PorcupineWebEngine] ✅ Wake word detection active - say "Hey Vibe"');
    } catch (error) {
      console.error('[PorcupineWebEngine] Failed to start wake word:', error);
      console.warn('[PorcupineWebEngine] ⚠️ Wake word disabled - use microphone button for voice commands');
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('[PorcupineWebEngine] Stopping wake word detection');
    
    if (this.porcupine) {
      try {
        await WebVoiceProcessor.unsubscribe(this.porcupine);
        await this.porcupine.release();
        await this.porcupine.terminate();
      } catch (error) {
        console.error('[PorcupineWebEngine] Error stopping:', error);
      }
      this.porcupine = null;
    }
    
    this.isRunning = false;
  }

  onDetection(callback: () => void): void {
    this.detectionCallback = callback;
  }

  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(1, value));
    // Note: Porcupine sensitivity is set during initialization
    // To change it, you need to reinitialize with new sensitivity values
  }
}
