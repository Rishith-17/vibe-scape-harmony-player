
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
    const { text, provider = 'openai' } = await req.json()
    
    if (!text) {
      throw new Error('Text input is required')
    }

    let analysis
    
    if (provider === 'openai') {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured')
      }

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
              content: 'You are an emotion analysis AI. Analyze the emotional content of the text and return a JSON response with mood (happy, sad, energetic, calm, angry, excited, melancholic, peaceful), intensity (1-10), and music_suggestions (array of 3 music genres/styles that would match this mood). Be precise and concise.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error')
      }

      try {
        analysis = JSON.parse(data.choices[0].message.content)
      } catch {
        // Fallback if response isn't valid JSON
        analysis = {
          mood: 'neutral',
          intensity: 5,
          music_suggestions: ['pop', 'indie', 'acoustic']
        }
      }
    } else if (provider === 'gemini') {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured')
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze the emotional content of this text and respond with only a JSON object containing: mood (happy, sad, energetic, calm, angry, excited, melancholic, peaceful), intensity (1-10), and music_suggestions (array of 3 music genres). Text: "${text}"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          }
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API error')
      }

      try {
        const content = data.candidates[0].content.parts[0].text
        analysis = JSON.parse(content)
      } catch {
        analysis = {
          mood: 'neutral',
          intensity: 5,
          music_suggestions: ['pop', 'indie', 'acoustic']
        }
      }
    }

    return new Response(
      JSON.stringify({ analysis, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Mood analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
