import { WakeWordEngine } from '../types';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure Porcupine Wake Word Engine
 * 
 * ARCHITECTURE:
 * 1. Fetches access key from server-side edge function (never embedded in client)
 * 2. Creates Porcupine worker with "Hello Vibe" keyword model
 * 3. Porcupine has its OWN audio stream (for wake detection only)
 * 4. On detection, signals VoiceController to use SHARED ASR instance
 * 
 * CRITICAL: This module creates ONE audio stream for wake detection.
 * It does NOT create command recognition mic - that's handled by VoiceController.
 */
export class PorcupineWebEngine implements WakeWordEngine {
  private isRunning = false;
  private detectionCallback: (() => void) | null = null;
  private sensitivity = 0.5;
  private porcupine: PorcupineWorker | null = null;
  private voiceController: any;

  constructor(voiceController?: any) {
    this.voiceController = voiceController;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.debug('[PorcupineWeb] Already running');
      return;
    }

    console.debug('[PorcupineWeb] 🚀 Starting wake word detection');
    this.isRunning = true;
    
    try {
      // Step 1: Fetch access key from secure server-side endpoint
      console.debug('[PorcupineWeb] 🔐 Fetching access key from server...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[PorcupineWeb] ⚠️ No authenticated session - cannot fetch key');
        return;
      }

      const { data, error } = await supabase.functions.invoke('picovoice-key', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || !data?.accessKey) {
        console.error('[PorcupineWeb] ❌ Failed to fetch access key:', error);
        console.warn('[PorcupineWeb] 💡 Configure PICOVOICE_ACCESS_KEY in Supabase secrets table');
        return;
      }

      const accessKey = data.accessKey;
      console.debug('[PorcupineWeb] ✅ Access key retrieved from server');

      // Step 2: Initialize Porcupine with Hello Vibe keyword model
      // Path is relative to public directory
      const modelPath = '/models/Hello-vibe_en_wasm_v3_0_0.ppn';
      console.debug('[PorcupineWeb] 📦 Loading keyword model:', modelPath);

      const porcupineModel = {
        publicPath: '/models/porcupine_params.pv',
      };

      this.porcupine = await PorcupineWorker.create(
        accessKey,
        [{
          publicPath: modelPath,
          label: 'Hello Vibe',
          sensitivity: this.sensitivity,
        }],
        (detection) => {
          if (detection.label === 'Hello Vibe') {
            this.handleWakeDetection();
          }
        },
        porcupineModel
      );

      // Step 3: Subscribe to audio stream (for wake detection only)
      console.debug('[PorcupineWeb] 🎤 Creating wake detection audio stream...');
      console.debug('[PorcupineWeb] 💡 NOTE: This audio stream is ONLY for wake word detection');
      console.debug('[PorcupineWeb] 💡 Command recognition uses SHARED ASR in VoiceController');
      
      await WebVoiceProcessor.subscribe(this.porcupine);

      console.debug('[PorcupineWeb] ✅ Wake word detection active - listening for "Hello Vibe"');
    } catch (error) {
      console.error('[PorcupineWeb] ❌ Failed to start wake word:', error);
      console.warn('[PorcupineWeb] ⚠️ Wake word disabled - use microphone button for voice commands');
      this.isRunning = false;
    }
  }

  private handleWakeDetection(): void {
    console.debug('[PorcupineWeb] 🎤 Wake word "Hello Vibe" detected!');

    // CRITICAL: Only signal the controller - do NOT create mic resources here
    // VoiceController decides how to handle mic arming and ASR startup
    console.debug('[PorcupineWeb] 🔔 Signaling VoiceController (NO new mic created)');
    
    if (this.detectionCallback) {
      this.detectionCallback();
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('[PorcupineWeb] 🛑 Stopping wake word detection');
    
    if (this.porcupine) {
      try {
        await WebVoiceProcessor.unsubscribe(this.porcupine);
        await this.porcupine.release();
        await this.porcupine.terminate();
      } catch (error) {
        console.error('[PorcupineWeb] Error stopping:', error);
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
  }
}
