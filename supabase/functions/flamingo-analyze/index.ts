/**
 * Audio Emotion Analysis Edge Function
 * 
 * Accepts audio blob and uses Hugging Face Inference API to analyze:
 * - Emotion detection (happy, sad, angry, calm, neutral, etc.)
 * - Audio mood/vibe classification
 * 
 * Uses: ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition
 * (NVIDIA Audio Flamingo 3 is no longer available - 410 Gone)
 * 
 * SECURITY: HF token is fetched from Supabase secrets (server-side only)
 * Never expose the token to client
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Get emoji for emotion label
 */
function getEmotionEmoji(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('happy') || lower.includes('joy')) return '😊';
  if (lower.includes('sad') || lower.includes('sorrow')) return '😢';
  if (lower.includes('angry') || lower.includes('anger')) return '😠';
  if (lower.includes('fear') || lower.includes('afraid')) return '😨';
  if (lower.includes('calm') || lower.includes('neutral')) return '😌';
  if (lower.includes('surprise')) return '😮';
  if (lower.includes('disgust')) return '🤢';
  return '🎵';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AudioAnalysis] 🎵 Received audio analysis request');

    // Get Hugging Face token from Supabase secrets (server-side only)
    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!HF_TOKEN) {
      console.error('[AudioAnalysis] ❌ HUGGING_FACE_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { audioBlob, question } = await req.json();
    
    if (!audioBlob) {
      return new Response(
        JSON.stringify({ error: 'Audio data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AudioAnalysis] 📝 Question:', question || 'Audio emotion analysis');
    console.log('[AudioAnalysis] 🎤 Audio blob size:', audioBlob.length);

    // Decode base64 audio
    const binaryAudio = Uint8Array.from(atob(audioBlob), c => c.charCodeAt(0));
    
    // Use a working audio emotion recognition model
    // Note: Audio Flamingo 3 is no longer available (410 Gone error)
    // Using emotion recognition model instead
    const HF_API_URL = 'https://api-inference.huggingface.co/models/ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition';
    
    console.log('[AudioAnalysis] 🚀 Sending to emotion recognition model...');

    // Call Hugging Face API with audio
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: binaryAudio,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AudioAnalysis] ❌ HF API error:', response.status, errorText);
      
      // Handle model loading
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: 'AI model is loading. Please try again in 20-30 seconds.',
            loading: true 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('[AudioAnalysis] ✅ Analysis complete:', result);

    // Audio classification models return array of {label, score}
    let aiResponse = '';
    
    if (Array.isArray(result) && result.length > 0) {
      // Sort by score and format as readable text
      const sortedResults = result.sort((a, b) => (b.score || 0) - (a.score || 0));
      const topResults = sortedResults.slice(0, 3); // Top 3 results
      
      // Format the results
      const emotions = topResults.map((r, i) => {
        const percentage = ((r.score || 0) * 100).toFixed(1);
        const emoji = getEmotionEmoji(r.label || '');
        return `${emoji} ${r.label}: ${percentage}%`;
      }).join('\n');
      
      aiResponse = `🎭 Audio Emotion Analysis:\n\n${emotions}\n\nThis audio has a ${topResults[0].label} vibe with ${((topResults[0].score || 0) * 100).toFixed(0)}% confidence.`;
    } else if (typeof result === 'string') {
      aiResponse = result;
    } else {
      aiResponse = 'Unable to analyze audio emotions';
    }

    console.log('[AudioAnalysis] 📤 Sending response:', aiResponse);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        raw: JSON.stringify(result),
        question: question || 'Audio emotion analysis'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AudioAnalysis] ❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
