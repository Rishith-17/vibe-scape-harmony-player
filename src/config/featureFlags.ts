/**
 * Feature flags for experimental/optional features
 * All flags default to false for backwards compatibility
 */
export const FEATURE_FLAGS = {
  VOICE_CONTROL_ENABLED: false, // Voice control subsystem (wake word, ASR, NLU, TTS)
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag];
};
