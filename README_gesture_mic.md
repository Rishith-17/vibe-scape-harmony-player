# Gesture Control System with Mic Reusability

## Overview
This PWA implements a precise 4-gesture hand control system for music playback and voice activation. All gestures use MediaPipe Hands for detection and are designed to work seamlessly with the existing voice control system.

## Gesture Mapping

| Gesture | Icon | Action | Details |
|---------|------|--------|---------|
| **Open Hand** | 🤚 | Start Voice Control | Triggers the same microphone instance used by Tap-Mic button. No duplicate mic/ASR instances are created. |
| **Fist** | ✊ | Play/Pause Toggle | If playing → pause; if paused → play. Uses singleton MusicController instance. |
| **Rock Hand** | 🤘 | Volume Down | Decreases volume by 10% (adjustVolume(-10)). |
| **Peace Hand** | ✌️ | Volume Up | Increases volume by 10% (adjustVolume(+10)). |

## Architecture

### Singleton Pattern
- **MusicController**: A single global instance (`musicController`) exported from `src/controllers/MusicControllerImpl.ts` ensures no duplicate audio players.
- **Voice Controller**: The same ASR/microphone instance is reused across Tap-Mic, wake word, and open-hand gesture.

### Mic Reusability
When the **Open Hand** gesture is detected:
1. System calls `VoiceController.startListeningFromArmedMic()`
2. This reuses the existing `asrEngine` instance (no new `SpeechRecognition()` or `getUserMedia()` calls)
3. User sees the same overlay/animation as with Tap-Mic
4. System is listening for voice commands using the same audio pipeline

**No duplicate microphones or ASR instances are ever created by gesture code.**

### Gesture Detection Pipeline

#### Detection Requirements
- **Confidence Threshold**: ≥0.85 (strict)
- **Stability Requirement**: Same gesture must be detected for at least 2 consecutive frames (~150ms)
- **Cooldown**: 400ms debounce between actions to prevent double-triggers

#### MediaPipe Configuration
```typescript
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.85,  // Strict detection
  minTrackingConfidence: 0.85,   // Strict tracking
});
```

#### Gesture Recognition Logic
Located in `src/hooks/useSimpleGestureDetection.ts`:

- **Open Hand**: All 5 fingers extended (fingersUp === 5)
- **Fist**: All 5 fingers closed (fingersDown === 5)
- **Rock**: Index + pinky up, thumb/middle/ring down (fingersUp === 2)
- **Peace**: Index + middle up, thumb/ring/pinky down (fingersUp === 2)

Only these 4 gestures are recognized. Any other hand position is ignored.

### Command Execution Flow

1. **Gesture Detected** → `useSimpleGestureDetection` analyzes hand landmarks
2. **Stability Check** → Requires 2 consecutive detections + 150ms elapsed
3. **Confidence Check** → Must be ≥0.85
4. **Debounce Check** → 400ms cooldown since last action
5. **Command Routing** → `useUnifiedMusicControls.handleGestureCommand()`
6. **Mutex Protection** → `runCommand()` ensures only one action at a time
7. **Action Execution** → Gesture action executed with visual/toast feedback

### Gesture Priority & Suppression
- Within 1 second window, **gestures have priority over voice commands**
- If gesture and tap occur within 300ms, **Tap-Mic action takes priority**
- Duplicate actions within 500ms are suppressed (debounce)
- When suppression occurs, non-blocking toast: "Action suppressed — recent action already executed."

## Files Modified

### Core Implementation
- **`src/voice/voiceController.ts`**: Added `startListeningFromArmedMic()` to reuse existing ASR
- **`src/controllers/MusicControllerImpl.ts`**: Exported singleton `musicController` instance; added `isPlaying()` check
- **`src/hooks/useSimpleGestureDetection.ts`**: 
  - Strict confidence ≥0.85
  - 2-frame stability requirement (~150ms)
  - Only emits 4 allowed gestures
- **`src/hooks/useUnifiedMusicControls.ts`**: Updated gesture mapping to match requirements; integrated singleton controller

### Utilities
- **`src/voice/commandRunner.ts`**: Provides mutex with 400ms cooldown

## Tuning Parameters

### Confidence & Stability
To adjust gesture sensitivity, edit `src/hooks/useSimpleGestureDetection.ts`:

```typescript
// Confidence threshold
if (confidence < 0.85) { // Change to 0.8 for looser detection
  return;
}

// Stability requirement
if (gestureStabilityRef.current.count < 2 || elapsed < 150) {
  // Change count to 3 or elapsed to 200 for stricter stability
  return;
}
```

