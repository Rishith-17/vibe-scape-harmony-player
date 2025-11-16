# Voice Controller Tests

## Overview

These tests verify the singleton pattern implementation for the voice control system, ensuring all activation paths (Tap-Mic, Wake-word, Gesture) reuse a single shared microphone/ASR instance.

## Running Tests

```bash
npm test src/voice/__tests__
```

## Test Suites

### 1. Unit Tests (`voiceController.test.ts`)

Tests the core VoiceController singleton functionality:

- **armMic()**: Verifies mic permission request and ASR instance creation
- **startListeningFromArmedMic()**: Verifies shared instance reuse
- **manualTrigger()**: Verifies Tap-Mic flow
- **Instance ID verification**: Verifies stable ID across calls

### 2. Integration Tests (`integration.test.ts`)

Tests the complete system integration:

- **Unified ASR instance**: Verifies Tap-Mic, Wake, and Gesture all use same instance
- **Permission guards**: Verifies Wake/Gesture don't request permission
- **Duplicate suppression**: Verifies rapid activations are deduplicated

## Verification Process

Each test logs the ASR instance ID to console for manual verification:

```
[Test] Tap-Mic ASR_ID: ASR-1234567890-abc123
[Test] Wake-word ASR_ID: ASR-1234567890-abc123  ✅ Same ID!
[Test] Gesture ASR_ID: ASR-1234567890-abc123    ✅ Same ID!
```

## Acceptance Criteria

All tests must pass to ensure:

1. ✅ Only ONE getUserMedia() call across all activation paths
2. ✅ Same ASR instance ID for Tap-Mic, Wake-word, and Gesture
3. ✅ Wake/Gesture don't request permission if mic not armed
4. ✅ No duplicate audio streams or overlays
5. ✅ Duplicate activations suppressed within 300ms

## Manual Testing

After automated tests pass, perform manual verification:

1. **Start app fresh**
   - Open browser console
   - Look for `[VoiceController]` logs

2. **Tap mic button**
   - Note the ASR_ID in console
   - Should see: `Created shared ASR instance: ASR-...`

3. **Say "Hello Vibe"** (if wake word enabled)
   - Should see: `Wake word detected`
   - Should see: `starting shared ASR instance: ASR-...` (same ID)
   - No new permission request

4. **Show open_hand gesture** (if gesture enabled)
   - Should see: `Open hand detected`
   - Should see: `starting shared ASR instance: ASR-...` (same ID)
   - No new permission request

5. **Verify console logs**
   ```
   ✅ All activation paths should show the SAME ASR instance ID
   ✅ getUserMedia() should only be called ONCE
   ✅ No duplicate mic permission prompts
   ```

## Debugging

If tests fail, check:

1. **Module state**: Ensure singleton variables are properly initialized
2. **Guards**: Verify `isMicArmed()` returns correct state
3. **Timing**: Check debounce/suppression windows
4. **Mocks**: Ensure getUserMedia and SpeechRecognition mocks are set up

Enable debug logging:
```typescript
console.debug('[VoiceController] ...')
```

## Known Issues

- Porcupine wake word engine creates its own audio stream (separate from shared ASR)
- This is acceptable as it only listens for wake word, then signals the controller
- The shared ASR instance handles actual voice command capture
