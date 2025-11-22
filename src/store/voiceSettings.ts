import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceSettings {
  enabled: boolean;
  wakeEnabled: boolean; // Enable "Hello Vibe" wake word
  pttOnly: boolean; // Push-to-talk only mode (disables wake)
  useOfflineAsr: boolean;
  language: 'en-IN' | 'hi-IN';
  wakeSensitivity: number; // 0.0 - 1.0
  ttsEnabled: boolean;
  consentGiven: boolean;
}

interface VoiceSettingsStore extends VoiceSettings {
  setEnabled: (enabled: boolean) => void;
  setWakeEnabled: (enabled: boolean) => void;
  setPttOnly: (pttOnly: boolean) => void;
  setUseOfflineAsr: (use: boolean) => void;
  setLanguage: (lang: 'en-IN' | 'hi-IN') => void;
  setWakeSensitivity: (sensitivity: number) => void;
  setTtsEnabled: (enabled: boolean) => void;
  setConsentGiven: (given: boolean) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  wakeEnabled: false, // Disabled by default (Porcupine has compatibility issues)
  pttOnly: true, // Push-to-talk mode (Tap-Mic button) for better performance
  useOfflineAsr: false,
  language: 'en-IN',
  wakeSensitivity: 0.7,
  ttsEnabled: false, // Disabled for better performance
  consentGiven: true,
};

export const useVoiceSettings = create<VoiceSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setEnabled: (enabled) => set({ enabled }),
      setWakeEnabled: (wakeEnabled) => set({ wakeEnabled, pttOnly: !wakeEnabled }),
      setPttOnly: (pttOnly) => set({ pttOnly, wakeEnabled: !pttOnly }),
      setUseOfflineAsr: (useOfflineAsr) => set({ useOfflineAsr }),
      setLanguage: (language) => set({ language }),
      setWakeSensitivity: (wakeSensitivity) => set({ wakeSensitivity }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setConsentGiven: (consentGiven) => set({ consentGiven }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'voice-settings',
    }
  )
);
