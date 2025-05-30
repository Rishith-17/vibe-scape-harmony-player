
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TRENDING_DATA = {
  global: [
    { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
    { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock" },
    { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop" },
    { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats" },
    { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop" },
    { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", genre: "Dance Pop" },
    { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop" },
    { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop" },
    { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B" },
    { title: "Golden Hour", artist: "JVKE", genre: "Pop" }
  ],
  countries: {
    USA: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop" },
      { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop" },
      { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B" },
      { title: "Golden Hour", artist: "JVKE", genre: "Pop" }
    ],
    UK: [
      { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", genre: "Dance Pop" },
      { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop" },
      { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop" }
    ],
    India: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood" }
    ],
    Brazil: [
      { title: "Ela Partiu", artist: "Tim Maia", genre: "Brazilian Soul" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats" },
      { title: "Samba do Approach", artist: "Zeca Pagodinho", genre: "Samba" },
      { title: "Envolver", artist: "Anitta", genre: "Brazilian Funk" }
    ],
    Japan: [
      { title: "Idol", artist: "YOASOBI", genre: "J-Pop" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "Kaikai Kitan", artist: "Eve", genre: "J-Rock" },
      { title: "Racing into the Night", artist: "YOASOBI", genre: "J-Pop" },
      { title: "Pretender", artist: "Official HIGE DANdism", genre: "J-Pop" }
    ]
  },
  regional: {
    Hindi: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood" },
      { title: "Tum Hi Ho", artist: "Arijit Singh", genre: "Bollywood" }
    ],
    Spanish: [
      { title: "Bzrp Music Sessions #53", artist: "Bizarrap & Shakira", genre: "Latin Urban" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "Envolver", artist: "Anitta", genre: "Brazilian Funk" },
      { title: "Quevedo: Bzrp Music Sessions #52", artist: "Bizarrap & Quevedo", genre: "Latin Trap" },
      { title: "Me Porto Bonito", artist: "Bad Bunny & Chencho Corleone", genre: "Reggaeton" }
    ],
    French: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "La Vie En Rose", artist: "Édith Piaf", genre: "French Chanson" },
      { title: "Dernière Danse", artist: "Indila", genre: "French Pop" },
      { title: "Stromae - Alors On Danse", artist: "Stromae", genre: "Electronic" },
      { title: "Papaoutai", artist: "Stromae", genre: "Electronic" }
    ],
    Korean: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
      { title: "FLOWER", artist: "JISOO", genre: "K-Pop" },
      { title: "Shut Down", artist: "BLACKPINK", genre: "K-Pop" },
      { title: "Yet To Come", artist: "BTS", genre: "K-Pop" },
      { title: "ANTIFRAGILE", artist: "LE SSERAFIM", genre: "K-Pop" }
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mood, country = 'USA', language = 'English', userHistory = [] } = await req.json()
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Get trending data based on country and language
    const globalTrending = TRENDING_DATA.global.slice(0, 10)
    const countryTrending = TRENDING_DATA.countries[country] || TRENDING_DATA.countries.USA
    const regionalTrending = TRENDING_DATA.regional[language] || TRENDING_DATA.regional.English || []

    // Generate personalized recommendations using Gemini
    const prompt = `Based on the user's mood: "${mood}", country: "${country}", preferred language: "${language}", and listening history: ${JSON.stringify(userHistory.slice(0, 5))}, 
    recommend 8 songs that would match their taste. Consider their mood and cultural preferences.
    
    Return ONLY a JSON array with this exact format:
    [{"title": "Song Title", "artist": "Artist Name", "genre": "Genre", "match_reason": "Brief reason why this matches their mood/taste"}]
    
    Make the recommendations diverse across genres but relevant to their mood and preferences.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    const geminiData = await geminiResponse.json()
    let personalizedRecommendations = []

    try {
      const recommendationText = geminiData.candidates[0].content.parts[0].text
      const cleanedText = recommendationText.replace(/```json\n?|\n?```/g, '').trim()
      personalizedRecommendations = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      // Fallback recommendations based on mood
      personalizedRecommendations = globalTrending.slice(0, 8).map(song => ({
        ...song,
        match_reason: `Matches your ${mood} mood`
      }))
    }

    const musicFeed = {
      personalizedRecommendations,
      globalTrending,
      countryTrending: {
        country,
        songs: countryTrending
      },
      regionalTrending: {
        language,
        songs: regionalTrending
      }
    }

    return new Response(
      JSON.stringify(musicFeed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Music feed error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
