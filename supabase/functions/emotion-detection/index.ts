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
    const { imageData } = await req.json()
    
    if (!imageData) {
      throw new Error('Image data is required')
    }

    const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!huggingFaceToken) {
      throw new Error('HuggingFace API token not configured')
    }

    console.log('Sending image to HuggingFace for emotion detection...')

    // Convert base64 to binary if needed
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData

    const response = await fetch(
      'https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Data
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HuggingFace API error:', response.status, errorText)
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Emotion detection result:', result)

    if (!result || result.length === 0) {
      throw new Error('No emotions detected in the image')
    }

    // Sort emotions by confidence score
    const sortedEmotions = result.sort((a: any, b: any) => b.score - a.score)

    return new Response(
      JSON.stringify({ emotions: sortedEmotions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Emotion detection error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to detect emotions'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
