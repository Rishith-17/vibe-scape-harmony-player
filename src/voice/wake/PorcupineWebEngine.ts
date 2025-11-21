import { WakeWordEngine } from '../types';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

/**
 * Wake word engine using Picovoice Porcupine Web SDK
 * Detects "Hello Vibe" wake word on-device
 * 
 * CRITICAL: This does NOT create mic resources - it only signals the voice controller
 * The voice controller's shared ASR instance handles all audio capture
 */
export class PorcupineWebEngine implements WakeWordEngine {
  private isRunning = false;
  private detectionCallback: (() => void) | null = null;
  private sensitivity = 0.5;
  private porcupine: PorcupineWorker | null = null;
  private voiceController: any; // Reference to voice controller for arming check

  constructor(voiceController?: any) {
    this.voiceController = voiceController;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.debug('[PorcupineWebEngine] Starting wake word detection');
    
    // Always mark as running
    this.isRunning = true;
    
    try {
      // Get access key from Supabase secrets
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('secrets')
        .select('value')
        .eq('key', 'PICOVOICE_ACCESS_KEY')
        .single();
      
      const accessKey = data?.value;
      console.debug('[PorcupineWebEngine] Access key check:', {
        available: !!accessKey,
        length: accessKey?.length
      });
      
      if (!accessKey || accessKey.trim() === '') {
        console.warn('[PorcupineWebEngine] ⚠️ No access key found - configure in Voice Settings');
        return;
      }

      console.debug('[PorcupineWebEngine] ✅ Access key found');
      console.debug('[PorcupineWebEngine] 💡 NOTE: Porcupine creates its own audio stream for wake detection');
      console.debug('[PorcupineWebEngine] 💡 This is separate from the shared ASR mic instance');

      // Initialize Porcupine with the custom "Hello Vibe" model
      // Use full URL for reliable model loading
      const modelPath = `${window.location.origin}/models/Hello-vibe_en_wasm_v3_0_0.ppn`;
      console.debug('[PorcupineWebEngine] Loading model from:', modelPath);
      
      this.porcupine = await PorcupineWorker.create(
        accessKey,
        [{ 
          publicPath: modelPath,
          label: 'Hello Vibe', 
          sensitivity: this.sensitivity 
        }],
        (detection) => {
          if (detection.label === 'Hello Vibe' && this.detectionCallback) {
            console.debug('[PorcupineWebEngine] 🎤 Wake word "Hello Vibe" detected!');
            console.debug('[PorcupineWebEngine] 🔔 Signaling voice controller (NO new mic created)');
            
            // Check if mic is armed before triggering
            if (this.voiceController && !this.voiceController.isMicArmed()) {
              console.warn('[PorcupineWebEngine] ⚠️ Wake word detected but mic not armed');
              console.warn('[PorcupineWebEngine] 💡 User must tap mic button first to grant permission');
              return;
            }
            
            // CRITICAL: Only signal the controller - do NOT create mic resources here
            // The controller will check if mic is armed before starting ASR
            this.detectionCallback();
          }
        },
        {} // Model parameters (using default)
      );

      console.debug('[PorcupineWebEngine] Porcupine worker created, subscribing to voice processor...');
      
      // Subscribe to WebVoiceProcessor to start listening for wake word
      // Note: This audio stream is ONLY for wake word detection
      await WebVoiceProcessor.subscribe(this.porcupine);

      console.debug('[PorcupineWebEngine] ✅ Wake word detection active - say "Hello Vibe"');
    } catch (error) {
      console.error('[PorcupineWebEngine] ❌ Failed to start wake word:', error);
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
