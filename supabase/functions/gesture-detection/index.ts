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

    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!hfToken) {
      throw new Error('Hugging Face API key not configured')
    }

    console.log('Processing gesture detection request...')

    // Call Hugging Face model for hand gesture detection
    const response = await fetch(
      'https://api-inference.huggingface.co/models/lewiswatson/yolov8x-tuned-hand-gestures',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageData,
          parameters: {
            threshold: 0.5 // Confidence threshold for detections
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Raw HF response:', result)

    // Parse the detection results and map to gesture types
    let detectedGesture = null
    let confidence = 0

    if (Array.isArray(result) && result.length > 0) {
      // Find the highest confidence detection
      const bestDetection = result.reduce((best, current) => 
        current.score > best.score ? current : best
      )

      confidence = bestDetection.score
      const label = bestDetection.label.toLowerCase()

      // Map model labels to our gesture types
      const gestureMap: Record<string, string> = {
        'open_palm': 'open_palm',
        'palm': 'open_palm',
        'open': 'open_palm',
        'fist': 'fist',
        'closed_fist': 'fist',
        'point': 'point',
        'pointing': 'point',
        'one': 'point',
        'five': 'five_fingers',
        'spread': 'five_fingers',
        'open_hand': 'five_fingers',
        'peace': 'peace_sign',
        'two': 'peace_sign',
        'victory': 'peace_sign',
        'rock': 'rock_sign',
        'horn': 'rock_sign',
        'metal': 'rock_sign'
      }

      // Find matching gesture
      for (const [key, gesture] of Object.entries(gestureMap)) {
        if (label.includes(key)) {
          detectedGesture = gesture
          break
        }
      }

      console.log(`Detected gesture: ${detectedGesture} with confidence: ${confidence}`)
    }

    return new Response(
      JSON.stringify({ 
        gesture: detectedGesture,
        confidence,
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Gesture detection error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})