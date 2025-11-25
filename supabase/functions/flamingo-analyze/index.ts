/**
 * AI Audio Q&A Edge Function
 * 
 * Accepts audio blob and uses NVIDIA Audio Flamingo 3 via Hugging Face Inference API to:
 * - Answer questions about songs (instruments, mood, genre, tempo, etc.)
 * - Analyze audio characteristics
 * - Provide music theory insights
 * - Describe melodies and harmonies
 * 
 * Uses: nvidia/audio-flamingo-3-hf
 * 
 * SECURITY: HF token is fetched from Supabase secrets (server-side only)
 * Never expose the token to client
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('[Flamingo] 🎵 Received audio analysis request');

    // Get Hugging Face token from Supabase secrets (server-side only)
    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!HF_TOKEN) {
      console.error('[Flamingo] ❌ HUGGING_FACE_ACCESS_TOKEN not configured');
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

    console.log('[Flamingo] 📝 Question:', question || 'Audio analysis');
    console.log('[Flamingo] 🎤 Audio blob size:', audioBlob.length);

    // Decode base64 audio
    const binaryAudio = Uint8Array.from(atob(audioBlob), c => c.charCodeAt(0));
    
    // Use NVIDIA Audio Flamingo 3 for comprehensive audio Q&A
    const HF_API_URL = 'https://api-inference.huggingface.co/models/nvidia/audio-flamingo-3-hf';
    
    console.log('[Flamingo] 🚀 Sending to NVIDIA Audio Flamingo 3...');

    // Prepare multimodal request with audio and text question
    const formData = new FormData();
    formData.append('inputs', new Blob([binaryAudio], { type: 'audio/wav' }));
    if (question) {
      formData.append('question', question);
    }

    // Call Hugging Face API
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: binaryAudio,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Flamingo] ❌ HF API error:', response.status, errorText);
      
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
    console.log('[Flamingo] ✅ Analysis complete:', result);

    // Flamingo returns text response with audio analysis
    let aiResponse = '';
    
    if (typeof result === 'string') {
      aiResponse = result;
    } else if (result.generated_text) {
      aiResponse = result.generated_text;
    } else if (result[0]?.generated_text) {
      aiResponse = result[0].generated_text;
    } else if (Array.isArray(result)) {
      aiResponse = JSON.stringify(result);
    } else {
      aiResponse = 'Unable to analyze audio. Please try again.';
    }

    console.log('[Flamingo] 📤 Sending response:', aiResponse);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        raw: JSON.stringify(result),
        question: question || 'Audio emotion analysis'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Flamingo] ❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
