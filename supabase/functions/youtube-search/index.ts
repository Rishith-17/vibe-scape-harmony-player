import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constants for key rotation
const BASE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface YouTubeKey {
  id: string;
  key_name: string;
  api_key: string;
  priority: number;
  status: 'enabled' | 'temporarily_disabled' | 'disabled';
  failure_count: number;
  cooldown_until: string | null;
}

interface YouTubeRequestResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

// Create Supabase client with service role for key management
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get available keys sorted by priority
async function getAvailableKeys(supabase: any): Promise<YouTubeKey[]> {
  const now = new Date().toISOString();
  
  const { data: keys, error } = await supabase
    .from('youtube_keys')
    .select('*')
    .or(`status.eq.enabled,and(status.eq.temporarily_disabled,cooldown_until.lt.${now})`)
    .order('priority', { ascending: false });
  
  if (error) {
    console.error('Error fetching keys:', error);
    return [];
  }
  
  // Re-enable keys whose cooldown has expired
  for (const key of keys || []) {
    if (key.status === 'temporarily_disabled' && key.cooldown_until && new Date(key.cooldown_until) < new Date()) {
      await supabase
        .from('youtube_keys')
        .update({ status: 'enabled', failure_count: 0, cooldown_until: null })
        .eq('id', key.id);
      key.status = 'enabled';
      key.failure_count = 0;
    }
  }
  
  return (keys || []).filter((k: YouTubeKey) => k.status === 'enabled');
}

// Mark key as temporarily disabled with exponential backoff
async function markKeyDisabled(supabase: any, key: YouTubeKey, errorMessage: string) {
  const newFailureCount = key.failure_count + 1;
  const cooldownMs = Math.min(BASE_COOLDOWN_MS * Math.pow(2, newFailureCount - 1), MAX_COOLDOWN_MS);
  const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString();
  
  console.log(`Disabling key ${key.key_name} until ${cooldownUntil} (failure #${newFailureCount})`);
  
  await supabase
    .from('youtube_keys')
    .update({
      status: 'temporarily_disabled',
      failure_count: newFailureCount,
      cooldown_until: cooldownUntil,
      last_error: errorMessage,
      last_error_at: new Date().toISOString(),
      total_failures: key.failure_count + 1
    })
    .eq('id', key.id);
}

// Log YouTube API request
async function logRequest(
  supabase: any, 
  keyId: string | null, 
  keyName: string | null, 
  endpoint: string, 
  params: any, 
  statusCode: number | null, 
  responseTimeMs: number, 
  errorCode: string | null, 
  errorMessage: string | null, 
  success: boolean
) {
  await supabase
    .from('youtube_logs')
    .insert({
      key_id: keyId,
      key_name: keyName,
      endpoint,
      params,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_code: errorCode,
      error_message: errorMessage,
      success
    });
}

// Update key usage stats
async function updateKeyStats(supabase: any, keyId: string) {
  await supabase.rpc('increment_youtube_key_requests', { key_id: keyId }).catch(() => {
    // Fallback if RPC doesn't exist
    supabase.from('youtube_keys')
      .update({ total_requests: supabase.sql`total_requests + 1` })
      .eq('id', keyId);
  });
}

// Check if error is a quota error
function isQuotaError(response: Response, data: any): boolean {
  if (response.status === 403) {
    const errorReason = data?.error?.errors?.[0]?.reason;
    return errorReason === 'quotaExceeded' || errorReason === 'rateLimitExceeded' || 
           data?.error?.message?.toLowerCase().includes('quota');
  }
  return false;
}

// Make YouTube API request with retry logic
async function makeYouTubeRequest(
  apiKey: string, 
  endpoint: string, 
  params: Record<string, string>
): Promise<YouTubeRequestResult> {
  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  const queryParams = new URLSearchParams({ ...params, key: apiKey });
  const url = `${baseUrl}/${endpoint}?${queryParams}`;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data, statusCode: response.status };
      }
      
      // For quota errors, don't retry - return immediately for key switch
      if (isQuotaError(response, data)) {
        return { 
          success: false, 
          error: data.error?.message || 'Quota exceeded', 
          statusCode: response.status 
        };
      }
      
      lastError = data.error?.message || 'Unknown error';
      
      // For other 4xx errors, don't retry
      if (response.status >= 400 && response.status < 500) {
        return { success: false, error: lastError, statusCode: response.status };
      }
      
      // For 5xx errors, retry with exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    } catch (error) {
      lastError = error.message;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }
  
  return { success: false, error: lastError || 'Network error after retries', statusCode: 500 };
}

