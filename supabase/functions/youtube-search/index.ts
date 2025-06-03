
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
    const { query, maxResults = 20 } = await req.json()
    
    if (!query) {
      throw new Error('Search query is required')
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      console.log('YouTube API key not configured, using fallback data')
      return generateFallbackResponse(query)
    }

    console.log(`Searching for: ${query}`)

    // Enhanced search with better parameters for music
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `type=video&` +
      `videoCategoryId=10&` +
      `q=${encodeURIComponent(query + ' official music video song audio')}&` +
      `maxResults=${Math.min(maxResults, 50)}&` +
      `order=relevance&` +
      `videoEmbeddable=true&` +
      `videoSyndicated=true&` +
      `key=${youtubeApiKey}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()

    if (!response.ok) {
      console.error('YouTube API error:', data.error?.message)
      
      if (data.error?.reason === 'quotaExceeded') {
        console.log('Quota exceeded, using fallback data')
        return generateFallbackResponse(query)
      }
      
      throw new Error(data.error?.message || 'YouTube API error')
    }

    if (!data.items || data.items.length === 0) {
      console.log('No results found, using fallback data')
      return generateFallbackResponse(query)
    }

    // Filter and enhance results for better music content
    const videos = data.items
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase()
        const description = item.snippet.description.toLowerCase()
        
        // Filter out non-music content
        const excludeKeywords = ['trailer', 'interview', 'reaction', 'review', 'commentary', 'news', 'documentary']
        const includeKeywords = ['music', 'song', 'audio', 'official', 'video', 'lyrics', 'acoustic', 'live']
        
        const hasExclude = excludeKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))
        const hasInclude = includeKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))
        
        return !hasExclude && (hasInclude || title.includes('music') || title.includes('song'))
      })
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || 
                  item.snippet.thumbnails.medium?.url || 
                  item.snippet.thumbnails.default?.url ||
                  `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }))

    console.log(`Found ${videos.length} filtered music videos`)

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('YouTube search error:', error)
    
    const { query } = await req.json().catch(() => ({ query: 'music' }))
    return generateFallbackResponse(query || 'music')
  }
})

function generateFallbackResponse(query: string) {
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
    { title: "Kiss Me More", artist: "Doja Cat ft. SZA", id: "0EVVKs6DQLo" }
  ]

  // Filter based on query if possible
  let filteredSongs = fallbackSongs
  if (query && query !== 'music') {
    const queryLower = query.toLowerCase()
    filteredSongs = fallbackSongs.filter(song => 
      song.title.toLowerCase().includes(queryLower) || 
      song.artist.toLowerCase().includes(queryLower)
    )
    
    if (filteredSongs.length === 0) {
      filteredSongs = fallbackSongs.slice(0, 10)
    }
  }

  const videos = filteredSongs.map(song => ({
    id: song.id,
    title: song.title,
    description: `${song.title} by ${song.artist}`,
    thumbnail: `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`,
    channelTitle: song.artist,
    publishedAt: new Date().toISOString(),
    url: `https://www.youtube.com/watch?v=${song.id}`
  }))

  return new Response(
    JSON.stringify({ 
      videos,
      fallback: true,
      message: 'Showing popular songs due to API constraints'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
