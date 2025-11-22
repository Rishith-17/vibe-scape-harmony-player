import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, context } = await req.json();
    
    if (!transcript) {
      throw new Error('Transcript is required');
    }

    // Get Gemini API key from secure environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('[Gemini] GEMINI_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    console.log('[Gemini] Processing query:', transcript);
    console.log('[Gemini] Context:', context);

    // Build prompt
    const songContext = context?.title 
      ? `The user is asking about the song "${context.title}"${context.artist ? ` by ${context.artist}` : ''}.`
      : 'The user is asking about music.';

    const prompt = `${songContext}

User question: "${transcript}"

Provide a helpful, concise answer (2-3 sentences) about the song. Include relevant information like artist, year, album, genre, or interesting facts based on what was asked.`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Gemini] Response received');

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                 'Sorry, I could not get information about this song.';

    return new Response(
      JSON.stringify({ 
        text,
        raw: data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Gemini] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
