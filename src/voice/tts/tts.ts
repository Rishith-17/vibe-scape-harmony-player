/**
 * Text-to-Speech engine using Web Speech API
 * Supports barge-in and cancellation
 */
export class TtsEngine {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    } else {
      console.warn('[TtsEngine] Speech synthesis not available');
      this.synth = null as any;
    }
  }

  speak(text: string, language: string = 'en-IN'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        console.warn('[TtsEngine] Speech synthesis not available');
        resolve(); // Silently resolve
        return;
      }
      
      // Cancel any ongoing speech
      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`TTS error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
