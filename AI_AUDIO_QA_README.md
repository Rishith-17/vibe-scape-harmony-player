# AI Audio Q&A Feature - NVIDIA Flamingo 3 Integration

## Overview

The AI Audio Q&A feature uses **NVIDIA Audio Flamingo 3** via the Hugging Face Inference API to analyze audio and answer questions about songs.

**Current Model**: `nvidia/audio-flamingo-3-hf`

This model specializes in:
- **Song Information**: Instruments, mood, genre, tempo, melody, harmony
- **Audio Characteristics**: Sound quality, mixing, production details
- **Music Theory**: Scales, keys, chord progressions, time signatures
- **Descriptive Analysis**: Comprehensive explanations of musical elements
- **Q&A Capabilities**: Answers specific questions about the audio

---

## Features

### 🎵 Comprehensive Audio Analysis

1. **Song Information Extraction**
   - Identifies instruments used in the track
   - Detects musical genre and style
   - Analyzes tempo, rhythm, and time signature
   - Example: "What instruments are in this song?"

2. **Mood & Emotion Detection**
   - Describes the overall mood and feeling
   - Identifies emotional characteristics
   - Example: "What's the mood of this song?"

3. **Music Theory Insights**
   - Detects musical scales and keys
   - Identifies chord progressions
   - Analyzes harmony and melody structure
   - Example: "What key is this song in?"

4. **Interactive Q&A**
   - Answer specific user questions about the audio
   - Provide detailed explanations
   - Real-time analysis (5-second audio capture)
   - Loading states with visual feedback

---

## Architecture

### Backend (Edge Function)

**File**: `supabase/functions/flamingo-analyze/index.ts`

- **Purpose**: Secure API endpoint that communicates with Hugging Face
- **Current Model**: `nvidia/audio-flamingo-3-hf`
- **Security**: HF token is fetched from Supabase secrets (server-side only)
- **Input**: Audio blob (base64) + optional question text
- **Output**: Comprehensive audio analysis and Q&A responses

**Key Features**:
- CORS enabled for web app
- Handles model loading states (503 errors)
- Supports natural language questions
- Provides detailed song information
- Secure token management (never exposed to client)

---

### Frontend Components

#### 1. **VoiceController** (`src/voice/voiceController.ts`)

Enhanced with AI audio analysis:

- **`isAudioAnalysisQuestion(transcript)`**: Detects if user is asking for audio analysis
- **`handleAudioAnalysis(question)`**: Main handler for Flamingo queries
- **`analyzeCurrentAudio()`**: Public API for manual analysis trigger

**Audio Analysis Keywords**:
```typescript
[
  'what instrument', 'what mood', 'what emotion', 'what genre',
  'describe', 'explain', 'analyze', 'what is this',
  'tell me about', 'what am i', 'sound like',
  'melody', 'harmony', 'tempo', 'vibe', 'feeling'
]
```

#### 2. **AudioCapture** (`src/voice/audioCapture.ts`)

Handles audio recording:

- **`startRecording(durationMs)`**: Captures audio from microphone
- **`capturePlaybackAudio(durationMs)`**: Records current playback audio
- **`blobToBase64(blob)`**: Converts audio to base64 for API transmission
- **Default Duration**: 5 seconds

**Note**: Due to YouTube iframe CORS restrictions, playback audio is captured via microphone (records ambient sound). The emotion recognition model analyzes whatever audio it receives.

#### 3. **AIResponsePanel** (`src/components/AIResponsePanel.tsx`)

Neon-themed UI panel that displays AI responses:

- **Position**: Fixed bottom-left (or right on desktop)
- **Styling**: Matches main UI neon theme with cyan glow
- **Features**:
  - Loading animation with pulsing Sparkles icon
  - Close button
  - Smooth fade-in/out animations (Framer Motion)
  - Glowing bottom accent

#### 4. **SpotifyMiniPlayer** (`src/components/SpotifyMiniPlayer.tsx`)

