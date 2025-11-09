import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceSettings {
  enabled: boolean;
  useOfflineAsr: boolean;
  language: 'en-IN' | 'hi-IN';
  wakeSensitivity: number; // 0.0 - 1.0
  ttsEnabled: boolean;
  consentGiven: boolean;
}

interface VoiceSettingsStore extends VoiceSettings {
  setEnabled: (enabled: boolean) => void;
  setUseOfflineAsr: (use: boolean) => void;
  setLanguage: (lang: 'en-IN' | 'hi-IN') => void;
  setWakeSensitivity: (sensitivity: number) => void;
  setTtsEnabled: (enabled: boolean) => void;
  setConsentGiven: (given: boolean) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  useOfflineAsr: false,
  language: 'en-IN',
  wakeSensitivity: 0.5,
  ttsEnabled: true,
  consentGiven: false,
};

export const useVoiceSettings = create<VoiceSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setEnabled: (enabled) => set({ enabled }),
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