### Cooldown & Debounce
Edit `src/hooks/useUnifiedMusicControls.ts`:

```typescript
// Debounce duration
if (timeDiff < 500) { // Change to 300 for faster repeat gestures
  // ...
}
```

Edit `src/voice/commandRunner.ts`:

```typescript
setTimeout(() => {
  busy = false;
}, 400); // Change to 300 or 500 to adjust global cooldown
```

### Suppression Window
Edit `src/hooks/useUnifiedMusicControls.ts`:

```typescript
// Gesture vs voice priority window
if (timeDiff < 1000) { // Change to 800 or 1200
  // ...
}
```

## UI Feedback

### Visual
- **Gesture Feedback**: Large gesture icon (🤚, ✊, 🤘, ✌️) displayed briefly
- **Mic Overlay**: Same overlay appears for open-hand as for Tap-Mic (no visual difference)

### Toast Notifications
- 🤚 Open Hand: "🎤 Voice Control - Listening for your command..."
- ✊ Fist: "⏸️ Paused" / "▶️ Playing"
- 🤘 Rock: "🔉 Volume Down - Volume decreased by 10%"
- ✌️ Peace: "🔊 Volume Up - Volume increased by 10%"

## Testing

### Manual Testing
1. **Open Hand Gesture**:
   - Show open hand with all 5 fingers extended
   - System should show mic overlay (same as Tap-Mic)
   - Speak a voice command
   - Verify no duplicate mic instances in console

2. **Fist Gesture**:
   - Make a fist with all fingers closed
   - If music is playing → should pause
   - Make fist again → should resume
   - Check console: only one MusicController instance

3. **Rock & Peace Gestures**:
   - Show rock hand (🤘) → volume should decrease
   - Show peace hand (✌️) → volume should increase
   - Check localStorage: `vibescape_volume` updates correctly

4. **Stability & Confidence**:
   - Make an ambiguous hand shape → should NOT trigger action
   - Quickly flash a gesture → should NOT trigger (stability check)
   - Hold gesture clearly for 150ms+ → SHOULD trigger

5. **Debounce & Cooldown**:
   - Perform same gesture twice rapidly (<400ms) → second should be ignored
   - Perform different gestures back-to-back → both should execute

### Unit Testing (Recommended)
Create tests in `src/hooks/__tests__/useUnifiedMusicControls.test.ts`:

```typescript
describe('Gesture Commands', () => {
  it('should call startListeningFromArmedMic for open_hand', () => {
    // Mock VoiceController and verify startListeningFromArmedMic is called
  });

  it('should toggle play/pause for fist', () => {
    // Mock MusicController and verify pause() or resume() based on state
  });

  it('should adjust volume for rock and peace', () => {
    // Mock musicController and verify adjustVolume(-10) and adjustVolume(+10)
  });

  it('should not create new mic instances', () => {
    // Mock getUserMedia and SpeechRecognition, assert they are NOT called
  });
});
```

## Troubleshooting

### Gestures Not Detected
- Ensure camera permission is granted
- Check browser console for MediaPipe loading errors
- Verify hand is clearly visible and well-lit
- Try adjusting confidence threshold (lower to 0.8)

### Duplicate Actions
- Check cooldown value in `commandRunner.ts` (should be 400ms)
- Verify debounce logic in `useUnifiedMusicControls.ts`
- Check for multiple gesture provider instances in component tree

### Mic Issues
- Open hand should NOT create new mic instance
- Check console logs: `[VoiceController] Gesture-triggered voice control - reusing same mic instance`
- Verify `startListeningFromArmedMic()` is implemented correctly
- Check for permission dialogs being blocked

### Volume Not Changing
- Verify singleton `musicController` is being used
- Check localStorage: `vibescape_volume` should update
- Ensure YouTube player is initialized and ready

## Best Practices

1. **Always use singleton instances** - Never create new MusicController or mic instances in gesture code
2. **Respect the cooldown** - 400ms prevents accidental double-triggers
3. **Maintain stability requirement** - 2-frame + 150ms prevents false positives
4. **Only 4 gestures allowed** - Do not add or modify gesture mappings without updating this document
5. **Test with real users** - Gesture detection varies by lighting, hand size, and camera quality

## Future Enhancements (Not Implemented)

- Customizable gesture mappings in settings
- Gesture training mode for personalization
- Additional gestures for playlist/track control
- Haptic feedback on mobile devices
- Gesture history/analytics

---

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Compatible With**: Vite 6, React 18, MediaPipe Hands 0.4
