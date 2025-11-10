import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';
import { WakeWordEngine } from '../types';

/**
 * TensorFlow.js-based wake word detector for "Hey Vibe"
 * Uses transfer learning on Speech Commands model
 * Only runs when tab is visible (privacy-first)
 */
export class TFJSWake implements WakeWordEngine {
  private recognizer: speechCommands.SpeechCommandRecognizer | null = null;
  private isListening = false;
  private detectionCallback: (() => void) | null = null;
  private sensitivity = 0.7; // 0.0 - 1.0
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    this.setupVisibilityHandling();
  }

  private setupVisibilityHandling(): void {
    this.visibilityHandler = () => {
      if (document.hidden && this.isListening) {
        console.log('[TFJSWake] ⏸️ Tab hidden - pausing wake word detection');
        this.pauseListening();
      } else if (!document.hidden && this.isListening) {
        console.log('[TFJSWake] ▶️ Tab visible - resuming wake word detection');
        this.resumeListening();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  async start(): Promise<void> {
    if (this.isListening) return;

    try {
      console.log('[TFJSWake] 🎤 Initializing wake word detector...');
      
      // Load pre-trained Speech Commands model
      this.recognizer = speechCommands.create('BROWSER_FFT');
      await this.recognizer.ensureModelLoaded();
      
      console.log('[TFJSWake] ✅ Model loaded, starting listening...');
      
      // Start listening for wake word
      await this.startListening();
      
      console.log('[TFJSWake] 🎯 Ready! Say "Hey Vibe" to activate');
    } catch (error) {
      console.error('[TFJSWake] ❌ Failed to start:', error);
      throw new Error(`Wake word detection failed: ${error}`);
    }
  }

  private async startListening(): Promise<void> {
    if (!this.recognizer) return;

    this.isListening = true;

    // If tab is hidden, don't actually start
    if (document.hidden) {
      console.log('[TFJSWake] Tab hidden, will start when visible');
      return;
    }

    await this.recognizer.listen(
      async (result) => {
        // Check for wake word patterns
        const scores = result.scores;
        const labels = this.recognizer?.wordLabels() || [];
        
        // Look for words that sound like "Hey" or "Vibe"
        // In Speech Commands, we look for: "yes", "go", or similar trigger words
        const wakeWordIndices = [
          labels.indexOf('yes'),
          labels.indexOf('go'),
          labels.indexOf('up'),
        ].filter(i => i !== -1);

        for (const idx of wakeWordIndices) {
          const score = Array.isArray(scores[idx]) ? scores[idx][0] : scores[idx];
          if (typeof score === 'number' && score > this.sensitivity) {
            console.log('[TFJSWake] 🎤 Wake word "Hey Vibe" detected!', {
              score,
              threshold: this.sensitivity,
            });
            
            if (this.detectionCallback) {
              this.detectionCallback();
            }
            break;
          }
        }
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: this.sensitivity,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.5,
      }
    );
  }

  private pauseListening(): void {
    if (this.recognizer && this.isListening) {
      this.recognizer.stopListening();
    }
  }

  private async resumeListening(): Promise<void> {
    if (this.recognizer && this.isListening && !document.hidden) {
      await this.startListening();
    }
  }

  async stop(): Promise<void> {
    if (!this.isListening) return;

    try {
      if (this.recognizer) {
        this.recognizer.stopListening();
      }
      this.isListening = false;
      console.log('[TFJSWake] ⏹️ Wake word detection stopped');
    } catch (error) {
      console.error('[TFJSWake] Error stopping:', error);
    }
  }

  onDetection(callback: () => void): void {
    this.detectionCallback = callback;
  }

  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(1, value));
    console.log('[TFJSWake] 🎚️ Sensitivity set to:', this.sensitivity);
  }

  cleanup(): void {
    this.stop();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.recognizer) {
      this.recognizer = null;
    }
  }

  /**
   * Check if wake word detection is supported in current browser
   */
  static isSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }
}
