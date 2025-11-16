import { WakeWordEngine } from '../types';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

/**
 * Wake word engine using Picovoice Porcupine Web SDK
 * Detects "Hello Vibe" wake word on-device
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
      console.log('[PorcupineWebEngine] Access key check:', {
        available: !!accessKey,
        length: accessKey?.length,
        firstChars: accessKey?.substring(0, 10)
      });
      
      if (!accessKey || accessKey.trim() === '') {
        console.warn('[PorcupineWebEngine] ⚠️ No access key found - manual trigger only');
        console.warn('[PorcupineWebEngine] Set VITE_PICOVOICE_ACCESS_KEY in .env file');
        return;
      }

      console.log('[PorcupineWebEngine] ✅ Access key found, requesting microphone...');
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[PorcupineWebEngine] Microphone permission granted');

      // Initialize Porcupine with the custom "Hello Vibe" model
      // Use base path with origin for proper model loading
      const modelPath = `${window.location.origin}/models/Hello-vibe_en_wasm_v3_0_0.ppn`;
      console.log('[PorcupineWebEngine] Loading model from:', modelPath);
      
      this.porcupine = await PorcupineWorker.create(
        accessKey,
        [{ publicPath: modelPath, label: 'Hello Vibe', sensitivity: this.sensitivity }],
        (detection) => {
          if (detection.label === 'Hello Vibe' && this.detectionCallback) {
            console.log('[PorcupineWebEngine] 🎤 Wake word "Hello Vibe" detected!');
            this.detectionCallback();
          }
        },
        {} // Model parameters (using default)
      );

      console.log('[PorcupineWebEngine] Porcupine worker created, subscribing to voice processor...');
      
      // Subscribe to WebVoiceProcessor to start listening
      await WebVoiceProcessor.subscribe(this.porcupine);

      console.log('[PorcupineWebEngine] ✅ Wake word detection active - say "Hello Vibe"');
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
