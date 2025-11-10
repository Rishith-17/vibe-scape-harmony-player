import { AsrEngine } from '../types';

/**
 * ASR engine using Web Speech API
 * Primary ASR engine with browser support
 */
export class WebSpeechAsr implements AsrEngine {
  private recognition: any = null;
  private isListening = false;
  private resultCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;

  constructor(private language: string = 'en-IN') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      if (!this.resultCallback) return;

      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      this.resultCallback(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      if (this.errorCallback) {
        this.errorCallback(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  async start(): Promise<void> {
    if (this.isListening) return;

    try {
      console.log('[WebSpeechAsr] Starting speech recognition...');
      this.recognition.start();
      this.isListening = true;
      console.log('[WebSpeechAsr] Speech recognition started successfully');
    } catch (error) {
      console.error('[WebSpeechAsr] Failed to start:', error);
      throw new Error(`Failed to start speech recognition: ${error}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  onResult(callback: (transcript: string, isFinal: boolean) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
}
