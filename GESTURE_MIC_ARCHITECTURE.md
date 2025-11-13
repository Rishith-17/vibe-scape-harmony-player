# Gesture + Voice Control Architecture

## ✅ Confirmed: ONE Mic, TWO Triggers

This document explains how the open-hand gesture and Tap-Mic button both use the **exact same microphone instance**.

---

## 🎤 The Single Voice Controller Instance

There is **ONE and ONLY ONE** `VoiceController` instance in the entire app:

```typescript
// Created in App.tsx
const voiceController = new VoiceController(musicController, navController, config);
```

This single instance manages:
- ✅ ONE microphone
- ✅ ONE speech recognition (ASR) engine
- ✅ ONE wake word detector
- ✅ ONE state machine

---

## 🔄 How Both Triggers Work (Same Function)

### 1️⃣ Tap-Mic Button Flow

```
User taps mic button
  ↓
VoiceChip.tsx → onManualTrigger()
  ↓
App.tsx → handleManualTrigger()
  ↓
voiceController.manualTrigger() ← THE FUNCTION
  ↓
Microphone starts listening
```

### 2️⃣ Open-Hand Gesture Flow

```
User shows open hand 🤚
  ↓
useSimpleGestureDetection.ts detects gesture
  ↓
useUnifiedMusicControls.ts → case 'open_hand'
  ↓
Dispatches 'vibescape:trigger-voice' event
  ↓
App.tsx event listener receives event
  ↓
voiceController.manualTrigger() ← THE SAME FUNCTION
  ↓
Same microphone starts listening
```

---

## ✅ Proof They Use the Same Mic

Both flows call **the exact same function**:

```typescript
// src/voice/voiceController.ts line 375
async manualTrigger(): Promise<void> {
  console.log('[VoiceController] 🎤 Manual voice trigger - tap to speak');
  await this.onWakeDetected(); // Starts the ONE ASR instance
}
```

This function:
- ✅ Starts the existing ASR engine (`this.asrEngine.start()`)
- ✅ Uses the existing microphone stream
- ✅ Shows the same UI overlay
- ✅ Follows the same state machine

**NO new microphone or ASR instance is ever created.**

---

## 🐛 Debugging Open-Hand Gesture

If open-hand gesture doesn't work, check console logs:

### Expected Log Sequence:
```
1. 🤚 [GESTURE] Open hand detected - dispatching voice trigger event
2. 🤚 [GESTURE] Event dispatched successfully
3. [App] 🤙 Voice triggered by: open_hand_gesture
4. [App] ✅ Calling voiceController.manualTrigger() - SAME as Tap-Mic
5. [VoiceController] 🎤 Manual voice trigger - tap to speak
6. [VoiceController] 🔊 Speak your command now
```

### If you don't see these logs:
- ❌ Gesture not detected → Check camera permissions
- ❌ Event not dispatched → Check `useUnifiedMusicControls.ts`
- ❌ Event not received → Check `App.tsx` event listener
- ❌ Voice controller not ready → Wait for initialization

---

## 🎯 All 4 Gestures (Summary)

| Gesture | Command | Function | Cooldown |
|---------|---------|----------|----------|
| 🤚 Open Hand | Activate mic | Same as Tap-Mic (`manualTrigger()`) | 250ms |
| ✊ Fist | Play/Pause | `togglePlayPause()` | **3 seconds** |
| 🤘 Rock | Volume Down | `adjustVolume(-10)` | 250ms |
| ✌️ Peace | Volume Up | `adjustVolume(+10)` | 250ms |

---

## 🚀 Performance Optimizations

The gesture detection is optimized for speed:

- ✅ 20 FPS processing (50ms intervals)
- ✅ ModelComplexity: 0 (fastest)
- ✅ MinConfidence: 0.65 (lower = faster detection)
- ✅ No stability wait (instant firing)
- ✅ Debounce: 250ms (prevents duplicates)
- ✅ Fist cooldown: 3000ms (prevents accidental toggles)

---

## 📝 Key Files

1. **src/voice/voiceController.ts** - The single voice controller instance
2. **src/App.tsx** - Creates voice controller, handles both triggers
3. **src/voice/ui/VoiceChip.tsx** - Tap-Mic button
4. **src/hooks/useSimpleGestureDetection.ts** - Detects hand gestures
5. **src/hooks/useUnifiedMusicControls.ts** - Maps gestures to actions

---

## ✅ Acceptance Criteria (All Met)

- ✅ Tap-Mic starts listening normally
- ✅ Open-hand gesture starts listening identically
- ✅ Only ONE microphone instance exists
- ✅ No duplicate audio or recognition
- ✅ Fist has 3-second cooldown
- ✅ Other gestures work (rock, peace)
- ✅ Same UI overlay for both triggers
