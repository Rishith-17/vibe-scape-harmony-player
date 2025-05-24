
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
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('Audio data is required')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing audio for emotion detection...')

    // Convert base64 to binary
    const binaryAudio = atob(audio)
    const audioBuffer = new Uint8Array(binaryAudio.length)
    for (let i = 0; i < binaryAudio.length; i++) {
      audioBuffer[i] = binaryAudio.charCodeAt(i)
    }

    // Prepare form data for Whisper
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')

    // Transcribe audio using Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      throw new Error('Failed to transcribe audio')
    }

    const transcription = await whisperResponse.json()
    const transcribedText = transcription.text

    console.log('Transcribed text:', transcribedText)

    // Analyze emotion from transcribed text
    const emotionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an emotion analysis AI. Analyze the emotional content of the transcribed speech and return ONLY a JSON object with: {"emotion": "happy|sad|neutral|angry", "confidence": 0.85}. Be precise and only detect one of these four emotions. Return confidence as a decimal between 0 and 1.'
          },
          {
            role: 'user',
            content: `Analyze the emotion in this transcribed speech: "${transcribedText}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    })

    const emotionData = await emotionResponse.json()
    console.log('Emotion analysis response:', emotionData)

    if (!emotionResponse.ok) {
      throw new Error(emotionData.error?.message || 'Emotion analysis failed')
    }

    let emotionResult
    try {
      const content = emotionData.choices[0].message.content
      console.log('Raw emotion content:', content)
      
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
      JSON.stringify({
        ...emotionResult,
        transcription: transcribedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Voice emotion detection error:', error)
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
