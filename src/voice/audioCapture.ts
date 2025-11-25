/**
 * Audio Capture Utility for AI Analysis
 * 
 * Captures audio segments for Flamingo analysis:
 * - Records user's spoken questions
 * - Captures current playing audio snippets
 * - Converts to base64 for API transmission
 */

export class AudioCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Start recording audio from microphone
   * @param durationMs - Recording duration in milliseconds (default: 5000ms = 5 seconds)
   */
  async startRecording(durationMs: number = 5000): Promise<string> {
    console.log('[AudioCapture] 🎤 Starting audio capture...');

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
        } 
      });

      // Create MediaRecorder
      const options = { mimeType: 'audio/webm' };
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Return promise that resolves with base64 audio
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }

        this.mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const base64Audio = await this.blobToBase64(audioBlob);
            console.log('[AudioCapture] ✅ Audio captured:', audioBlob.size, 'bytes');
            this.cleanup();
            resolve(base64Audio);
          } catch (error) {
            console.error('[AudioCapture] ❌ Error converting audio:', error);
            this.cleanup();
            reject(error);
          }
        };

        this.mediaRecorder.onerror = (error) => {
          console.error('[AudioCapture] ❌ Recording error:', error);
          this.cleanup();
          reject(error);
        };

        // Start recording
        this.mediaRecorder.start();
        console.log('[AudioCapture] 🔴 Recording started for', durationMs, 'ms');

        // Auto-stop after duration
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.log('[AudioCapture] ⏹️ Stopping recording...');
            this.mediaRecorder.stop();
          }
        }, durationMs);
      });

    } catch (error) {
      console.error('[AudioCapture] ❌ Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Capture audio from current YouTube player
   * Uses Web Audio API to capture playback audio
   */
  async capturePlaybackAudio(durationMs: number = 5000): Promise<string> {
    console.log('[AudioCapture] 🎵 Capturing playback audio...');
    
    // For YouTube iframe, we can't directly capture audio due to CORS
    // Instead, we'll use the microphone to record what's playing
    // This is a limitation of browser security policies
    
    console.warn('[AudioCapture] ⚠️ Direct playback capture not possible with YouTube iframe');
    console.log('[AudioCapture] 🎤 Falling back to microphone recording');
    
    return this.startRecording(durationMs);
  }

  /**
   * Convert Blob to base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Stop recording immediately
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}

// Singleton instance
let audioCaptureInstance: AudioCapture | null = null;

export function getAudioCapture(): AudioCapture {
  if (!audioCaptureInstance) {
    audioCaptureInstance = new AudioCapture();
  }
  return audioCaptureInstance;
}
