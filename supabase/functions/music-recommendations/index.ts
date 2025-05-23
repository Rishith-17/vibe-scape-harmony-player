
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mood, intensity, genres } = await req.json()
    
    if (!mood) {
      throw new Error('Mood is required')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Generate music recommendations for someone feeling ${mood} with intensity ${intensity}/10. ${genres ? `Focus on these genres: ${genres.join(', ')}.` : ''} Return a JSON array of 8 song recommendations, each with: title, artist, genre, youtube_search_query, and match_reason (why it fits the mood). Be specific with real songs.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a music recommendation expert. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error')
    }

    let recommendations
    try {
      recommendations = JSON.parse(data.choices[0].message.content)
    } catch {
      // Fallback recommendations
      recommendations = [
        {
          title: "Good 4 U",
          artist: "Olivia Rodrigo",
          genre: "Pop",
          youtube_search_query: "Good 4 U Olivia Rodrigo",
          match_reason: "Energetic and uplifting"
        }
      ]
    }

    return new Response(
      JSON.stringify({ recommendations, mood, intensity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Music recommendations error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
