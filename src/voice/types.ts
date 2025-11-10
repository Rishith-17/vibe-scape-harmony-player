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
  | 'play_nth_track'
  | 'play_liked_songs'
  | 'play_playlist'
  | 'search_and_play'
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
    trackNumber?: number;
    playlistName?: string;
  };
  raw: string;
  confidence: number;
}

export interface MusicController {
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  playQuery(query: string): Promise<void>;
  playMood(mood: MoodType): Promise<void>;
  playNthTrack(trackNumber: number): Promise<void>;
  playLikedSongs(): Promise<void>;
  playPlaylist(playlistName: string): Promise<void>;
  searchAndPlay(query: string): Promise<void>;
  setVolume(percent: number): void; // 0..100
  adjustVolume(delta: number): void; // +/-
}

export interface NavControllerAdapter {
  openEmotionDetection(): void;
  openLibrary(): void;
  openSettings(): void;
  openHome(): void;
  openSearch(query?: string): void;
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