Added "AI Explain Song" button:

- **Icon**: `Sparkles` (lucide-react)
- **Functionality**: Triggers `analyzeCurrentAudio()`
- **Styling**: Cyan glow on hover, matches neon theme
- **States**: Loading spinner when analyzing

---

## User Flows

### Flow 1: Voice-Activated AI Q&A

1. User taps mic or uses open-hand gesture
2. Mic activates (same shared instance as all voice commands)
3. User asks: *"What instruments are in this song?"*
4. VoiceController detects audio analysis question
5. AudioCapture records 5 seconds of audio
6. Audio sent to `/flamingo-analyze` edge function
7. Flamingo analyzes and returns response
8. AI response displayed in AIResponsePanel
9. TTS speaks the response aloud

### Flow 2: Manual AI Explain Button

1. User clicks "AI Explain Song" button (Sparkles icon)
2. Loading state shown (cyan spinning loader)
3. AudioCapture records 5 seconds
4. Audio sent to Flamingo API
5. Response displayed in AIResponsePanel
6. TTS speaks the response

---

## Configuration

### Required Secrets

**Supabase Secret**: `HUGGING_FACE_ACCESS_TOKEN`

- **How to Add**:
  1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
  2. Add secret: `HUGGING_FACE_ACCESS_TOKEN`
  3. Value: Your Hugging Face API token from https://huggingface.co/settings/tokens

**IMPORTANT**: The token is **NEVER** exposed to the client. All API calls go through the secure edge function.

### Edge Function Configuration

**File**: `supabase/config.toml`

```toml
[functions.flamingo-analyze]
verify_jwt = false
```

This allows public access to the function (auth can be added later if needed).

---

## API Reference

### Edge Function: `flamingo-analyze`

**Endpoint**: `https://<project-ref>.supabase.co/functions/v1/flamingo-analyze`

**Method**: POST

**Request Body**:
```json
{
  "audioBlob": "base64-encoded-audio",
  "question": "What instruments are in this song?" // optional
}
```

**Response (Success)**:
```json
{
  "response": "🎸 Instruments: This song features electric guitar, drums, bass guitar, and synthesizers.",
  "raw": "This song features electric guitar...",
  "question": "What instruments are in this song?"
}
```

**Response (Model Loading)**:
```json
{
  "error": "AI model is loading. Please try again in 20-30 seconds.",
  "loading": true
}
```

**Response (Error)**:
```json
{
  "error": "AI analysis failed",
  "details": "Error message"
}
```

---

## Error Handling

### 1. Model Loading (503)

When Hugging Face model is cold-starting:

- **Edge Function**: Returns 503 with `loading: true`
- **UI**: Shows message "AI model is warming up. Please try again in 20 seconds."
- **TTS**: Speaks the loading message
- **Retry**: User can retry after ~20-30 seconds

### 2. API Errors

- Logged in edge function console
- User-friendly error messages displayed
- TTS speaks error feedback
- AIResponsePanel shows error state

### 3. Audio Capture Errors

- Logged in browser console
- Fallback to error message
- User prompted to try again

---

## Performance Considerations

### Audio Capture Duration

- **Default**: 5 seconds
- **Rationale**: Balance between audio quality and API latency
- **Adjustable**: Modify `capturePlaybackAudio(5000)` parameter

### API Latency

- **First Request**: 20-30 seconds (model loading)
- **Subsequent Requests**: 3-5 seconds
- **Network Dependent**: May vary based on connection

### Resource Usage

- **Microphone**: Reuses shared mic instance (no duplicate streams)
- **Memory**: Audio blob converted to base64 (~7MB for 5 seconds)
- **CPU**: Minimal, handled by browser MediaRecorder API

---

## Limitations

### YouTube Playback Capture

Due to browser CORS restrictions on YouTube iframes:

- **Cannot**: Directly capture YouTube audio output
- **Workaround**: Use microphone to record ambient sound
- **Implication**: AI analyzes what the mic hears (including background noise)

