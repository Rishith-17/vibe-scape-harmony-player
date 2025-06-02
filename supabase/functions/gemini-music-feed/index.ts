
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
    const { mood, country = 'USA', language = 'English', userHistory = [] } = await req.json()
    
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      console.log('YouTube API key not configured, using fallback data')
      return generateFallbackResponse(mood, country, language)
    }

    console.log(`Fetching recommendations for mood: ${mood}, country: ${country}, language: ${language}`)

    let searchQueries: string[] = []

    // Define search queries based on mood and preferences
    switch (mood) {
      case 'global':
        searchQueries = [
          'top songs 2024 trending music hits',
          'viral songs trending worldwide',
          'popular music 2024 global hits'
        ]
        break
      case 'new':
        searchQueries = [
          `new ${language} songs 2024 latest releases`,
          `fresh ${language} music this week`,
          `${language} new hits 2024`
        ]
        break
      case 'regional':
        if (language === 'Hindi') {
          searchQueries = [
            'bollywood songs 2024 trending hits',
            'hindi music latest popular songs',
            'bollywood new releases 2024'
          ]
        } else if (language === 'English') {
          searchQueries = [
            `${country} top music 2024 hits`,
            `popular ${country} songs trending`,
            `${country} music charts 2024`
          ]
        } else {
          searchQueries = [
            `${language} songs 2024 trending music`,
            `${language} popular hits latest`,
            `${language} music trending 2024`
          ]
        }
        break
      default:
        searchQueries = [
          'trending music 2024 popular songs',
          'viral music hits worldwide',
          'top songs global charts'
        ]
    }

    // Fetch recommendations with fallback handling
    const recommendations = []
    let quotaExceeded = false
    
    for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries to conserve quota
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=5&order=relevance&key=${youtubeApiKey}`
        
        const response = await fetch(searchUrl)
        const data = await response.json()

        if (!response.ok) {
          if (data.error?.reason === 'quotaExceeded') {
            quotaExceeded = true
            break
          }
          console.error('YouTube API error:', data.error?.message)
          continue
        }

        if (data.items) {
          for (const item of data.items) {
            const videoId = item.id.videoId
            const title = item.snippet.title
            const channelTitle = item.snippet.channelTitle
            const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
            
            recommendations.push({
              title: title,
              artist: channelTitle,
              youtube_search_query: `${title} ${channelTitle}`.replace(/[^\w\s]/gi, '').trim(),
              albumArt: thumbnailUrl,
              genre: "Music",
              language: language,
              release_year: 2024,
              match_reason: `Trending ${mood} music`,
              videoId: videoId,
              thumbnail: thumbnailUrl
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching data for query "${query}":`, error)
        continue
      }
    }

    // If quota exceeded or no results, use fallback data
    if (quotaExceeded || recommendations.length === 0) {
      console.log('Using fallback data due to API constraints')
      return generateFallbackResponse(mood, country, language)
    }

    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations
      .filter((song, index, self) => 
        index === self.findIndex(s => s.title === song.title && s.artist === song.artist)
      )
      .slice(0, 10)

    console.log(`Found ${uniqueRecommendations.length} unique recommendations`)

    const musicFeed = {
      personalizedRecommendations: uniqueRecommendations,
      globalTrending: uniqueRecommendations,
      countryTrending: {
        country,
        songs: uniqueRecommendations
      },
      regionalTrending: {
        language,
        songs: uniqueRecommendations
      }
    }

    return new Response(
      JSON.stringify(musicFeed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Music feed error:', error)
    
    // Always return fallback data on error
    const { mood = 'global', country = 'USA', language = 'English' } = await req.json().catch(() => ({}))
    return generateFallbackResponse(mood, country, language)
  }
})

function generateFallbackResponse(mood: string, country: string, language: string) {
  const fallbackSongs = [
    { title: "Flowers", artist: "Miley Cyrus", id: "G7KNmW9a75Y" },
    { title: "As It Was", artist: "Harry Styles", id: "H5v3kku4y6Q" },
    { title: "Heat Waves", artist: "Glass Animals", id: "mRD0-GxqHVo" },
    { title: "Stay", artist: "The Kid LAROI & Justin Bieber", id: "kTJczUoc26U" },
    { title: "Good 4 U", artist: "Olivia Rodrigo", id: "gNi_6U5Pm_o" },
    { title: "Levitating", artist: "Dua Lipa", id: "TUVcZfQe-Kw" },
    { title: "Blinding Lights", artist: "The Weeknd", id: "4NRXx6U8ABQ" },
    { title: "Watermelon Sugar", artist: "Harry Styles", id: "E07s5ZYygMg" },
    { title: "drivers license", artist: "Olivia Rodrigo", id: "ZmDBbnmKpqQ" },
    { title: "positions", artist: "Ariana Grande", id: "tcYodQoapMg" },
    { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar & Giveon", id: "tQ0yjYUFKAE" },
    { title: "Save Your Tears", artist: "The Weeknd & Ariana Grande", id: "XXYlFuWEuKI" }
  ]

  const recommendations = fallbackSongs.map(song => ({
    title: song.title,
    artist: song.artist,
    youtube_search_query: `${song.title} ${song.artist}`.replace(/[^\w\s]/gi, '').trim(),
    albumArt: `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`,
    genre: "Music",
    language: language,
    release_year: 2024,
    match_reason: `Popular ${mood} music`,
    videoId: song.id,
    thumbnail: `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`
  }))

  const musicFeed = {
    personalizedRecommendations: recommendations,
    globalTrending: recommendations,
    countryTrending: {
      country,
      songs: recommendations
    },
    regionalTrending: {
      language,
      songs: recommendations
    }
  }

  return new Response(
    JSON.stringify(musicFeed),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
