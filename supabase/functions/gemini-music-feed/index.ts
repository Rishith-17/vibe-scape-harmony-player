
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TRENDING_DATA = {
  global: [
    { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", language: "English", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
    { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14" },
    { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5" },
    { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b7e976d2b35c767f9012cb06" },
    { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273f65500c8470b8f8a7bdfbc3a" },
    { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", genre: "Dance Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" },
    { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273c02da72d9803e54d3ca2a4fc" },
    { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop", language: "English", release_year: 2020, albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" },
    { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b85259a971157ac2cc9d2496" },
    { title: "Golden Hour", artist: "JVKE", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" }
  ],
  countries: {
    USA: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", language: "English", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5" },
      { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage", genre: "Hip Hop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273c02da72d9803e54d3ca2a4fc" },
      { title: "Bad Habit", artist: "Steve Lacy", genre: "Alternative R&B", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b85259a971157ac2cc9d2496" },
      { title: "Golden Hour", artist: "JVKE", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273c4f5e3abddec0e1d15150e1f" }
    ],
    India: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2019, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood", language: "Hindi", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Calm Down", artist: "Rema & Selena Gomez", genre: "Afrobeats", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b7e976d2b35c767f9012cb06" }
    ]
  },
  regional: {
    Hindi: [
      { title: "Kesariya", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Pal Pal Dil Ke Paas", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2019, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Apna Bana Le", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Chaleya", artist: "Arijit Singh & Shilpa Rao", genre: "Bollywood", language: "Hindi", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" },
      { title: "Tum Hi Ho", artist: "Arijit Singh", genre: "Bollywood", language: "Hindi", release_year: 2013, albumArt: "https://i.scdn.co/image/ab67616d0000b273e4e0d2e21a27f7b7b2b2b2b2" }
    ],
    English: [
      { title: "Flowers", artist: "Miley Cyrus", genre: "Pop", language: "English", release_year: 2023, albumArt: "https://i.scdn.co/image/ab67616d0000b273f4f76ad6c32da8e30fdf7c6c" },
      { title: "As It Was", artist: "Harry Styles", genre: "Pop Rock", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14" },
      { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5" },
      { title: "Unholy", artist: "Sam Smith ft. Kim Petras", genre: "Pop", language: "English", release_year: 2022, albumArt: "https://i.scdn.co/image/ab67616d0000b273f65500c8470b8f8a7bdfbc3a" },
      { title: "Heat Waves", artist: "Glass Animals", genre: "Indie Pop", language: "English", release_year: 2020, albumArt: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad14d9f" }
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

    // Use simplified prompts for Gemini
    const globalPrompt = `Give me a list of the top 10 most popular songs globally right now. For each song, include:
- title
- artist
- A combined search query string (title + artist) for YouTube

Respond in clean JSON format like this:
[
  {
    "title": "Flowers",
    "artist": "Miley Cyrus",
    "youtube_search_query": "Flowers Miley Cyrus"
  }
]`

    const regionalPrompt = `List the top 10 trending songs in the following languages: Hindi, English, Tamil, Telugu, Punjabi.

For each song, include:
- title
- artist
- A combined search query string (title + artist) for YouTube

Respond in clean JSON format like this:
[
  {
    "title": "Kesariya",
    "artist": "Arijit Singh", 
    "youtube_search_query": "Kesariya Arijit Singh"
  }
]`

    const newReleasesPrompt = `List 10 newly released songs from the past 7 days in these languages: Hindi, English, Tamil, Telugu, Punjabi.

For each song, include:
- title
- artist
- A combined search query string (title + artist) for YouTube

Respond in JSON format like this:
[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "youtube_search_query": "Song Name Artist Name"
  }
]`

    // Generate personalized recommendations using simplified prompts
    const selectedPrompt = mood === 'global' ? globalPrompt : 
                          mood === 'regional' ? regionalPrompt : 
                          mood === 'new' ? newReleasesPrompt : globalPrompt

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: selectedPrompt
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
        
        // Convert the simplified format to our existing format for compatibility
        personalizedRecommendations = personalizedRecommendations.map(song => ({
          title: song.title,
          artist: song.artist,
          youtube_search_query: song.youtube_search_query,
          albumArt: "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art",
          genre: "Pop",
          language: "English",
          release_year: 2024,
          match_reason: `Matches your ${mood} mood and preferences`
        }))
      } else {
        console.error('Unexpected Gemini response structure:', geminiData)
        throw new Error('Invalid response structure from Gemini')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      // Fallback recommendations using structured data
      personalizedRecommendations = globalTrending.slice(0, 8).map(song => ({
        title: song.title,
        artist: song.artist,
        youtube_search_query: `${song.title} ${song.artist}`,
        albumArt: song.albumArt || "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art",
        genre: song.genre,
        language: song.language,
        release_year: song.release_year,
        match_reason: `Matches your ${mood} mood`
      }))
    }

    // Convert existing trending data to include youtube_search_query
    const enhancedGlobalTrending = globalTrending.map(song => ({
      ...song,
      youtube_search_query: `${song.title} ${song.artist}`
    }))

    const enhancedCountryTrending = countryTrending.map(song => ({
      ...song,
      youtube_search_query: `${song.title} ${song.artist}`
    }))

    const enhancedRegionalTrending = regionalTrending.map(song => ({
      ...song,
      youtube_search_query: `${song.title} ${song.artist}`
    }))

    const musicFeed = {
      personalizedRecommendations,
      globalTrending: enhancedGlobalTrending,
      countryTrending: {
        country,
        songs: enhancedCountryTrending
      },
      regionalTrending: {
        language,
        songs: enhancedRegionalTrending
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
