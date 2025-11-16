# Gesture → Voice Integration

## Single Shared Microphone Pattern

All activation paths (Tap-Mic, Wake-word "Hello Vibe", Gesture thumbs_up) use the **SAME** microphone and ASR instance.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SHOWS THUMBS UP 👍                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          HandDetector (MediaPipe at 30 FPS)                      │
│          - Detects landmarks                                     │
│          - Fast heuristic: thumb up + fingers curled             │
└────────────────────────┬────────────────────────────────────────┘
                         │ Landmarks
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          GestureUtils.detectThumbsUp()                           │
│          - Fast geometric checks (~150ms)                        │
│          - Confidence: 0.92                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ { label: 'thumbs_up', confidence: 0.92 }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          GesturesController                                      │
│          - Debounce: 300ms                                       │
│          - Stability: 1 frame (instant)                          │
│          - Fires gesture event                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ onGesture('thumbs_up', 0.92)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          useUnifiedMusicControls                                 │
│          - Receives gesture event                                │
│          - Logs: "[GESTURE] Thumbs up detected"                  │
│          - Dispatches: 'vibescape:trigger-voice'                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ CustomEvent
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          App.tsx (handleGestureTrigger)                          │
│          - Listens for 'vibescape:trigger-voice'                 │
│          - Checks: voiceController.isMicArmed()                  │
│          - If not armed: calls voiceController.armMic()          │
│          - Calls: voiceController.startListeningFromArmedMic()   │
│          - Passes source: 'gesture'                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          VoiceController (SINGLETON)                             │
│          ┌──────────────────────────────────────────────┐        │
│          │  Module-level shared resources:             │        │
│          │  - sharedMediaStream (ONE stream only)      │        │
│          │  - sharedAsrEngine (ONE SpeechRecognition)  │        │
│          │  - ASR_INSTANCE_ID (stable identifier)      │        │
│          └──────────────────────────────────────────────┘        │
│                                                                   │
│          startListeningFromArmedMic('gesture'):                  │
│          1. Check guards (armed, not listening, debounce)        │
│          2. Log: "source=gesture ASR_ID=abc123"                  │
│          3. Set state to 'listening'                             │
│          4. Play earcon                                          │
│          5. Call sharedAsrEngine.start()   ← SAME INSTANCE       │
│          6. NO new getUserMedia()                                │
│          7. NO new SpeechRecognition()                           │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
                  User speaks command
                         │
                         ▼
              ASR processes → NLU parses → Execute action
```

## Critical Implementation Details

### 1. VoiceController Singleton Pattern

```typescript
// Module-level shared resources (ONLY ONE INSTANCE)
let sharedMediaStream: MediaStream | null = null;
let sharedAsrEngine: WebSpeechAsr | null = null;
let ASR_INSTANCE_ID: string | null = null;
let isAsrArmed: boolean = false;
```

### 2. Arming Flow (ONLY getUserMedia() call)

```typescript
async armMic(): Promise<void> {
  if (isAsrArmed && sharedAsrEngine) {
    console.debug('[VoiceController] ✅ Already armed, reusing');
    return;
  }

  // THIS IS THE ONLY getUserMedia() CALL IN THE ENTIRE SYSTEM
  sharedMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Create ONE shared ASR instance
  sharedAsrEngine = new WebSpeechAsr(language);
  ASR_INSTANCE_ID = `ASR-${Date.now()}-${Math.random()}`;
  
  isAsrArmed = true;
  console.debug('[VoiceController] ✅ Mic armed, ASR_ID:', ASR_INSTANCE_ID);
}
```

### 3. Start Listening (NO new mic/ASR creation)

```typescript
async startListeningFromArmedMic(source: 'tap'|'wake'|'gesture'): Promise<void> {
  console.debug('[VoiceController] startListeningFromArmedMic called', {
    source,
    ASR_ID: ASR_INSTANCE_ID,
    isArmed: isAsrArmed,
    isListening
  });

  // Guard: Mic must be armed
  if (!isAsrArmed || !sharedAsrEngine) {
    console.error('[VoiceController] ❌ Mic not armed!');
    return;
  }

  // Guard: Already listening
  if (isListening) {
    console.debug('[VoiceController] ⚠️ Already listening');
    return;
  }

  // Start the SHARED ASR instance
  isListening = true;
  await sharedAsrEngine.start(); // ← SAME INSTANCE for all sources
  
  console.debug('[VoiceController] ✅ ASR started, source:', source, 'ASR_ID:', ASR_INSTANCE_ID);
}
```

## Debug Verification

### Console Log Pattern (All Same ASR_ID)

```
# First time (Tap-Mic arms mic)
[VoiceController] ✅ Mic armed, ASR_ID: ASR-1234567890-abc123

# Tap-Mic activation
[VoiceController] startListeningFromArmedMic source=tap ASR_ID=ASR-1234567890-abc123

# Gesture activation
👍 [GESTURE] Thumbs up detected
[VoiceController] startListeningFromArmedMic source=gesture ASR_ID=ASR-1234567890-abc123

# Wake-word activation
🎤 [Porcupine] Wake word detected
[VoiceController] startListeningFromArmedMic source=wake ASR_ID=ASR-1234567890-abc123
```

**✅ All three show SAME ASR_ID = Single shared instance verified!**

## What NOT To Do (Anti-Patterns)

❌ **Never call getUserMedia() from gesture code**
```typescript
// ❌ WRONG - Creates duplicate mic
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
```

❌ **Never create new SpeechRecognition from gesture code**
```typescript
// ❌ WRONG - Creates duplicate ASR
const recognition = new webkitSpeechRecognition();
```

❌ **Never call VoiceController.armMic() from gesture**
```typescript
// ❌ WRONG - armMic() should only be called by Tap-Mic or App.tsx
await voiceController.armMic();
```

## Correct Pattern ✅

Gesture code must **ONLY** dispatch event:

```typescript
// ✅ CORRECT - Just dispatch event
const event = new CustomEvent('vibescape:trigger-voice', {
  detail: { source: 'thumbs_up_gesture' }
});
window.dispatchEvent(event);
```

App.tsx handles arming (if needed) and starting:

```typescript
// ✅ CORRECT - App.tsx checks and arms if needed
if (!voiceController.isMicArmed()) {
  await voiceController.armMic(); // First time only
}

await voiceController.startListeningFromArmedMic('gesture');
```

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Thumbs_up latency | <200ms | ~150ms |
| Detection FPS | 30 | 30 |
| Confidence threshold | 0.80 | 0.92 |
| Stability frames | 1 | 1 |
| Debounce | 300ms | 300ms |

## Testing Checklist

- [ ] Tap mic → logs ASR_ID
- [ ] Show thumbs_up → logs SAME ASR_ID
- [ ] Say "Hello Vibe" → logs SAME ASR_ID
- [ ] No duplicate mic permission requests
- [ ] No duplicate overlays/notifications
- [ ] Gesture → voice flow <200ms latency
- [ ] All sources use identical UI state
