import { VoiceState, MusicController, NavControllerAdapter } from './types';
import { parseIntent, ENHANCED_HELP_TEXT } from './nlu/intentParser.enhanced';
import { WebSpeechAsr } from './asr/WebSpeechAsr';
import { PorcupineWebEngine } from './wake/PorcupineWeb';
import { TtsEngine } from './tts/tts';
import { EarconPlayer } from './EarconPlayer';
import { runCommand } from './commandRunner';
import { setPlayerReady, whenReady } from './playerGate';
import { getAudioCapture } from './audioCapture';
import { supabase } from '@/integrations/supabase/client';
import { VoiceCommandRunner } from './voiceCommandRunner';
import { MusicAdapter } from './adapters/MusicAdapter';
import { NavigationAdapter } from './adapters/NavigationAdapter';
import { ScrollAdapter } from './adapters/ScrollAdapter';
import { UiAdapter } from './adapters/UiAdapter';

/**
 * SINGLETON Voice Controller - Single Shared Microphone/ASR Instance
 * 
 * All activation paths (Tap-Mic, Wake-word, Gesture) reuse the SAME mic/ASR instance.
 * No duplicate audio streams, overlays, or permission requests.
 * 
 * Principles:
 * - One mic/ASR instance only (singleton pattern)
 * - Wake and gesture ONLY signal this controller - they never create mic resources
 * - armMic() is the ONLY place where getUserMedia() may be called
 * - All activations produce identical behavior and UI state
 */

// Module-level singleton state - ensures single shared instance across all imports
let sharedMediaStream: MediaStream | null = null;
let sharedAsrEngine: WebSpeechAsr | null = null;
let sharedTtsEngine: TtsEngine | null = null;
let sharedEarconPlayer: EarconPlayer | null = null;
let sharedWakeEngine: PorcupineWebEngine | null = null;
let isAsrArmed = false;
let isListening = false;
let lastStartTimestamp = 0;
const DUPLICATE_SUPPRESSION_MS = 300;

// Stable instance ID for verification - generated once when first armed
let ASR_INSTANCE_ID: string | null = null;

// Global singleton voice controller instance (set by App.tsx after initialization)
let globalVoiceController: VoiceController | null = null;

// AI Response callback for displaying Flamingo responses
type AIResponseCallback = (response: string, isLoading: boolean) => void;
let aiResponseCallback: AIResponseCallback | null = null;

/**
 * Main voice controller - orchestrates wake → ASR → NLU → action flow
 * Now implements singleton pattern with shared resources
 */
export class VoiceController {
  private state: VoiceState = 'idle';
  private stateChangeCallback: ((state: VoiceState) => void) | null = null;
  private wakeEnabled = true;
  private musicController: MusicController;
  private navController: NavControllerAdapter;
  private commandRunner: VoiceCommandRunner;
  private config: {
    language: string;
    wakeSensitivity: number;
    ttsEnabled: boolean;
    wakeEnabled?: boolean;
  };

  constructor(
    musicController: MusicController,
    navController: NavControllerAdapter,
    config: {
      language: string;
      wakeSensitivity: number;
      ttsEnabled: boolean;
      wakeEnabled?: boolean;
    }
  ) {
    this.musicController = musicController;
    this.navController = navController;
    this.config = config;
    this.wakeEnabled = config.wakeEnabled !== false;

    // Initialize adapters for the command runner
    const musicAdapter = new MusicAdapter(musicController);
    const navigationAdapter = new NavigationAdapter(navController);
    const scrollAdapter = new ScrollAdapter();
    const uiAdapter = new UiAdapter();

    // Create command runner with all adapters
    this.commandRunner = new VoiceCommandRunner(
      musicAdapter,
      navigationAdapter,
      scrollAdapter,
      uiAdapter,
      config.ttsEnabled
    );

    // Initialize shared resources if not already created
    this.initializeSharedResources();
  }

  /**
   * Initialize shared resources (singleton pattern)
   * Called once by the first VoiceController instance
   */
  private initializeSharedResources(): void {
    if (!sharedTtsEngine) {
      sharedTtsEngine = new TtsEngine();
      console.debug('[VoiceController] 🔊 Created shared TTS engine');
    }

    if (!sharedEarconPlayer) {
      sharedEarconPlayer = new EarconPlayer();
      console.debug('[VoiceController] 🔔 Created shared Earcon player');
    }

    if (!sharedWakeEngine) {
      sharedWakeEngine = new PorcupineWebEngine(this);
      console.debug('[VoiceController] 🎯 Created shared Wake engine');
    }

    // Setup engine callbacks
    this.setupEngines();
  }