**Alternative Solutions** (future enhancements):
- Server-side audio extraction from YouTube URLs
- Use YouTube Data API to fetch audio features
- Implement Web Audio API with CORS-enabled sources

### Model Availability

- **Hugging Face Free Tier**: Model may cold-start (20-30s delay)
- **Rate Limits**: Subject to HF API rate limits
- **Quota**: Check HF account usage limits

---

## Testing

### Manual Testing Checklist

1. **Voice Activation**:
   - Tap mic → ask "What instruments are in this song?"
   - Verify AI response displays and speaks

2. **Gesture Activation**:
   - Open hand → ask audio analysis question
   - Verify same mic instance used (check console logs)

3. **Button Activation**:
   - Click "AI Explain Song" button
   - Verify loading state → response display

4. **Error Handling**:
   - Disconnect internet → verify error message
   - Wait for model to cold-start → verify loading message

5. **UI States**:
   - Verify AIResponsePanel animations
   - Check neon glow effects
   - Test close button

### Console Logs

Check for these logs during testing:

```
[VoiceController] 🎵 Detected audio analysis question: ...
[AudioCapture] 🎤 Starting audio capture...
[AudioCapture] ✅ Audio captured: 123456 bytes
[Flamingo] 🎵 Received audio analysis request
[Flamingo] ✅ Analysis complete
[VoiceController] ✅ Flamingo response: ...
```

---

## Future Enhancements

### 1. **Song Identification**

- Integrate Shazam or AudD API for song recognition
- Keep Flamingo for descriptive analysis only

### 2. **Multi-Modal Analysis**

- Combine audio + lyrics analysis
- Use album artwork for visual context

### 3. **Conversation History**

- Store AI responses in Supabase
- Allow follow-up questions ("Tell me more about the drums")

### 4. **Voice Customization**

- Use ElevenLabs API for more natural TTS
- Select voice personality (energetic, calm, etc.)

### 5. **Real-Time Streaming**

- Stream Flamingo responses word-by-word
- Show loading progress bar

### 6. **Context-Aware Analysis**

- Remember previous questions
- Provide comparative analysis ("This is faster than the last song")

---

## Troubleshooting

### Issue: "AI model is loading" persists

**Solution**:
- Wait 30 seconds, then retry
- Check Hugging Face model status page
- Verify HF API token is valid

### Issue: No audio captured

**Solution**:
- Check microphone permissions
- Ensure browser supports MediaRecorder API
- Test mic in browser settings

### Issue: AI response not speaking

**Solution**:
- Check TTS is enabled in voice settings
- Verify browser supports Web Speech API
- Check volume settings

### Issue: Edge function 500 error

**Solution**:
- Verify `HUGGING_FACE_ACCESS_TOKEN` is set in Supabase
- Check edge function logs in Supabase Dashboard
- Ensure audio blob size is reasonable (<10MB)

---

## Security Notes

### ✅ Best Practices Followed

1. **No Client-Side Secrets**: HF token stored in Supabase, accessed server-side only
2. **CORS Protection**: Edge function uses proper CORS headers
3. **Input Validation**: Audio blob size and format validated
4. **Error Messages**: No sensitive info leaked in error responses

### ⚠️ Considerations

1. **Public Edge Function**: Currently no JWT verification (can add if needed)
2. **Rate Limiting**: Consider adding rate limits to prevent abuse
3. **Audio Privacy**: User audio sent to external API (Hugging Face)

---

## Credits

- **AI Model**: NVIDIA Audio Flamingo 3 via Hugging Face
- **Icons**: Lucide React (Sparkles, Loader2)
- **Animations**: Framer Motion
- **Backend**: Supabase Edge Functions

---

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Hugging Face API token is valid
3. Test edge function directly via Supabase Dashboard
4. Check Supabase Edge Function logs

---

**Last Updated**: 2025-11-25
**Version**: 1.0.0
