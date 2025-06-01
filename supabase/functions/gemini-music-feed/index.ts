
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

    // Use structured prompts for Gemini
    const globalPrompt = `Give me a list of the top 10 most popular songs globally right now. For each song, include:
    - title
    - artist
    - language
    - release_year
    - YouTube video title (only the title, not the link)
    
    Respond in clean JSON format like this:
    [{"title": "Song Name", "artist": "Artist Name", "language": "English", "release_year": 2024, "youtube_video_title": "Artist - Song Name (Official Video)"}]`

    const regionalPrompt = `List the top 10 trending songs in the following languages: Hindi, English, Tamil, Telugu, Punjabi.
    
    For each song, include:
    - title
    - artist
    - language
    - country or region
    - YouTube video title (only the title, not the link)
    
    Respond in clean JSON format like this:
    [{"title": "Song Name", "artist": "Artist Name", "language": "Hindi", "country": "India", "youtube_video_title": "Artist - Song Name Official Video"}]`

    const newReleasesPrompt = `List 10 newly released songs from the past 7 days in these languages: Hindi, English, Tamil, Telugu, Punjabi.
    
    For each song, include:
    - title
    - artist
    - language
    - release_date
    - YouTube video title (just the title, no link)
    
    Respond in JSON format like this:
    [{"title": "Song Name", "artist": "Artist Name", "language": "English", "release_date": "2024-01-15", "youtube_video_title": "Artist - Song Name (Official Audio)"}]`

    // Generate personalized recommendations using structured prompts
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
        
        // Ensure albumArt field exists for all recommendations and add missing fields
        personalizedRecommendations = personalizedRecommendations.map(song => ({
          ...song,
          albumArt: song.albumArt || "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art",
          genre: song.genre || "Pop",
          match_reason: `Matches your ${mood} mood and preferences`
        }))
      } else {
        console.error('Unexpected Gemini response structure:', geminiData)
        throw new Error('Invalid response structure from Gemini')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      // Fallback recommendations based on mood using structured data
      personalizedRecommendations = globalTrending.slice(0, 8).map(song => ({
        ...song,
        match_reason: `Matches your ${mood} mood`,
        albumArt: song.albumArt || "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Album+Art",
        youtube_video_title: `${song.artist} - ${song.title} (Official Audio)`
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
