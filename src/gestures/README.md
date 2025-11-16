# Gesture Control System

Optimized hand gesture detection for music control with single shared microphone instance.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   User Shows Gesture                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│              HandDetector (hand/handDetector.ts)          │
│  - MediaPipe Hands detection at 30 FPS                   │
│  - WebGL/WASM backend for speed                          │
│  - Low-resolution frames (640x480)                       │
│  - Dynamic FPS control                                   │
└────────────────────┬─────────────────────────────────────┘
                     │ Landmarks
                     ▼
┌──────────────────────────────────────────────────────────┐
│           GestureUtils (gestureUtils.ts)                  │
│  - Fast heuristics for thumbs_up & fist                  │
│  - Full analysis for rock & peace                        │
│  - Confidence scoring                                    │
└────────────────────┬─────────────────────────────────────┘
                     │ GestureAnalysis
                     ▼
┌──────────────────────────────────────────────────────────┐
│       GesturesController (gesturesController.ts)          │
│  - Debouncing (300ms cooldown)                           │
│  - Stability tracking (1-2 frames)                       │
│  - Gesture event emission                                │
└────────────────────┬─────────────────────────────────────┘
                     │ Gesture Event
                     ▼
┌──────────────────────────────────────────────────────────┐
│              useUnifiedMusicControls                      │
│  - Maps gestures to actions                              │
│  - Dispatches events for voice control                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
      ┌──────────────┴──────────────┐
      │                             │
      ▼                             ▼
┌──────────┐              ┌─────────────────────────┐
│  Music   │              │   VoiceController       │
│ Control  │              │   (Single Shared Mic)   │
└──────────┘              └─────────────────────────┘
```

## Gesture Mappings

| Gesture      | Action         | Latency | Stability |
|-------------|----------------|---------|-----------|
| 👍 thumbs_up | Voice Control  | ~150ms  | 1 frame   |
| ✊ fist      | Play/Pause     | ~150ms  | 1 frame   |
| 🤘 rock      | Volume Down    | ~200ms  | 2 frames  |
| ✌️ peace     | Volume Up      | ~200ms  | 2 frames  |

## Single Shared Microphone Pattern

**CRITICAL:** All activation paths (Tap-Mic, Wake-word, Gesture) use the SAME mic instance.

### How thumbs_up triggers voice:

1. **thumbs_up detected** → `gesturesController` fires event
2. **useUnifiedMusicControls** → dispatches `'vibescape:trigger-voice'` event
3. **App.tsx** listens → calls `VoiceController.startListeningFromArmedMic('gesture')`
4. **VoiceController** → starts the ALREADY CREATED shared ASR instance
5. **NO new mic** or SpeechRecognition created

### Debug Logging:

All paths log the same ASR_ID to verify shared instance:

```typescript
// Tap-Mic
console.debug('[VoiceController] startListeningFromArmedMic source=tap ASR_ID=abc123')

// Gesture
console.debug('[VoiceController] startListeningFromArmedMic source=gesture ASR_ID=abc123')

// Wake
console.debug('[VoiceController] startListeningFromArmedMic source=wake ASR_ID=abc123')
```

## Performance Optimizations

1. **Fast Heuristics**: thumbs_up and fist use simple geometric rules (150-200ms)
2. **Dynamic FPS**: 30 FPS target, degrades gracefully on low-power devices
3. **Debouncing**: 300ms cooldown prevents duplicate gestures
4. **Stability**: 1 frame for instant gestures, 2 frames for volume controls
5. **Low Confidence Threshold**: 0.80 for fast response without false positives

## Configuration

```typescript
const config = {
  confidenceThreshold: 0.80,
  debounceMs: 300,
  stabilityFrames: {
    thumbs_up: 1,  // Instant
    fist: 1,       // Instant
    rock: 2,       // Stable
    peace: 2,      // Stable
  },
};
```

## Files

- `hand/handDetector.ts` - MediaPipe detection engine
- `gestureUtils.ts` - Fast landmark heuristics
- `gesturesController.ts` - Event management and debouncing
- Integration via `src/hooks/useSimpleGestureDetection.ts`

## Privacy

- All detection runs on-device
- No hand data leaves the browser
- Camera stream is local only
- No cloud processing
