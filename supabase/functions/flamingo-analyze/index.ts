/**
 * NVIDIA Audio Flamingo 3 AI Analysis Edge Function
 * 
 * Accepts audio blob and uses Hugging Face Inference API to analyze:
 * - Audio explanation (instruments, melody, harmony)
 * - Emotion detection (mood, vibe)
 * - Genre tagging
 * - Music theory summary
 * - Humming description
 * - Environment detection
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

    console.log('[Flamingo] 📝 Question:', question || 'General audio analysis');
    console.log('[Flamingo] 🎤 Audio blob size:', audioBlob.length);

    // Decode base64 audio
    const binaryAudio = Uint8Array.from(atob(audioBlob), c => c.charCodeAt(0));
    
    // Prepare request to Hugging Face Inference API
    const HF_API_URL = 'https://api-inference.huggingface.co/models/nvidia/audio-flamingo-3-hf';
    
    console.log('[Flamingo] 🚀 Sending to NVIDIA Audio Flamingo 3...');

    // Call Hugging Face API with audio
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'audio/wav',
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

    // Extract the AI response text
    // Flamingo returns various formats, handle the most common
    let aiResponse = '';
    
    if (typeof result === 'string') {
      aiResponse = result;
    } else if (result.generated_text) {
      aiResponse = result.generated_text;
    } else if (result.text) {
      aiResponse = result.text;
    } else if (Array.isArray(result) && result.length > 0) {
      aiResponse = result[0].generated_text || result[0].text || JSON.stringify(result[0]);
    } else {
      aiResponse = JSON.stringify(result);
    }

    // Enhance response based on question type
    let enhancedResponse = aiResponse;
    
    if (question) {
      const lowerQ = question.toLowerCase();
      
      if (lowerQ.includes('mood') || lowerQ.includes('emotion') || lowerQ.includes('feel')) {
        enhancedResponse = `🎭 Mood Analysis: ${aiResponse}`;
      } else if (lowerQ.includes('instrument')) {
        enhancedResponse = `🎸 Instruments: ${aiResponse}`;
      } else if (lowerQ.includes('genre')) {
        enhancedResponse = `🎵 Genre: ${aiResponse}`;
      } else if (lowerQ.includes('tempo') || lowerQ.includes('speed') || lowerQ.includes('bpm')) {
        enhancedResponse = `⏱️ Tempo: ${aiResponse}`;
      } else if (lowerQ.includes('melody') || lowerQ.includes('harmony')) {
        enhancedResponse = `🎼 Music Theory: ${aiResponse}`;
      }
    }

    console.log('[Flamingo] 📤 Sending response:', enhancedResponse);

    return new Response(
      JSON.stringify({ 
        response: enhancedResponse,
        raw: aiResponse,
        question: question || 'Audio analysis'
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
