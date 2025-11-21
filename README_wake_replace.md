# Porcupine Wake Word Integration - Deployment Guide

## Overview
This guide documents the secure implementation of "Hello Vibe" wake word detection using Picovoice Porcupine Web SDK with server-side key management.

## Architecture

### Security Model
- **Access Key Storage**: Picovoice access key is stored in Supabase `secrets` table (server-side only)
- **Key Retrieval**: Authenticated edge function (`picovoice-key`) fetches key using SERVICE_ROLE
- **Client Access**: Client calls edge function with JWT token to get key at runtime (never bundled)

### Audio Stream Architecture
1. **Porcupine Wake Detection Stream**: Always listening for "Hello Vibe" (separate audio stream)
2. **Shared ASR Command Stream**: Used by VoiceController for command recognition (same instance for Tap/Gesture/Wake)

### Key Components
- `supabase/functions/picovoice-key/index.ts` - Secure server-side endpoint for key retrieval
- `src/voice/wake/PorcupineWeb.ts` - Wake word detection engine (calls shared VoiceController)
- `src/voice/voiceController.ts` - Singleton controller with shared ASR instance

## Installation Steps

### 1. Deploy Keyword Model File

**Development:**
The keyword file is currently at: `/mnt/data/Hello-vibe_en_wasm_v3_0_0.ppn`

**Production:**
Copy the keyword file to your public directory:
```bash
cp /mnt/data/Hello-vibe_en_wasm_v3_0_0.ppn public/models/Hello-vibe_en_wasm_v3_0_0.ppn
```

**CI/CD Integration:**
Add to your build pipeline:
```yaml
# Example GitHub Actions
- name: Copy wake word model
  run: cp /path/to/Hello-vibe_en_wasm_v3_0_0.ppn public/models/
```

### 2. Configure Supabase Secrets

Store the Picovoice access key in Supabase `secrets` table:

```sql
-- Insert access key (run this via Supabase SQL Editor)
INSERT INTO public.secrets (key, value)
VALUES ('PICOVOICE_ACCESS_KEY', 'your_picovoice_access_key_here')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Note**: The `secrets` table must have RLS policies that prevent client access. Only the edge function with SERVICE_ROLE can read it.

### 3. Deploy Edge Function

The edge function `picovoice-key` is automatically deployed with your code. It:
- Requires authentication (JWT token in Authorization header)
- Uses SERVICE_ROLE key to bypass RLS
- Returns access key only to authenticated users

### 4. Verify Installation

After deployment, test the wake word:
1. Log in to your app
2. Tap the microphone button (arms the shared ASR instance)
3. Say "Hello Vibe"
4. The system should start listening for your command

Check console logs for:
```
[PorcupineWeb] ✅ Wake word detection active - listening for "Hello Vibe"
[VoiceController] ASR_ID=<id> source=wake
```

## Security Checklist

✅ Access key stored in Supabase `secrets` table (not in code)  
✅ Edge function uses SERVICE_ROLE key (server-side only)  
✅ Edge function requires authentication (JWT token)  
✅ Client fetches key at runtime (not bundled in build)  
✅ RLS policies prevent direct client access to `secrets` table  
✅ Keyword model file served from public directory (safe to expose)

## Rotating Access Keys

To rotate your Picovoice access key:

1. **Update Supabase secrets table:**
```sql
UPDATE public.secrets 
SET value = 'new_picovoice_access_key_here', 
    created_at = NOW()
WHERE key = 'PICOVOICE_ACCESS_KEY';
```

2. **No code deployment needed** - the edge function will automatically use the new key

3. **Users may need to refresh** - they'll fetch the new key on next session

## Troubleshooting

### Wake word not working
1. Check browser console for `[PorcupineWeb]` logs
2. Verify access key is configured in Supabase secrets table
3. Ensure user is authenticated (edge function requires JWT)
4. Confirm keyword file exists at `/models/Hello-vibe_en_wasm_v3_0_0.ppn`

### "Failed to fetch access key" error
- Verify edge function is deployed: `supabase functions list`
- Check edge function logs: `supabase functions logs picovoice-key`
- Ensure user has valid session token

### Multiple mic instances
- Verify wake detection calls `VoiceController.startListeningFromArmedMic('wake')`
- Check console logs for `ASR_ID` - all sources (tap/gesture/wake) should show same ID
- Ensure PorcupineWeb.ts does NOT call `getUserMedia()` or create `new SpeechRecognition()`

## File Locations

```
public/models/Hello-vibe_en_wasm_v3_0_0.ppn    # Wake word keyword model (production)
supabase/functions/picovoice-key/index.ts      # Secure key retrieval endpoint
src/voice/wake/PorcupineWeb.ts                 # Wake word detection engine
src/voice/voiceController.ts                   # Singleton ASR controller
```

## API Reference

### Edge Function: `picovoice-key`
**Endpoint**: `POST /functions/v1/picovoice-key`  
**Auth**: Required (JWT in Authorization header)  
**Response**:
```json
{
  "accessKey": "your_picovoice_key"
}
```

### VoiceController Methods
```typescript
// Check if mic permission granted and ASR ready
VoiceController.isMicArmed(): boolean

// Request mic permission and create shared ASR (call once)
VoiceController.armMic(): Promise<void>

// Start listening using shared ASR (call from wake/gesture)
VoiceController.startListeningFromArmedMic(source?: string): Promise<void>

// Get shared ASR instance ID (for debugging)
VoiceController.getAsrInstanceId(): string | null
```

## Developer Notes

- **Single Mic Rule**: Only `VoiceController.armMic()` creates microphone/ASR instances
- **Wake Detection**: Porcupine has its own audio stream for wake detection (separate from command ASR)
- **Shared Command ASR**: All activation sources (tap/gesture/wake) use the SAME ASR instance for commands
- **No Duplicate Instances**: Wake and gesture code must NEVER call `getUserMedia()` or create `SpeechRecognition`
