
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
    const { text, provider = 'gemini' } = await req.json()
    
    if (!text) {
      throw new Error('Text input is required')
    }

    let analysis
    
    if (provider === 'gemini') {
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
              text: `Analyze the emotional content of this text and respond with only a JSON object containing: mood (happy, sad, neutral, angry), intensity (1-10), and music_suggestions (array of 3 music genres). Only use these four emotions: happy, sad, neutral, angry. Text: "${text}"`
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
        
        // Ensure mood is one of the allowed emotions
        const allowedEmotions = ['happy', 'sad', 'neutral', 'angry']
        if (!allowedEmotions.includes(analysis.mood)) {
          // Map other emotions to our allowed set
          const mood = analysis.mood.toLowerCase()
          if (['excited', 'energetic', 'joyful', 'cheerful', 'optimistic'].includes(mood)) {
            analysis.mood = 'happy'
          } else if (['melancholic', 'depressed', 'down', 'disappointed', 'lonely'].includes(mood)) {
            analysis.mood = 'sad'
          } else if (['furious', 'mad', 'rage', 'frustrated', 'annoyed'].includes(mood)) {
            analysis.mood = 'angry'
          } else {
            analysis.mood = 'neutral'
          }
        }
      } catch {
        analysis = {
          mood: 'neutral',
          intensity: 5,
          music_suggestions: ['pop', 'indie', 'acoustic']
        }
      }
    } else if (provider === 'openai') {
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
              content: 'You are an emotion analysis AI. Analyze the emotional content of the text and return a JSON response with mood (happy, sad, neutral, angry), intensity (1-10), and music_suggestions (array of 3 music genres/styles that would match this mood). Only use these four emotions: happy, sad, neutral, angry. Be precise and concise.'
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
        
        // Ensure mood is one of the allowed emotions
        const allowedEmotions = ['happy', 'sad', 'neutral', 'angry']
        if (!allowedEmotions.includes(analysis.mood)) {
          analysis.mood = 'neutral'
        }
      } catch {
        analysis = {
          mood: 'neutral',
          intensity: 5,
          music_suggestions: ['pop', 'indie', 'acoustic']
        }
      }
    }

    // Ensure intensity is between 1-10
    if (typeof analysis.intensity !== 'number' || analysis.intensity < 1 || analysis.intensity > 10) {
      analysis.intensity = 5
    }

    // Ensure music_suggestions is an array
    if (!Array.isArray(analysis.music_suggestions)) {
      analysis.music_suggestions = ['pop', 'indie', 'acoustic']
    }

    return new Response(
      JSON.stringify({ analysis, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Mood analysis error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        analysis: {
          mood: 'neutral',
          intensity: 5,
          music_suggestions: ['pop', 'indie', 'acoustic']
        }
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
