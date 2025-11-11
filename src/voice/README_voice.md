# Voice Control System - "Hello Vibe"

## Overview

This voice control system uses **Porcupine Web** for wake word detection ("Hello Vibe") and **Web Speech API** for speech recognition and text-to-speech. All processing happens locally on-device for maximum privacy.

## Features

- 🎤 **Wake Word**: Say "Hello Vibe" to activate voice commands (foreground only)
- 👆 **Tap-to-Speak**: Manual mic button for push-to-talk
- 🎵 **Full Music Control**: Play playlists, search songs, control playback
- 🌐 **Hinglish Support**: Commands work in English and Hinglish
- 🔒 **Privacy First**: All audio processing stays on your device

## Setup

### 1. Porcupine Access Key

Add your Porcupine access key to `.env` or `.env.local`:

```env
VITE_PICOVOICE_ACCESS_KEY=your_access_key_here
```

Get your free access key at: https://console.picovoice.ai/

### 2. Wake Word Model

The custom "Hello Vibe" model is located at:
```
public/models/Hello-vibe_en_wasm_v3_0_0.ppn
```

This file is loaded automatically by `PorcupineWebEngine.ts`.

### 3. First Use

1. Open the app and go to **Settings → Voice Control**
2. Toggle "Enable Voice Assistant"
3. Grant microphone permission when prompted
4. Toggle "Enable Wake Word" to activate "Hello Vibe"

## Supported Commands

### Playback
- "play" / "resume" / "pause" / "stop"
- "next song" / "previous song"
- "play playlist Focus" (plays from library)
- "search Arijit Singh" (auto-plays top result)

### Volume
- "volume up" / "volume down"
- "volume to 50" / "set volume 70"

### Navigation
- "open emotion page" / "go to emotions"
- "open library" / "show library"
- "open settings"

### Hinglish Examples
- "playlist Focus chalao"
- "Blinding Lights search karo"
- "volume ko 50 kar"
- "agle gaane" (next song)

## Browser Compatibility

| Browser | Wake Word | Tap-to-Speak | Notes |
|---------|-----------|--------------|-------|
| Chrome Desktop | ✅ | ✅ | Full support |
| Chrome Android | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |
| Safari Desktop | ⚠️ | ✅ | Limited wake word support |
| Safari iOS | ❌ | ✅ | Use tap-to-speak only |
| Firefox | ⚠️ | ✅ | Wake word may have issues |

**Recommendation**: Use tap-to-speak on Safari/Firefox for best experience.

## Privacy & Security

- ✅ **Local Processing**: All audio stays on your device
- ✅ **Explicit Consent**: Requires microphone permission
- ✅ **Visibility Aware**: Wake word pauses when tab is hidden
- ✅ **No Cloud**: Porcupine runs in WASM, Web Speech API is browser-native
- ✅ **No Recording**: Audio is processed in real-time, never stored

## Settings

Access voice settings at **Profile → Voice Control**:

- **Enable Voice Assistant**: Master toggle
- **Enable Wake Word**: Turn "Hello Vibe" on/off
- **Push-to-Talk Only**: Disable wake word, use tap only
- **Wake Sensitivity**: Adjust detection threshold (0.0-1.0)
- **Language**: Choose recognition language (default: en-IN)
- **TTS Feedback**: Enable/disable spoken responses

## Troubleshooting

### Wake Word Not Working
1. Check that `VITE_PICOVOICE_ACCESS_KEY` is set correctly
2. Verify the model file exists at `public/models/Hello-vibe_en_wasm_v3_0_0.ppn`
3. Ensure browser tab is visible (wake word auto-pauses when hidden)
4. Try increasing sensitivity in settings
5. Check browser console for Porcupine errors

### Microphone Permission Denied
1. Check browser settings → Site permissions → Microphone
2. Reload the page after granting permission
3. On mobile, ensure system-level mic permission is granted

### Commands Not Recognized
1. Speak clearly and wait for the listening indicator
2. Try simpler commands first ("play", "next")
3. Check that language is set to 'en-IN' for Hinglish support
4. Ensure Web Speech API is supported (check console)

### "Next/Previous Not Executing"
- The system uses a command mutex and player gate to prevent race conditions
- If issues persist, check that `setPlayerReady(true)` is called in your music player initialization

## Custom Wake Word

To train your own wake word or change "Hello Vibe":

1. Visit https://console.picovoice.ai/ppn
2. Create a new wake word (e.g., "Hey Music", "DJ Vibe")
3. Download the `.ppn` model file
4. Replace `public/models/Hello-vibe_en_wasm_v3_0_0.ppn`
5. Update the label in `PorcupineWebEngine.ts`:
   ```typescript
   [{ 
     publicPath: '/models/your-wake-word.ppn', 
     label: 'Your Wake Word', 
     sensitivity: 0.6 
   }]
   ```

## Architecture

```
src/voice/
├── wake/
│   └── PorcupineWebEngine.ts    # Porcupine Web wake word detection
├── asr/
│   └── WebSpeechAsr.ts          # Web Speech API wrapper (STT)
├── nlu/
│   └── intentParser.ts          # Natural language understanding
├── tts/
│   └── tts.ts                   # Text-to-speech engine
├── ui/
│   └── VoiceChip.tsx            # Floating mic button UI
├── voiceController.ts           # Main orchestration
├── commandRunner.ts             # Command mutex
└── playerGate.ts                # Player readiness gate
```

## Performance

- **Bundle Size**: ~200KB (Porcupine WASM + models)
- **Memory**: ~50-100MB during active listening
- **CPU**: Minimal (~1-2% on modern devices)
- **Latency**: <500ms from wake detection to command execution

## License

Porcupine is licensed under Apache 2.0 for open-source projects.
Commercial use requires a Picovoice license: https://picovoice.ai/pricing/

## Support

- Porcupine Docs: https://picovoice.ai/docs/porcupine/
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Issues: Check browser console and network tab for errors