  /**
   * Setup engine callbacks - called during initialization
   */
  private setupEngines(): void {
    // Wake word detection callback
    if (sharedWakeEngine) {
      sharedWakeEngine.onDetection(() => {
        console.debug('[VoiceController] 🎤 Wake word "Hello Vibe" detected');
        this.onWakeDetected();
      });
      sharedWakeEngine.setSensitivity(this.config.wakeSensitivity);
    }

    // ASR callbacks will be set when ASR is armed
  }

  /**
   * Setup ASR callbacks after arming
   */
  private setupAsrCallbacks(): void {
    if (!sharedAsrEngine) return;

    sharedAsrEngine.onResult((transcript, isFinal) => {
      if (isFinal) {
        console.debug('[VoiceController] Final transcript:', transcript);
        this.processTranscript(transcript);
      }
    });

    sharedAsrEngine.onError((error) => {
      console.error('[VoiceController] ❌ ASR error:', error);
      this.setState('error');
      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('error');
      }
      setTimeout(() => this.reset(), 2000);
    });
  }

  async initialize(): Promise<void> {
    if (sharedEarconPlayer) {
      await sharedEarconPlayer.initialize();
    }
    console.debug('[VoiceController] ✅ Initialized');
    
    // Mark player as ready
    setPlayerReady(true);
    
    // Log current configuration
    console.debug('[VoiceController] Config:', {
      language: this.config.language,
      wakeSensitivity: this.config.wakeSensitivity,
      ttsEnabled: this.config.ttsEnabled,
      wakeEnabled: this.wakeEnabled,
      asrArmed: isAsrArmed,
      instanceId: ASR_INSTANCE_ID
    });
  }

  /**
   * PUBLIC API: Check if microphone has been armed by user
   * Returns true if user has granted permission and ASR instance is created
   */
  isMicArmed(): boolean {
    return isAsrArmed && sharedAsrEngine !== null;
  }

  /**
   * PUBLIC API: Get stable ASR instance ID for verification
   * Returns the same ID across all activation paths if using shared instance
   */
  getAsrInstanceId(): string | null {
    return ASR_INSTANCE_ID;
  }

  /**
   * PUBLIC API: Arm microphone - requests permission and creates shared ASR instance
   * This is the ONLY place where getUserMedia() may be called
   * Called by Tap-Mic on first user interaction
   */
  async armMic(): Promise<void> {
    // Already armed - reuse existing instance
    if (isAsrArmed && sharedAsrEngine) {
      console.debug('[VoiceController] ========================================');
      console.debug('[VoiceController] armMic() → Already armed, reusing existing ASR instance');
      console.debug(`[VoiceController] 🔍 ASR_ID=${ASR_INSTANCE_ID}`);
      console.debug(`[VoiceController] armMic ASR_ID=${ASR_INSTANCE_ID}`);
      console.debug('[VoiceController] ========================================');
      return;
    }

    console.debug('[VoiceController] ========================================');
    console.debug('[VoiceController] armMic() → Requesting microphone permission...');
    
    try {
      // THIS IS THE ONLY getUserMedia() CALL IN THE ENTIRE VOICE SYSTEM
      sharedMediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.debug('[VoiceController] ✅ Microphone permission granted');

      // Create shared ASR instance (singleton)
      if (!sharedAsrEngine) {
        sharedAsrEngine = new WebSpeechAsr(this.config.language);
        
        // Generate stable instance ID for verification
        ASR_INSTANCE_ID = `ASR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.debug(`[VoiceController] 🎤 Created shared ASR instance: ASR_ID=${ASR_INSTANCE_ID}`);
        
        // Setup callbacks
        this.setupAsrCallbacks();
      }

      isAsrArmed = true;
      console.debug(`[VoiceController] armMic ASR_ID=${ASR_INSTANCE_ID}`);
      console.debug('[VoiceController] ✅ Mic armed successfully - ready for all activation paths');
      console.debug('[VoiceController] ========================================');
      
    } catch (error) {
      console.error('[VoiceController] ❌ Failed to arm mic:', error);
      console.debug('[VoiceController] ========================================');
      isAsrArmed = false;
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // Start wake word detection only if enabled
      if (this.wakeEnabled && sharedWakeEngine) {
        await sharedWakeEngine.start();
        console.debug('[VoiceController] ✅ Voice control ready');
        console.debug('[VoiceController] 🎤 Say "Hello Vibe" or tap microphone button');
      } else {
        console.debug('[VoiceController] ✅ Voice control ready (Tap Mic only)');
      }
      this.setState('idle');
    } catch (error) {
      console.error('[VoiceController] ❌ Failed to start wake word:', error);
      console.debug('[VoiceController] ✅ Falling back to Tap Mic only');
      this.setState('idle'); // Still allow manual trigger
    }
  }

  async stop(): Promise<void> {
    if (sharedWakeEngine) {
      await sharedWakeEngine.stop();
    }
    if (sharedAsrEngine && isListening) {
      await sharedAsrEngine.stop();
      isListening = false;
    }
    if (sharedTtsEngine) {
      sharedTtsEngine.cancel();
    }
    this.setState('idle');
    console.debug('[VoiceController] Stopped');
  }

  /**
   * Wake word detection callback - reuses shared ASR instance
   */
  private async onWakeDetected(): Promise<void> {
    console.debug('[VoiceController] 🎤 Wake word "Hello Vibe" detected');

    // If mic is not armed yet, automatically arm it (requests permission once)
    if (!this.isMicArmed()) {
      console.debug('[VoiceController] 🔐 Mic not armed yet - auto-arming due to wake word');
      try {
        await this.armMic();
      } catch (error) {
        console.error('[VoiceController] ❌ Failed to auto-arm mic after wake word:', error);
        return;
      }
    }

    console.debug('[VoiceController] ✅ Mic armed, starting shared ASR instance:', ASR_INSTANCE_ID);
    await this.startListeningFromArmedMic('wake');
  }

  /**
   * PUBLIC API: Start listening using the already-armed shared ASR instance
   * 
   * This is called by:
   * - Tap-Mic button (after armMic())
   * - Wake word detection (Porcupine)
   * - Gesture control (open_hand)
   * 
   * CRITICAL: This method NEVER calls getUserMedia() or creates new SpeechRecognition
   * It only starts the already-created shared ASR instance
   * 
   * @param source - Optional source identifier for debugging ('tap'|'wake'|'gesture')
   */
  async startListeningFromArmedMic(source: string = 'unknown'): Promise<void> {
    const now = Date.now();
    
    console.debug('[VoiceController] ========================================');
    console.debug(`[VoiceController] startListeningFromArmedMic("${source}") called`);
    console.debug('[VoiceController] 📊 State:', {
      currentState: this.state,
      isArmed: isAsrArmed,
      isListening,
      instanceId: ASR_INSTANCE_ID,
      timeSinceLastStart: now - lastStartTimestamp,
      source
    });

    // Guard: Mic must be armed first
    if (!isAsrArmed || !sharedAsrEngine) {
      console.error('[VoiceController] ❌ Cannot start listening - mic not armed!');
      console.error('[VoiceController] 💡 User should tap mic button first to request permission');
      console.debug('[VoiceController] ========================================');
      return;
    }

    // Guard: Already listening or processing
    if (this.state === 'listening' || this.state === 'processing') {
      console.debug('[VoiceController] ⚠️ Already listening or processing - ignoring duplicate call');
      console.debug('[VoiceController] ========================================');
      return;
    }

    // Guard: Prevent rapid duplicate calls (debounce within 300ms)
    if (now - lastStartTimestamp < DUPLICATE_SUPPRESSION_MS) {
      console.debug('[VoiceController] ⚠️ Duplicate call suppressed (within 300ms window)');
      console.debug('[VoiceController] ========================================');
      return;
    }

    // Update timestamp
    lastStartTimestamp = now;

    console.debug(`[VoiceController] ✅ All guards passed - starting shared ASR: ASR_ID=${ASR_INSTANCE_ID}`);
    console.debug('[VoiceController] 🔄 Setting state to listening...');
    this.setState('listening');
    isListening = true;
    
    // Play audio feedback
    if (sharedEarconPlayer) {
      console.debug('[VoiceController] 🔊 Playing earcon...');
      sharedEarconPlayer.play('listen');
    }
    
    try {
      console.debug(`[VoiceController] 🎤 Starting shared ASR engine: ASR_ID=${ASR_INSTANCE_ID}`);
      await sharedAsrEngine.start();
      console.debug('[VoiceController] ✅ ASR started successfully - listening for command');
      console.debug('[VoiceController] ========================================');
    } catch (error) {
      console.error('[VoiceController] ❌ Failed to start ASR:', error);
      console.debug('[VoiceController] ========================================');
      this.setState('error');
      isListening = false;
      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('error');
      }
      setTimeout(() => this.reset(), 2000);
    }
  }

  private async processTranscript(transcript: string): Promise<void> {
    this.setState('processing');
    if (sharedAsrEngine) {
      await sharedAsrEngine.stop();
      isListening = false;
    }

    try {
      // Check if this is an audio analysis question
      if (this.isAudioAnalysisQuestion(transcript)) {
        console.log('[VoiceController] 🎵 Detected audio analysis question:', transcript);
        await this.handleAudioAnalysis(transcript);
        return;
      }

      const intent = parseIntent(transcript);
      console.log('[VoiceController] Parsed intent:', intent);

      if (intent.confidence < 0.5) {
        await this.speak("Sorry, I didn't understand that.");
        if (sharedEarconPlayer) {
          sharedEarconPlayer.play('error');
        }
        this.reset();
        return;
      }

      await this.executeIntent(intent);
      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('success');
      }
    } catch (error) {
      console.error('[VoiceController] Error processing command:', error);
      await this.speak('Sorry, something went wrong.');
      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('error');
      }
    }

    this.reset();
  }

  /**
   * Check if the transcript is asking for audio analysis
   */
  private isAudioAnalysisQuestion(transcript: string): boolean {
    const lower = transcript.toLowerCase();
    const audioKeywords = [
      'what instrument', 'what mood', 'what emotion', 'what genre',
      'describe', 'explain', 'analyze', 'what is this', 'what\'s this',
      'tell me about', 'what am i', 'what do you hear', 'sound like',
      'melody', 'harmony', 'tempo', 'beat', 'rhythm', 'vibe', 'feeling'
    ];
    
    return audioKeywords.some(keyword => lower.includes(keyword));
  }

  /**
   * Handle song Q&A using Gemini AI
   */
  private async handleAudioAnalysis(question: string, songTitle?: string, songArtist?: string): Promise<void> {
    console.log('[VoiceController] 🎤 Starting AI song analysis...');
    
    try {
      // Show loading state
      if (aiResponseCallback) {
        aiResponseCallback('', true);
      }

      // Use provided song info or fallback to unknown
      const title = songTitle || 'Unknown Song';
      const artist = songArtist || 'Unknown Artist';
      
      console.log('[VoiceController] 🎵 Song:', title, 'by', artist);
      console.log('[VoiceController] 📤 Sending to AI...');
      
      // Call song Q&A edge function with Gemini
      const { data, error } = await supabase.functions.invoke('flamingo-analyze', {
        body: {
          songTitle: title,
          songArtist: artist,
          question
        }
      });

      if (error) {
        console.error('[VoiceController] ❌ AI API error:', error);
        throw error;
      }

      const aiResponse = data.response || 'No response from AI';
      console.log('[VoiceController] ✅ AI response received');

      // Display response
      if (aiResponseCallback) {
        aiResponseCallback(aiResponse, false);
      }

      // Speak the response
      await this.speak(aiResponse);

      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('success');
      }

    } catch (error) {
      console.error('[VoiceController] ❌ Song analysis failed:', error);
      const errorMsg = 'Sorry, I could not analyze the song.';
      
      if (aiResponseCallback) {
        aiResponseCallback(errorMsg, false);
      }
      
      await this.speak(errorMsg);
      
      if (sharedEarconPlayer) {
        sharedEarconPlayer.play('error');
      }
    }

    this.reset();
  }

  /**
   * PUBLIC API: Manually trigger audio analysis (for "AI Explain Song" button)
   */
  async analyzeCurrentAudio(songTitle?: string, songArtist?: string, customQuestion?: string): Promise<void> {
    console.log('[VoiceController] 🎵 Manual audio analysis triggered');
    const question = customQuestion || 'Analyze this audio. What instruments, mood, and genre do you detect?';
    await this.handleAudioAnalysis(question, songTitle, songArtist);
  }

  private async executeIntent(intent: any): Promise<void> {
    console.log('[VoiceController] 🎯 Executing intent via CommandRunner:', intent);

    try {
      // Delegate to the comprehensive command runner
      await this.commandRunner.executeIntent(intent);
      
      // Speak confirmation if TTS is enabled
      if (this.config.ttsEnabled) {
        await this.speak(this.getConfirmationMessage(intent));
      }
    } catch (error: any) {
      console.error('[VoiceController] ❌ Error executing intent:', error);
      await this.speak(error.message || 'Sorry, I could not complete that action.');
      throw error;
    }
  }

  /**
   * Get confirmation message for intent
   */
  private getConfirmationMessage(intent: any): string {
    const { action, slots } = intent;
    
    switch (action) {
      case 'play': return 'Playing';
      case 'pause': return 'Paused';
      case 'resume': return 'Resumed';
      case 'next': return 'Next track';
      case 'previous': return 'Previous track';
      case 'volume_up': return 'Volume up';
      case 'volume_down': return 'Volume down';
      case 'volume_set': return `Volume ${slots.volume}`;
      case 'play_nth_track': return `Playing track ${slots.trackNumber}`;
      case 'play_item_in_section': return `Playing item ${slots.trackNumber}`;
      case 'play_mood': return `Playing ${slots.mood} music`;
      case 'play_playlist': return `Playing ${slots.playlistName}`;
      case 'play_liked_songs': return 'Playing liked songs';
      case 'search_and_play': return `Playing ${slots.query}`;
      case 'navigate': return `Opening ${slots.navigation}`;
      case 'scroll_down': return 'Scrolled down';
      case 'scroll_up': return 'Scrolled up';
      case 'scroll_to_section': return `Scrolled to ${slots.sectionId}`;
      case 'help': return ENHANCED_HELP_TEXT;
      default: return 'Done';
    }
  }

  private async speak(text: string): Promise<void> {
    if (!this.config.ttsEnabled || !sharedTtsEngine) return;

    this.setState('speaking');
    try {
      await sharedTtsEngine.speak(text, this.config.language);
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
    if (config.wakeSensitivity !== undefined && sharedWakeEngine) {
      sharedWakeEngine.setSensitivity(config.wakeSensitivity);
    }
    if (config.language !== undefined && sharedAsrEngine) {
      sharedAsrEngine.setLanguage(config.language);
    }
    if (config.wakeEnabled !== undefined) {
      this.wakeEnabled = config.wakeEnabled;
      // Restart if necessary
      if (this.state === 'idle') {
        this.stop().then(() => this.start());
      }
    }
  }

  destroy(): void {
    this.stop();
    if (sharedWakeEngine) {
      sharedWakeEngine.stop();
    }
    if (sharedEarconPlayer) {
      sharedEarconPlayer.destroy();
    }
    setPlayerReady(false);
  }

  /**
   * PUBLIC API: Manual trigger for Tap-Mic button
   * Arms mic on first call, then starts listening on subsequent calls
   */
  async manualTrigger(): Promise<void> {
    console.debug('[VoiceController] 🎤 Manual trigger (Tap-Mic) - ASR_ID:', ASR_INSTANCE_ID);
    
    // Arm mic if not already armed (first tap)
    if (!this.isMicArmed()) {
      console.debug('[VoiceController] 🔓 First tap - arming mic and requesting permission...');
      await this.armMic();
      console.debug('[VoiceController] ✅ Mic armed - now starting listening...');
    }
    
    // Start listening using the shared ASR instance
    await this.startListeningFromArmedMic('tap');
  }

  /**
   * DEPRECATED: Use startListeningFromArmedMic() directly
   * Kept for backward compatibility
   */
  async stopListening(): Promise<void> {
    if (sharedAsrEngine && isListening) {
      await sharedAsrEngine.stop();
      isListening = false;
      this.setState('idle');
    }
  }
}

/**
 * Set the global voice controller instance (called by App.tsx after initialization)
 */
export function setGlobalVoiceController(controller: VoiceController | null): void {
  globalVoiceController = controller;
  console.debug('[VoiceController] Global instance set:', !!controller);
}

/**
 * Get the global voice controller instance (for use by gesture controls)
 */
export function getGlobalVoiceController(): VoiceController | null {
  return globalVoiceController;
}

/**
 * Register callback for AI responses (for UI display)
 */
export function setAIResponseCallback(callback: AIResponseCallback | null): void {
  aiResponseCallback = callback;
  console.debug('[VoiceController] AI response callback set:', !!callback);
}
