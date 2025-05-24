
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
    const { image } = await req.json()
    
    if (!image) {
      throw new Error('Image data is required')
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1]
    if (!base64Data) {
      throw new Error('Invalid image format')
    }

    // Use OpenAI GPT-4o-mini with vision for emotion detection
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing image for emotion detection...')

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
            content: 'You are an emotion detection AI. Analyze the facial expression in the image and return ONLY a JSON object with: {"emotion": "happy|sad|neutral|angry", "confidence": 0.85}. Be precise and only detect one of these four emotions. Return confidence as a decimal between 0 and 1.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Detect the primary emotion in this person\'s face. Return only the JSON response.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    })

    const data = await response.json()
    console.log('OpenAI response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error')
    }

    let emotionResult
    try {
      const content = data.choices[0].message.content
      console.log('Raw content:', content)
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{.*\}/)
      if (jsonMatch) {
        emotionResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Parse error:', parseError)
      // Fallback result
      emotionResult = {
        emotion: 'neutral',
        confidence: 0.5
      }
    }

    // Validate the emotion is one of the allowed ones
    const allowedEmotions = ['happy', 'sad', 'neutral', 'angry']
    if (!allowedEmotions.includes(emotionResult.emotion)) {
      emotionResult.emotion = 'neutral'
    }

    // Ensure confidence is between 0 and 1
    if (typeof emotionResult.confidence !== 'number' || emotionResult.confidence < 0 || emotionResult.confidence > 1) {
      emotionResult.confidence = 0.5
    }

    console.log('Final emotion result:', emotionResult)

    return new Response(
      JSON.stringify(emotionResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Camera emotion detection error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        emotion: 'neutral',
        confidence: 0.5 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
