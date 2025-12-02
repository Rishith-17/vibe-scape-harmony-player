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

    // Convert base64 to binary - HuggingFace expects raw binary, not JSON
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    const response = await fetch(
      'https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: binaryData,
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

    // Validate that a face is actually detected
    // If scores are too evenly distributed or top confidence is too low, likely no face
    const topScore = sortedEmotions[0]?.score || 0
    const avgScore = sortedEmotions.reduce((sum: number, e: any) => sum + e.score, 0) / sortedEmotions.length
    const scoreVariance = sortedEmotions.reduce((sum: number, e: any) => sum + Math.pow(e.score - avgScore, 2), 0) / sortedEmotions.length
    
    // If top confidence is below 25% or scores are too evenly distributed (low variance)
    if (topScore < 0.25 || scoreVariance < 0.005) {
      throw new Error('No clear face detected in the image. Please upload a photo with a clear, well-lit face.')
    }

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
