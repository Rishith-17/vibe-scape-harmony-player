/**
 * Text-to-Speech engine using Web Speech API
 * Supports barge-in and cancellation
 */
export class TtsEngine {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, language: string = 'en-IN'): Promise<void> {
    return new Promise((resolve, reject) => {
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
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }
}
