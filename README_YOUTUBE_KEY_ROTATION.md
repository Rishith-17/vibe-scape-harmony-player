# YouTube API Key Rotation System

This document describes the automatic YouTube Data API v3 key rotation and failover system.

## Overview

The system manages multiple YouTube API keys with automatic failover when quota is exhausted. Keys are stored securely in Supabase and never exposed to the client.

## Database Schema

### `youtube_keys` Table
Stores API keys with priority and status tracking:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key_name` | TEXT | Friendly name (e.g., "Primary", "Secondary") |
| `api_key` | TEXT | The actual YouTube API key |
| `priority` | INTEGER | Higher = tried first |
| `status` | ENUM | `enabled`, `temporarily_disabled`, `disabled` |
| `failure_count` | INTEGER | Consecutive failures |
| `cooldown_until` | TIMESTAMP | When key can be retried |
| `last_error` | TEXT | Last error message |
| `total_requests` | INTEGER | Lifetime request count |
| `total_failures` | INTEGER | Lifetime failure count |

### `youtube_logs` Table
Logs all API requests for auditing:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key_id` | UUID | Reference to key used |
| `endpoint` | TEXT | API endpoint called |
| `params` | JSONB | Request parameters |
| `status_code` | INTEGER | HTTP response code |
| `response_time_ms` | INTEGER | Request duration |
| `error_code` | TEXT | Error code if failed |
| `success` | BOOLEAN | Whether request succeeded |

## Adding New Keys

### Via Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run:

```sql
INSERT INTO public.youtube_keys (key_name, api_key, priority)
VALUES ('Primary Key', 'YOUR_API_KEY_HERE', 100);

INSERT INTO public.youtube_keys (key_name, api_key, priority)
VALUES ('Secondary Key', 'YOUR_SECOND_API_KEY', 50);
```

Higher priority keys are tried first.

### Via Edge Function (Admin Only)

The system also falls back to the `YOUTUBE_API_KEY` environment variable if no keys are in the database.

## Cooldown Policy

When a key hits quota limits:

1. **First failure**: 5 minute cooldown
2. **Second failure**: 10 minute cooldown
3. **Third failure**: 20 minute cooldown
4. **Continues doubling** up to 6 hours maximum

After cooldown expires, the key is automatically re-enabled and tested.

## Error Handling

| Error Type | Behavior |
|-----------|----------|
| Quota exceeded (403) | Immediately switch to next key |
| Rate limit (429) | Immediately switch to next key |
| Server error (5xx) | Retry 3 times with exponential backoff, then switch |
| Network error | Retry 3 times, then switch |
| All keys exhausted | Return fallback popular songs |

## Client Behavior

The client receives identical responses regardless of which key is used. If all keys are exhausted, a fallback response with popular songs is returned with `fallback: true` flag.

## Monitoring

Check the `youtube_logs` table for:
- Request success rates per key
- Average response times
- Error patterns
- Usage distribution

Example query:
```sql
SELECT 
  key_name,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  AVG(response_time_ms) as avg_response_time
FROM youtube_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY key_name;
```

## Security

- Keys are stored only in the `youtube_keys` table with service_role-only RLS
- Keys are never sent to the client
- All key operations happen server-side in edge functions
