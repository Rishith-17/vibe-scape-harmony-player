
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
      throw new Error('YouTube API key not configured')
    }

    console.log(`Fetching recommendations for mood: ${mood}, country: ${country}, language: ${language}`)

    let searchQueries: string[] = []

    // Define search queries based on mood and preferences
    switch (mood) {
      case 'global':
        searchQueries = [
          'top songs 2024 trending',
          'popular music worldwide',
          'viral songs trending now',
          'chart toppers global',
          'trending music videos',
          'popular hits 2024',
          'top 40 songs',
          'music trending worldwide',
          'viral music videos',
          'global hit songs'
        ]
        break
      case 'new':
        searchQueries = [
          `new ${language} songs 2024`,
          `latest ${language} music releases`,
          `new ${language} hits this week`,
          `fresh ${language} songs`,
          `${language} new music 2024`,
          `latest ${language} tracks`,
          `new ${language} albums 2024`,
          `recent ${language} music`,
          `${language} songs released today`,
          `brand new ${language} music`
        ]
        break
      case 'regional':
        if (language === 'Hindi') {
          searchQueries = [
            'bollywood songs trending',
            'hindi songs 2024',
            'bollywood hits',
            'indian music trending',
            'hindi pop songs',
            'bollywood new songs',
            'hindi romantic songs',
            'punjabi songs trending',
            'hindi dance songs',
            'bollywood latest'
          ]
        } else if (language === 'English') {
          searchQueries = [
            `${country} top songs`,
            `${country} music trending`,
            `popular songs ${country}`,
            `${country} chart hits`,
            `trending music ${country}`,
            `${country} radio hits`,
            `${country} pop songs`,
            `${country} music 2024`,
            `top hits ${country}`,
            `${country} billboard songs`
          ]
        } else {
          searchQueries = [
            `${language} songs trending`,
            `${language} music 2024`,
            `${language} popular songs`,
            `${language} hits`,
            `${language} music videos`,
            `${language} latest songs`,
            `${language} top tracks`,
            `${language} music trending`,
            `${language} songs 2024`,
            `${language} hit songs`
          ]
        }
        break
      default:
        searchQueries = [
          'trending music 2024',
          'popular songs worldwide',
          'viral music videos',
          'top songs global',
          'music hits 2024'
        ]
    }

    // Fetch recommendations from YouTube API
    const recommendations = []
    
    for (const query of searchQueries.slice(0, 5)) { // Limit to 5 queries to avoid rate limits
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=10&order=relevance&key=${youtubeApiKey}`
        
        const response = await fetch(searchUrl)
        const data = await response.json()

        if (!response.ok) {
          console.error('YouTube API error:', data.error?.message)
          continue
        }

        if (data.items) {
          for (const item of data.items) {
            // Extract video details
            const videoId = item.id.videoId
            const title = item.snippet.title
            const channelTitle = item.snippet.channelTitle
            const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
            
            // Create YouTube search query
            const youtube_search_query = `${title} ${channelTitle}`.replace(/[^\w\s]/gi, '').trim()

            recommendations.push({
              title: title,
              artist: channelTitle,
              youtube_search_query: youtube_search_query,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
