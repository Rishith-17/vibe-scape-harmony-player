/**
 * AI Song Q&A Edge Function
 * 
 * Uses Google Gemini to answer questions about songs based on metadata
 * (title, artist, genre, etc.)
 * 
 * SECURITY: Gemini API key is fetched from Supabase secrets (server-side only)
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
    console.log('[SongQA] 🎵 Received song Q&A request');

    // Get Gemini API key from Supabase secrets (server-side only)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('[SongQA] ❌ GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - expecting song metadata + question
    const { songTitle, songArtist, question } = await req.json();
    
    if (!songTitle) {
      return new Response(
        JSON.stringify({ error: 'Song title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SongQA] 🎵 Song:', songTitle, 'by', songArtist);
    console.log('[SongQA] 📝 Question:', question || 'General analysis');

    // Build comprehensive prompt for Gemini
    const prompt = `You are a music expert AI assistant. Answer questions about songs based on your knowledge of music.

Song: "${songTitle}" ${songArtist ? `by ${songArtist}` : ''}

User question: ${question || 'Tell me about this song - what instruments, mood, genre, and tempo does it have?'}

Provide a detailed, informative answer about the song. Include information about:
- Instruments used (if known or typical for the genre)
- Musical mood and emotion
- Genre and style
- Tempo and rhythm (fast/slow, upbeat/mellow)
- Notable musical elements or characteristics
- Any interesting facts about the song

Keep your response conversational and engaging, as if speaking to a music enthusiast.`;

    console.log('[SongQA] 🚀 Calling Gemini API...');

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SongQA] ❌ Gemini API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('[SongQA] ✅ Analysis complete');

    // Extract Gemini response
    let aiResponse = '';
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      aiResponse = result.candidates[0].content.parts[0].text;
    } else {
      aiResponse = 'Unable to analyze the song. Please try again.';
    }

    console.log('[SongQA] 📤 Sending response');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        question: question || 'Song analysis',
        song: songTitle,
        artist: songArtist
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SongQA] ❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
