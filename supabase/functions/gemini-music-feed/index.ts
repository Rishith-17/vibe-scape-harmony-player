
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TRENDING_DATA = {
  global: [
    { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
    { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock", albumArt: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14" },
    { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5" },
    { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats", albumArt: "https://i.scdn.co/image/ab67616d0000b273b7e976d2b35c767f9012cb06" },
    { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f65500c8470b8f8a7bdfbc3a" },
    { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", genre: "Dance Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" },
    { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c02da72d9803e54d3ca2a4fc" },
    { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
    { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B", albumArt: "https://i.scdn.co/image/ab67616d0000b273b85259a971157ac2cc9d2496" },
    { title: "Golden Hour", artist: "JVKE", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" }
  ],
  countries: {
    USA: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5" },
      { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c02da72d9803e54d3ca2a4fc" },
      { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B", albumArt: "https://i.scdn.co/image/ab67616d0000b273b85259a971157ac2cc9d2496" },
      { title: "Golden Hour", artist: "JVKE", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" }
    ],
    UK: [
      { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock", albumArt: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", genre: "Dance Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" },
      { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f65500c8470b8f8a7bdfbc3a" },
      { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
    ],
    India: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats", albumArt: "https://i.scdn.co/image/ab67616d0000b273b7e976d2b35c767f9012cb06" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" }
    ],
    Brazil: [
      { title: "Ela Partiu", artist: "Tim Maia", genre: "Brazilian Soul", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats", albumArt: "https://i.scdn.co/image/ab67616d0000b273b7e976d2b35c767f9012cb06" },
      { title: "Samba do Approach", artist: "Zeca Pagodinho", genre: "Samba", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Envolver", artist: "Anitta", genre: "Brazilian Funk", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
    ],
    Japan: [
      { title: "Idol", artist: "YOASOBI", genre: "J-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "Kaikai Kitan", artist: "Eve", genre: "J-Rock", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Racing into the Night", artist: "YOASOBI", genre: "J-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Pretender", artist: "Official HIGE DANdism", genre: "J-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
    ]
  },
  regional: {
    Hindi: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Tum Hi Ho", artist: "Arijit Singh", genre: "Bollywood", albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" }
    ],
    Spanish: [
      { title: "Bzrp Music Sessions #53", artist: "Bizarrap & Shakira", genre: "Latin Urban", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "Envolver", artist: "Anitta", genre: "Brazilian Funk", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Quevedo: Bzrp Music Sessions #52", artist: "Bizarrap & Quevedo", genre: "Latin Trap", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Me Porto Bonito", artist: "Bad Bunny & Chencho Corleone", genre: "Reggaeton", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
    ],
    French: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "La Vie En Rose", artist: "Édith Piaf", genre: "French Chanson", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Dernière Danse", artist: "Indila", genre: "French Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Stromae - Alors On Danse", artist: "Stromae", genre: "Electronic", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Papaoutai", artist: "Stromae", genre: "Electronic", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
    ],
    Korean: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "FLOWER", artist: "JISOO", genre: "K-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Shut Down", artist: "BLACKPINK", genre: "K-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "Yet To Come", artist: "BTS", genre: "K-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
      { title: "ANTIFRAGILE", artist: "LE SSERAFIM", genre: "K-Pop", albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
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
    [{"title": "Song Title", "artist": "Artist Name", "genre": "Genre", "match_reason": "Brief reason why this matches their mood/taste", "albumArt": "https://example.com/album-cover.jpg"}]
    
    For albumArt, use a placeholder URL like "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art" if you don't have the actual album cover URL.
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
      if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts[0]) {
        const recommendationText = geminiData.candidates[0].content.parts[0].text
        const cleanedText = recommendationText.replace(/```json\n?|\n?```/g, '').trim()
        personalizedRecommendations = JSON.parse(cleanedText)
        
        // Ensure albumArt field exists for all recommendations
        personalizedRecommendations = personalizedRecommendations.map(song => ({
          ...song,
          albumArt: song.albumArt || "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art"
        }))
      } else {
        console.error('Unexpected Gemini response structure:', geminiData)
        throw new Error('Invalid response structure from Gemini')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      // Fallback recommendations based on mood
      personalizedRecommendations = globalTrending.slice(0, 8).map(song => ({
        ...song,
        match_reason: `Matches your ${mood} mood`,
        albumArt: song.albumArt || "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art"
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
