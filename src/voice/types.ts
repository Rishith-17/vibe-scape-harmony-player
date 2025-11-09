export type VoiceAction =
  | 'play'
  | 'pause'
  | 'resume'
  | 'next'
  | 'previous'
  | 'volume_up'
  | 'volume_down'
  | 'volume_set'
  | 'search'
  | 'play_query'
  | 'play_mood'
  | 'navigate'
  | 'help'
  | 'unknown';

export type MoodType = 'happy' | 'calm' | 'focus' | 'chill' | 'romantic' | 'energetic' | 'sad';

export type NavigationTarget = 'emotions' | 'library' | 'settings' | 'home' | 'search';

export interface VoiceIntent {
  action: VoiceAction;
  slots: {
    query?: string;
    mood?: MoodType;
    volume?: number;
    navigation?: NavigationTarget;
  };
  raw: string;
  confidence: number;
}

export interface MusicController {
  play(): void;
  pause(): void;
  resume(): void;
  next(): void;
  previous(): void;
  playQuery(query: string): Promise<void>;
  playMood(mood: MoodType): Promise<void>;
  setVolume(percent: number): void; // 0..100
  adjustVolume(delta: number): void; // +/-
}

export interface NavControllerAdapter {
  openEmotionDetection(): void;
  openLibrary(): void;
  openSettings(): void;
  openHome(): void;
  openSearch(): void;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface AsrEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  onResult(callback: (transcript: string, isFinal: boolean) => void): void;
  onError(callback: (error: Error) => void): void;
}

export interface WakeWordEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  onDetection(callback: () => void): void;
  setSensitivity(value: number): void;
}
