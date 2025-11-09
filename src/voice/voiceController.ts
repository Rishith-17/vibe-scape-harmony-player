import { VoiceState, MusicController, NavControllerAdapter } from './types';
import { parseIntent, HELP_TEXT } from './nlu/intentParser';
import { WebSpeechAsr } from './asr/WebSpeechAsr';
import { PorcupineWebEngine } from './wake/PorcupineWebEngine';
import { TtsEngine } from './tts/tts';
import { EarconPlayer } from './EarconPlayer';

/**
 * Main voice controller - orchestrates wake → ASR → NLU → action flow
 * Isolated from app internals via controller adapters
 */
export class VoiceController {
  private state: VoiceState = 'idle';
  private wakeEngine: PorcupineWebEngine;
  private asrEngine: WebSpeechAsr;
  private ttsEngine: TtsEngine;
  private earconPlayer: EarconPlayer;
  private stateChangeCallback: ((state: VoiceState) => void) | null = null;

  constructor(
    private musicController: MusicController,
    private navController: NavControllerAdapter,
    private config: {
      language: string;
      wakeSensitivity: number;
      ttsEnabled: boolean;
    }
  ) {
    this.wakeEngine = new PorcupineWebEngine();
    this.asrEngine = new WebSpeechAsr(config.language);
    this.ttsEngine = new TtsEngine();
    this.earconPlayer = new EarconPlayer();

    this.setupEngines();
  }

  private setupEngines(): void {
    // Wake word detection
    this.wakeEngine.onDetection(() => {
      console.log('[VoiceController] Wake word detected');
      this.onWakeDetected();
    });
    this.wakeEngine.setSensitivity(this.config.wakeSensitivity);

    // ASR callbacks
    this.asrEngine.onResult((transcript, isFinal) => {
      if (isFinal) {
        console.log('[VoiceController] Final transcript:', transcript);
        this.processTranscript(transcript);
      }
    });

    this.asrEngine.onError((error) => {
      console.error('[VoiceController] ASR error:', error);
      this.setState('error');
      this.earconPlayer.play('error');
      setTimeout(() => this.reset(), 2000);
    });
  }

  async initialize(): Promise<void> {
    await this.earconPlayer.initialize();
    console.log('[VoiceController] Initialized');
  }

  async start(): Promise<void> {
    await this.wakeEngine.start();
    this.setState('idle');
    console.log('[VoiceController] Started - listening for wake word');
  }

  async stop(): Promise<void> {
    await this.wakeEngine.stop();
    await this.asrEngine.stop();
    this.ttsEngine.cancel();
    this.setState('idle');
    console.log('[VoiceController] Stopped');
  }

  private async onWakeDetected(): Promise<void> {
    this.earconPlayer.play('wake');
    this.setState('listening');
    
    try {
      await this.asrEngine.start();
      this.earconPlayer.play('listen');
    } catch (error) {
      console.error('[VoiceController] Failed to start ASR:', error);
      this.setState('error');
      this.earconPlayer.play('error');
      setTimeout(() => this.reset(), 2000);
    }
  }

  private async processTranscript(transcript: string): Promise<void> {
    this.setState('processing');
    await this.asrEngine.stop();

    try {
      const intent = parseIntent(transcript);
      console.log('[VoiceController] Parsed intent:', intent);

      if (intent.confidence < 0.5) {
        await this.speak("Sorry, I didn't understand that.");
        this.earconPlayer.play('error');
        this.reset();
        return;
      }

      await this.executeIntent(intent);
      this.earconPlayer.play('success');
    } catch (error) {
      console.error('[VoiceController] Error processing command:', error);
      await this.speak('Sorry, something went wrong.');
      this.earconPlayer.play('error');
    }

    this.reset();
  }

  private async executeIntent(intent: any): Promise<void> {
    const { action, slots } = intent;

    try {
      switch (action) {
        case 'play':
          this.musicController.play();
          await this.speak('Playing');
          break;

        case 'pause':
          this.musicController.pause();
          await this.speak('Paused');
          break;

        case 'resume':
          this.musicController.resume();
          await this.speak('Resuming');
          break;

        case 'next':
          this.musicController.next();
          await this.speak('Next track');
          break;

        case 'previous':
          this.musicController.previous();
          await this.speak('Previous track');
          break;

        case 'volume_up':
          this.musicController.adjustVolume(10);
          await this.speak('Volume up');
          break;

        case 'volume_down':
          this.musicController.adjustVolume(-10);
          await this.speak('Volume down');
          break;

        case 'volume_set':
          if (slots.volume !== undefined) {
            this.musicController.setVolume(slots.volume);
            await this.speak(`Volume set to ${slots.volume}`);
          }
          break;

        case 'play_query':
          if (slots.query) {
            await this.musicController.playQuery(slots.query);
            await this.speak(`Playing ${slots.query}`);
          }
          break;

        case 'play_mood':
          if (slots.mood) {
            await this.musicController.playMood(slots.mood);
            await this.speak(`Playing ${slots.mood} music`);
          }
          break;

        case 'search':
          if (slots.query) {
            this.navController.openSearch(slots.query);
            await this.speak(`Searching for ${slots.query}`);
          }
          break;

        case 'navigate':
          if (slots.navigation === 'emotions') this.navController.openEmotionDetection();
          else if (slots.navigation === 'library') this.navController.openLibrary();
          else if (slots.navigation === 'settings') this.navController.openSettings();
          else if (slots.navigation === 'home') this.navController.openHome();
          else if (slots.navigation === 'search') this.navController.openSearch();
          await this.speak(`Opening ${slots.navigation}`);
          break;

        case 'help':
          await this.speak(HELP_TEXT);
          break;

        default:
          await this.speak("I don't know how to do that yet.");
      }
    } catch (error: any) {
      await this.speak(error.message || 'Sorry, I could not complete that action.');
      throw error;
    }
  }

  private async speak(text: string): Promise<void> {
    if (!this.config.ttsEnabled) return;

    this.setState('speaking');
    try {
      await this.ttsEngine.speak(text, this.config.language);
    } catch (error) {
      console.error('[VoiceController] TTS error:', error);
    }
  }

  private reset(): void {
    this.setState('idle');
  }

  private setState(state: VoiceState): void {
    this.state = state;
    if (this.stateChangeCallback) {
      this.stateChangeCallback(state);
    }
  }

  onStateChange(callback: (state: VoiceState) => void): void {
    this.stateChangeCallback = callback;
  }

  getState(): VoiceState {
    return this.state;
  }

  updateConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config, config);
    if (config.wakeSensitivity !== undefined) {
      this.wakeEngine.setSensitivity(config.wakeSensitivity);
    }
    if (config.language !== undefined) {
      this.asrEngine.setLanguage(config.language);
    }
  }

  destroy(): void {
    this.stop();
    this.earconPlayer.destroy();
  }

  // Manual trigger for mobile/push-to-talk
  async manualTrigger(): Promise<void> {
    console.log('[VoiceController] Manual voice trigger activated');
    await this.onWakeDetected();
  }
}
