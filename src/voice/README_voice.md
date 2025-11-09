# Voice Control Integration

## Overview

This is a modular, opt-in voice control layer for the emotion-based music player PWA. It supports wake word detection, speech recognition, natural language understanding, and text-to-speech feedback.

## Architecture

```
Voice Control Flow:
Wake Word ("Hey Vibe") → ASR (Speech-to-Text) → NLU (Intent Parser) → Action → TTS Feedback
```

### Components

- **Wake Word Engine** (`wake/PorcupineWebEngine.ts`): On-device wake word detection using Picovoice Porcupine
- **ASR Engines** (`asr/`): Speech recognition via Web Speech API (primary) or Vosk WASM (offline fallback)
- **Intent Parser** (`nlu/intentParser.ts`): Maps transcript to structured intents
- **Voice Controller** (`voiceController.ts`): Orchestrates the entire flow
- **Controllers** (`controllers/`): Adapters that wrap existing app functionality
- **UI** (`voice/ui/VoiceChip.tsx`): Floating status indicator

## Setup

### 1. Feature Flag

✅ Voice control is **ENABLED** in `src/config/featureFlags.ts`

### 2. Picovoice Porcupine Setup (Wake Word)

✅ The "Hey Vibe" wake word model is installed at `public/models/Hey-vibe_en_wasm_v3_0_0.ppn`

**Required:** Add your Picovoice access key to environment variables:

```env
VITE_PICOVOICE_ACCESS_KEY=your_access_key_here
```

Get your access key from https://console.picovoice.ai/

### 3. Offline ASR Setup (Optional)

For offline speech recognition using Vosk:

1. Download Vosk WASM model (small ~50MB): https://alphacephei.com/vosk/models
2. Place model files in `public/models/vosk/`
3. Implement Web Worker in `src/voice/asr/VoskAsr.worker.ts`

## Usage

### User Flow

1. User enables voice control in Settings → Voice & Privacy
2. User grants microphone permission
3. App listens for "Hey Vibe" wake word
4. After wake detection, user speaks a command
5. App executes command and provides audio feedback

### Supported Commands

**Playback Controls:**
- "Play", "Pause", "Resume"
- "Next", "Previous"

**Volume:**
- "Volume up", "Volume down"
- "Volume to 50"

**Content:**
- "Play happy music", "Play calm songs"
- "Play [song/artist name]"

**Navigation:**
- "Open emotions page"
- "Open library"
- "Open settings"

**Search:**
- "Search for [query]"

**Help:**
- "Help", "What can I say?"

### Hinglish Support

The intent parser supports common Hinglish phrases:
- "Chalu kar" (play)
- "Band kar" (pause)
- "Volume ko 50 kar" (set volume to 50)
- "Agle gaane" (next song)

## Browser Compatibility

### Desktop
- **Chrome/Edge**: Full support (Web Speech API + WASM)
- **Firefox**: Web Speech API support varies by OS
- **Safari**: Limited support (no continuous recognition)

### Mobile
- **Android Chrome**: Full support when installed as PWA
- **iOS Safari**: Push-to-talk fallback (no persistent wake word)

## Privacy & Permissions

- Wake word detection runs entirely on-device (WASM)
- Speech recognition uses browser API by default (data sent to browser's speech service)
- Optional offline ASR mode (all processing on-device)
- No audio stored or sent to app servers
- User must explicitly grant microphone permission

## Performance

- Initial bundle size increase: ~50KB (lazy-loaded)
- Wake word detection: ~10-20ms latency
- ASR latency: 500-1500ms (depends on browser/connection)
- Memory usage: ~30-50MB additional (with models loaded)

## Testing

### Simulated Wake Word

During development, press the **'V' key** to simulate wake word detection (when feature is enabled).

### Unit Tests

```bash
npm test src/voice/nlu/intentParser.test.ts
```

### Manual Testing

1. Enable feature flag
2. Enable voice control in settings
3. Grant microphone permission
4. Say "Hey Vibe" (or press 'V')
5. Say a command
6. Verify action and feedback

## Troubleshooting

### Wake word not detected
- Check browser console for errors
- Verify Picovoice access key is set
- Try increasing wake sensitivity in settings
- Use 'V' key simulator for testing

### ASR not working
- Check microphone permission
- Verify browser supports Web Speech API
- Check browser console for errors
- Try offline mode if available

### Commands not understood
- Speak clearly and pause after wake word
- Check supported commands list
- Review intent parser logs in console

## Rollback

To disable voice control:

1. Set `VOICE_CONTROL_ENABLED: false` in feature flags
2. Or toggle off in Settings → Voice & Privacy
3. No other code changes needed (feature is isolated)

## Future Enhancements

- [ ] Implement Vosk WASM worker
- [ ] Add more languages (es-MX, pt-BR, etc.)
- [ ] Context-aware commands (playlist-specific)
- [ ] Voice-based playlist creation
- [ ] Emotion detection from voice tone
- [ ] Custom wake word support

## Credits

- Picovoice Porcupine: Wake word detection
- Web Speech API: Browser-native ASR
- Vosk: Offline ASR fallback