// Main YouTube client with key rotation
async function youtubeSearch(query: string, maxResults: number = 20): Promise<any> {
  const supabase = getSupabaseClient();
  const startTime = Date.now();
  
  // Get available keys
  let keys = await getAvailableKeys(supabase);
  
  // If no keys in database, fall back to env variable
  if (keys.length === 0) {
    const envKey = Deno.env.get('YOUTUBE_API_KEY');
    if (envKey) {
      console.log('No keys in database, using YOUTUBE_API_KEY from env');
      keys = [{
        id: 'env-key',
        key_name: 'ENV_KEY',
        api_key: envKey,
        priority: 0,
        status: 'enabled',
        failure_count: 0,
        cooldown_until: null
      }];
    }
  }
  
  if (keys.length === 0) {
    console.log('No YouTube API keys available');
    return { error: 'youtube_quota_exhausted', message: 'No YouTube API keys available' };
  }
  
  const searchParams = {
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    q: query + ' official music video song audio',
    maxResults: String(Math.min(maxResults, 50)),
    order: 'relevance',
    videoEmbeddable: 'true',
    videoSyndicated: 'true'
  };
  
  // Try each key in priority order
  for (const key of keys) {
    console.log(`Trying key: ${key.key_name} (priority: ${key.priority})`);
    
    const result = await makeYouTubeRequest(key.api_key, 'search', searchParams);
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      // Log successful request
      await logRequest(
        supabase, 
        key.id !== 'env-key' ? key.id : null, 
        key.key_name, 
        'search', 
        { query, maxResults }, 
        result.statusCode!, 
        responseTime, 
        null, 
        null, 
        true
      );
      
      // Update stats
      if (key.id !== 'env-key') {
        await updateKeyStats(supabase, key.id);
      }
      
      return { success: true, data: result.data };
    }
    
    // Log failed request
    await logRequest(
      supabase, 
      key.id !== 'env-key' ? key.id : null, 
      key.key_name, 
      'search', 
      { query, maxResults }, 
      result.statusCode || null, 
      responseTime, 
      String(result.statusCode), 
      result.error || null, 
      false
    );
    
    // If quota error, disable key and try next
    if (result.statusCode === 403) {
      console.log(`Key ${key.key_name} quota exceeded, switching to next key`);
      if (key.id !== 'env-key') {
        await markKeyDisabled(supabase, key, result.error || 'Quota exceeded');
      }
      continue;
    }
    
    // For other errors, still try next key
    console.log(`Key ${key.key_name} failed with error: ${result.error}`);
  }
  
  // All keys exhausted
  console.log('All YouTube API keys exhausted');
  return { error: 'youtube_quota_exhausted', message: 'All YouTube API quotas exhausted. Please try later.' };
}

// Filter and format video results
function formatVideos(items: any[]): any[] {
  return items
    .filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();
      
      const excludeKeywords = ['trailer', 'interview', 'reaction', 'review', 'commentary', 'news', 'documentary'];
      const includeKeywords = ['music', 'song', 'audio', 'official', 'video', 'lyrics', 'acoustic', 'live'];
      
      const hasExclude = excludeKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
      const hasInclude = includeKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
      
      return !hasExclude && (hasInclude || title.includes('music') || title.includes('song'));
    })
    .map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium?.url || 
                item.snippet.thumbnails.default?.url ||
                `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
}

// Fallback response when no keys available
function generateFallbackResponse(query: string) {
  const fallbackSongs = [
    { title: "Flowers", artist: "Miley Cyrus", id: "G7KNmW9a75Y" },
    { title: "As It Was", artist: "Harry Styles", id: "H5v3kku4y6Q" },
    { title: "Heat Waves", artist: "Glass Animals", id: "mRD0-GxqHVo" },
    { title: "Stay", artist: "The Kid LAROI & Justin Bieber", id: "kTJczUoc26U" },
    { title: "Good 4 U", artist: "Olivia Rodrigo", id: "gNi_6U5Pm_o" },
    { title: "Levitating", artist: "Dua Lipa", id: "TUVcZfQe-Kw" },
    { title: "Blinding Lights", artist: "The Weeknd", id: "4NRXx6U8ABQ" },
    { title: "Watermelon Sugar", artist: "Harry Styles", id: "E07s5ZYygMg" },
    { title: "drivers license", artist: "Olivia Rodrigo", id: "ZmDBbnmKpqQ" },
    { title: "positions", artist: "Ariana Grande", id: "tcYodQoapMg" },
    { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar & Giveon", id: "tQ0yjYUFKAE" },
    { title: "Save Your Tears", artist: "The Weeknd & Ariana Grande", id: "XXYlFuWEuKI" },
    { title: "Deja Vu", artist: "Olivia Rodrigo", id: "qZXT0zxQEfE" },
    { title: "Montero (Call Me By Your Name)", artist: "Lil Nas X", id: "6swmTBVI83k" },
    { title: "Kiss Me More", artist: "Doja Cat ft. SZA", id: "0EVVKs6DQLo" }
  ];

  let filteredSongs = fallbackSongs;
  if (query && query !== 'music') {
    const queryLower = query.toLowerCase();
    filteredSongs = fallbackSongs.filter(song => 
      song.title.toLowerCase().includes(queryLower) || 
      song.artist.toLowerCase().includes(queryLower)
    );
    
    if (filteredSongs.length === 0) {
      filteredSongs = fallbackSongs.slice(0, 10);
    }
  }

  const videos = filteredSongs.map(song => ({
    id: song.id,
    title: song.title,
    description: `${song.title} by ${song.artist}`,
    thumbnail: `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`,
    channelTitle: song.artist,
    publishedAt: new Date().toISOString(),
    url: `https://www.youtube.com/watch?v=${song.id}`
  }));

  return new Response(
    JSON.stringify({ 
      videos,
      fallback: true,
      message: 'Showing popular songs due to API constraints'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 20 } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log(`Searching for: ${query}`);

    const result = await youtubeSearch(query, maxResults);
    
    // Handle quota exhausted error
    if (result.error === 'youtube_quota_exhausted') {
      console.log('All keys exhausted, returning fallback');
      return generateFallbackResponse(query);
    }
    
    // Handle other errors
    if (!result.success) {
      console.log('Search failed, returning fallback');
      return generateFallbackResponse(query);
    }
    
    const data = result.data;
    
    if (!data.items || data.items.length === 0) {
      console.log('No results found, using fallback data');
      return generateFallbackResponse(query);
    }

    const videos = formatVideos(data.items);
    console.log(`Found ${videos.length} filtered music videos`);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('YouTube search error:', error);
    
    const { query } = await req.json().catch(() => ({ query: 'music' }));
    return generateFallbackResponse(query || 'music');
  }
});
