
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

    // Enhanced search queries based on mood and preferences
    let searchQueries: string[] = []

    switch (mood) {
      case 'global':
        searchQueries = [
          'top songs 2024 trending music hits global charts billboard',
          'viral music worldwide popular songs 2024',
          'best songs 2024 global trending hits music'
        ]
        break
      case 'new':
        searchQueries = [
          `new ${language} songs 2024 latest releases this week`,
          `fresh music 2024 ${language} new hits releases`,
          `latest ${language} songs released 2024 new music`
        ]
        break
      case 'regional':
        if (language === 'Hindi') {
          searchQueries = [
            'bollywood songs 2024 trending hits latest music',
            'hindi music 2024 popular songs bollywood hits',
            'indian music 2024 bollywood trending songs'
          ]
        } else if (language === 'English' && country) {
          searchQueries = [
            `${country} music 2024 top songs charts hits`,
            `popular ${country} songs 2024 trending music`,
            `${country} charts 2024 best music hits songs`
          ]
        } else {
          searchQueries = [
            `${language} songs 2024 trending music popular hits`,
            `${language} music 2024 latest popular songs`,
            `trending ${language} songs 2024 music hits`
          ]
        }
        break
      default:
        searchQueries = [
          'trending music 2024 popular songs global hits',
          'viral songs 2024 music hits trending worldwide',
          'top music 2024 popular songs global charts'
        ]
    }

    const recommendations = []
    
    // Use only one search query to conserve quota but make it more targeted
    const query = searchQueries[0]
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `type=video&` +
        `videoCategoryId=10&` +
        `q=${encodeURIComponent(query)}&` +
        `maxResults=25&` +
        `order=relevance&` +
        `videoEmbeddable=true&` +
        `videoSyndicated=true&` +
        `key=${youtubeApiKey}`
      
      const response = await fetch(searchUrl)
      const data = await response.json()

      if (!response.ok) {
        if (data.error?.reason === 'quotaExceeded') {
          console.log('Quota exceeded, using fallback data')
          return generateFallbackResponse(mood, country, language)
        }
        console.error('YouTube API error:', data.error?.message)
        return generateFallbackResponse(mood, country, language)
      }

      if (data.items) {
        for (const item of data.items) {
          const title = item.snippet.title
          const channelTitle = item.snippet.channelTitle
          const videoId = item.id.videoId
          
          // Filter for music content
          const titleLower = title.toLowerCase()
          const isMusic = titleLower.includes('music') || 
                         titleLower.includes('song') || 
                         titleLower.includes('audio') || 
                         titleLower.includes('official') ||
                         titleLower.includes('video') ||
                         titleLower.includes('hit') ||
                         titleLower.includes('chart')
          
          const isNotMusic = titleLower.includes('trailer') ||
                            titleLower.includes('interview') ||
                            titleLower.includes('reaction') ||
                            titleLower.includes('review')
          
          if (isMusic && !isNotMusic) {
            const thumbnailUrl = item.snippet.thumbnails.high?.url || 
                               item.snippet.thumbnails.medium?.url || 
                               item.snippet.thumbnails.default?.url ||
                               `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            
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
            
            // Limit results to prevent overwhelming
            if (recommendations.length >= 15) break
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching data for query "${query}":`, error)
      return generateFallbackResponse(mood, country, language)
    }

    // If no good results, use fallback
    if (recommendations.length === 0) {
      console.log('No quality music results found, using fallback data')
      return generateFallbackResponse(mood, country, language)
    }

    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations
      .filter((song, index, self) => 
        index === self.findIndex(s => s.title === song.title && s.artist === song.artist)
      )
      .slice(0, 12)

    console.log(`Found ${uniqueRecommendations.length} unique music recommendations`)

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
    { title: "Save Your Tears", artist: "The Weeknd & Ariana Grande", id: "XXYlFuWEuKI" },
    { title: "Deja Vu", artist: "Olivia Rodrigo", id: "qZXT0zxQEfE" },
    { title: "Montero (Call Me By Your Name)", artist: "Lil Nas X", id: "6swmTBVI83k" },
    { title: "Kiss Me More", artist: "Doja Cat ft. SZA", id: "0EVVKs6DQLo" },
    { title: "Industry Baby", artist: "Lil Nas X & Jack Harlow", id: "UTHLKHL_whs" },
    { title: "Bad Habits", artist: "Ed Sheeran", id: "orJSJGHjBLI" },
    { title: "Shivers", artist: "Ed Sheeran", id: "Il0S8BoucSA" }
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
