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

    // Convert base64 to binary for the API
    const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Call Hugging Face model for image classification with hand gesture detection
    const response = await fetch(
      'https://api-inference.huggingface.co/models/abhi1nandy2/hand-gesture-recognition-v1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: binaryData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Raw HF response:', result)

    // Parse the classification results and map to gesture types
    let detectedGesture = null
    let confidence = 0

    if (Array.isArray(result) && result.length > 0) {
      // Find the highest confidence detection
      const bestDetection = result.reduce((best, current) => 
        current.score > best.score ? current : best
      )

      confidence = bestDetection.score
      const label = bestDetection.label.toLowerCase()

      // Map model labels to our gesture types based on the classification model
      const gestureMap: Record<string, string> = {
        'palm': 'open_palm',
        'open': 'open_palm',
        'stop': 'open_palm',
        'fist': 'fist',
        'closed': 'fist',
        'punch': 'fist',
        'point': 'point',
        'finger': 'point',
        'index': 'point',
        'peace': 'peace_sign',
        'victory': 'peace_sign',
        'two': 'peace_sign',
        'v': 'peace_sign',
        'rock': 'rock_sign',
        'metal': 'rock_sign',
        'horn': 'rock_sign',
        'five': 'five_fingers',
        'spread': 'five_fingers',
        'hand': 'five_fingers'
      }

      // Find matching gesture
      for (const [key, gesture] of Object.entries(gestureMap)) {
        if (label.includes(key)) {
          detectedGesture = gesture
          break
        }
      }

      // If no specific match found, use simple gesture detection based on common patterns
      if (!detectedGesture) {
        if (label.includes('0') || label.includes('zero')) {
          detectedGesture = 'fist'
        } else if (label.includes('1') || label.includes('one')) {
          detectedGesture = 'point'
        } else if (label.includes('2') || label.includes('two')) {
          detectedGesture = 'peace_sign'
        } else if (label.includes('5') || label.includes('five')) {
          detectedGesture = 'five_fingers'
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