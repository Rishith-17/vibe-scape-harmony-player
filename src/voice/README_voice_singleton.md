# Voice Control System - Singleton Pattern

## Overview

The voice control system uses a **singleton pattern** to ensure all activation paths (Tap-Mic, Wake-word "Hello Vibe", and Gesture) reuse a **single shared microphone/ASR instance**.

## Architecture Principles

### 1. Single Source of Truth

- **ONE mic/ASR instance only** - created in `voiceController.ts` module-level variables
- **NO duplicate audio streams** - all activation paths signal the controller
- **NO duplicate overlays** - unified UI state across all triggers

### 2. Permission Management

- `armMic()` is the **ONLY** place where `getUserMedia()` is called
- Wake word and gesture **NEVER** request mic permission
- User must tap mic button first to grant permission (privacy-first design)

### 3. Activation Flow

```
User Tap-Mic Button → armMic() → getUserMedia() → Create shared ASR
                    ↓
                    startListeningFromArmedMic() → Reuse shared ASR

Wake word "Hello Vibe" → Check if armed → startListeningFromArmedMic() → Reuse same ASR

Gesture (open_hand) → Check if armed → startListeningFromArmedMic() → Reuse same ASR
```

## Public API

### `VoiceController` Methods

#### `isMicArmed(): boolean`
Returns true if user has granted mic permission and ASR instance exists.

```typescript
if (voiceController.isMicArmed()) {
  // Safe to start listening
}
```

#### `getAsrInstanceId(): string | null`
Returns stable ASR instance ID for verification. Same ID = same instance.

```typescript
const id = voiceController.getAsrInstanceId();
console.log('[Tap-Mic] ASR_ID:', id);
// Later...
console.log('[Wake] ASR_ID:', id); // Should be SAME ID!
```

#### `armMic(): Promise<void>`
Arms microphone - requests permission and creates shared ASR instance.
**This is the ONLY place where getUserMedia() is called.**

```typescript
// Called by Tap-Mic button on first tap
await voiceController.armMic();
```

#### `startListeningFromArmedMic(): Promise<void>`
Starts listening using the already-armed shared ASR instance.
**NEVER creates new mic resources - only starts existing instance.**

```typescript
// Called by all activation paths:
// 1. Tap-Mic (after arming)
// 2. Wake word detection
// 3. Gesture detection

if (voiceController.isMicArmed()) {
  await voiceController.startListeningFromArmedMic();
}
```

## Implementation Details

### Module-Level Singleton State

```typescript
// src/voice/voiceController.ts

let sharedMediaStream: MediaStream | null = null;
let sharedAsrEngine: WebSpeechAsr | null = null;
let isAsrArmed = false;
let ASR_INSTANCE_ID: string | null = null;
```

### Guards and Protections

1. **Permission Guard**: Wake/Gesture check `isMicArmed()` before starting
2. **State Guard**: Prevent starting if already listening/processing
3. **Debounce Guard**: Suppress duplicate calls within 300ms
4. **Singleton Guard**: Reuse existing instance if already armed

### Verification Logging

All activation paths log the ASR instance ID for verification:

```
[VoiceController] 🎤 Manual trigger (Tap-Mic) - ASR_ID: ASR-1234-abc
[VoiceController] 🎤 Wake word detected - ASR_ID: ASR-1234-abc
[VoiceController] 🖐️ Gesture detected - ASR_ID: ASR-1234-abc
```

**Same ID = Success! ✅**

## Integration Points

### 1. Tap-Mic Button (`VoiceChip.tsx`)

```typescript
const handleClick = async () => {
  await voiceController.manualTrigger();
};
```

`manualTrigger()` internally calls:
1. `armMic()` on first tap (if not armed)
2. `startListeningFromArmedMic()` to begin listening

### 2. Wake Word Engine (`PorcupineWebEngine.ts`)

```typescript
// In detection callback:
if (detection.label === 'Hello Vibe') {
  // ONLY signal controller - NO mic creation!
  this.detectionCallback();
}
```

The callback in voiceController checks arming:
```typescript
private async onWakeDetected() {
  if (!this.isMicArmed()) {
    console.warn('Wake detected but mic not armed');
    return;
  }
  await this.startListeningFromArmedMic();
}
```

### 3. Gesture Control (`useUnifiedMusicControls.ts`)

```typescript
case 'open_hand':
  // Dispatch event to trigger voice controller
  const event = new CustomEvent('vibescape:trigger-voice', {
    detail: { source: 'open_hand_gesture' }
  });
  window.dispatchEvent(event);
```

The event handler in `App.tsx`:
```typescript
window.addEventListener('vibescape:trigger-voice', async (e) => {
  if (voiceController.isMicArmed()) {
    await voiceController.startListeningFromArmedMic();
  }
});
```

## Privacy & User Experience

### Why Mic Must Be Armed First?

1. **Privacy**: User explicitly grants permission via Tap-Mic
2. **Transparency**: Clear visual feedback when mic is active
3. **Control**: User can't accidentally trigger voice by saying wake word
4. **Security**: No silent background mic access

### User Flow

1. User opens app → Mic NOT armed
2. User taps mic button → Permission prompt → Mic armed
3. Now all triggers work:
   - Tap mic button again
   - Say "Hello Vibe"
   - Show open_hand gesture

## Testing

### Automated Tests

Run unit and integration tests:
```bash
npm test src/voice/__tests__
```

### Manual Verification

1. Open browser console
2. Tap mic button
3. Note ASR_ID in console
4. Say "Hello Vibe" → Should show **SAME** ASR_ID
5. Show open_hand gesture → Should show **SAME** ASR_ID
6. Verify getUserMedia() called **ONCE**

### Acceptance Criteria

- ✅ Only ONE getUserMedia() call
- ✅ Same ASR_ID across all activation paths
- ✅ Wake/Gesture don't request permission if not armed
- ✅ No duplicate audio streams
- ✅ No duplicate overlays
- ✅ Duplicate suppression works (300ms window)

## Debugging

Enable detailed logging:
```typescript
// In voiceController.ts
console.debug('[VoiceController] ...', {
  state: this.state,
  isArmed: isAsrArmed,
  instanceId: ASR_INSTANCE_ID
});
```

Check for issues:
- **No ASR_ID**: Mic not armed yet
- **Different IDs**: Multiple instances created (BUG!)
- **Multiple getUserMedia**: Singleton pattern broken (BUG!)
- **Permission errors**: Check browser settings

## Known Limitations

1. **Porcupine Audio Stream**: Porcupine wake word engine creates its own audio stream for wake detection. This is separate from the shared ASR instance and is acceptable since it only listens for "Hello Vibe", then signals the controller to use the shared ASR.

2. **Browser Support**: Web Speech API and Porcupine have varying browser support. Fallback to Tap-Mic only if not supported.

3. **Mobile Browsers**: Some mobile browsers require user gesture for mic access. Wake word might not work without prior tap.

## Future Enhancements

- [ ] Add multiple wake word support
- [ ] Implement voice activation toggle in settings
- [ ] Add voice command history
- [ ] Support custom wake words
- [ ] Add voice feedback customization

## References

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Picovoice Porcupine](https://picovoice.ai/platform/porcupine/)
- [Singleton Pattern](https://refactoring.guru/design-patterns/singleton)
