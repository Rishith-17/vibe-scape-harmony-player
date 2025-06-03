
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

    // Enhanced search queries based on mood and preferences with Indian language support
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
        if (isIndianLanguage(language)) {
          searchQueries = getIndianLanguageQueries(language)
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
          
          // Filter for music content with enhanced filtering for Indian languages
          const titleLower = title.toLowerCase()
          const isMusic = titleLower.includes('music') || 
                         titleLower.includes('song') || 
                         titleLower.includes('audio') || 
                         titleLower.includes('official') ||
                         titleLower.includes('video') ||
                         titleLower.includes('hit') ||
                         titleLower.includes('chart') ||
                         titleLower.includes('gaan') ||  // Bengali for song
                         titleLower.includes('paata') || // Telugu for song
                         titleLower.includes('geet') ||  // Hindi for song
                         titleLower.includes('gaana')    // Hindi for song
          
          const isNotMusic = titleLower.includes('trailer') ||
                            titleLower.includes('interview') ||
                            titleLower.includes('reaction') ||
                            titleLower.includes('review') ||
                            titleLower.includes('news') ||
                            titleLower.includes('making') ||
                            titleLower.includes('behind')
          
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

function isIndianLanguage(language: string): boolean {
  const indianLanguages = [
    'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu', 
    'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Sanskrit',
    'Nepali', 'Sindhi', 'Konkani', 'Dogri', 'Manipuri', 'Bodo', 'Santhali',
    'Kashmiri', 'Bhojpuri', 'Magahi', 'Haryanvi', 'Rajasthani', 'Chhattisgarhi',
    'Tulu', 'Kodava', 'Khasi', 'Garo', 'Mizo', 'Tripuri'
  ]
  return indianLanguages.includes(language)
}

function getIndianLanguageQueries(language: string): string[] {
  const languageQueries: { [key: string]: string[] } = {
    'Hindi': [
      'bollywood songs 2024 trending hits latest music hindi',
      'hindi music 2024 popular songs bollywood hits',
      'latest hindi songs 2024 bollywood trending music'
    ],
    'Tamil': [
      'tamil songs 2024 kollywood hits latest music',
      'tamil music 2024 popular songs trending hits',
      'latest tamil songs 2024 kollywood music'
    ],
    'Telugu': [
      'telugu songs 2024 tollywood hits latest music',
      'telugu music 2024 popular songs trending hits',
      'latest telugu songs 2024 tollywood music'
    ],
    'Kannada': [
      'kannada songs 2024 sandalwood hits latest music',
      'kannada music 2024 popular songs trending hits',
      'latest kannada songs 2024 sandalwood music'
    ],
    'Malayalam': [
      'malayalam songs 2024 mollywood hits latest music',
      'malayalam music 2024 popular songs trending hits',
      'latest malayalam songs 2024 mollywood music'
    ],
    'Bengali': [
      'bengali songs 2024 tollywood hits latest music',
      'bengali music 2024 popular songs trending hits',
      'latest bengali songs 2024 rabindra sangeet'
    ],
    'Punjabi': [
      'punjabi songs 2024 trending hits latest music',
      'punjabi music 2024 popular songs dhol beats',
      'latest punjabi songs 2024 bhangra music'
    ],
    'Gujarati': [
      'gujarati songs 2024 trending hits latest music',
      'gujarati music 2024 popular songs folk hits',
      'latest gujarati songs 2024 garba music'
    ],
    'Marathi': [
      'marathi songs 2024 trending hits latest music',
      'marathi music 2024 popular songs lavani hits',
      'latest marathi songs 2024 folk music'
    ],
    'Urdu': [
      'urdu songs 2024 trending hits latest music ghazal',
      'urdu music 2024 popular songs qawwali hits',
      'latest urdu songs 2024 sufi music'
    ]
  }

  return languageQueries[language] || [
    `${language} songs 2024 trending music popular hits`,
    `${language} music 2024 latest popular songs`,
    `trending ${language} songs 2024 music hits`
  ]
}

function generateFallbackResponse(mood: string, country: string, language: string) {
  // Enhanced fallback with Indian songs
  const fallbackSongs = [
    { title: "Flowers", artist: "Miley Cyrus", id: "G7KNmW9a75Y" },
    { title: "As It Was", artist: "Harry Styles", id: "H5v3kku4y6Q" },
    { title: "Heat Waves", artist: "Glass Animals", id: "mRD0-GxqHVo" },
    { title: "Stay", artist: "The Kid LAROI & Justin Bieber", id: "kTJczUoc26U" },
    { title: "Good 4 U", artist: "Olivia Rodrigo", id: "gNi_6U5Pm_o" },
    { title: "Levitating", artist: "Dua Lipa", id: "TUVcZfQe-Kw" },
    { title: "Blinding Lights", artist: "The Weeknd", id: "4NRXx6U8ABQ" },
    { title: "Kesariya", artist: "Arijit Singh", id: "BddP6PYo2gs" },
    { title: "Kahani Suno", artist: "Kaifi Khalil", id: "2-GgNNdl6Ig" },
    { title: "Pasoori", artist: "Ali Sethi & Shae Gill", id: "5Eqb_-j3FDA" },
    { title: "Raataan Lambiyan", artist: "Tanishk Bagchi", id: "gm_7h2O7Dfg" },
    { title: "Excuses", artist: "AP Dhillon", id: "N3Kvy2BZPDU" },
    { title: "Oo Antava", artist: "Indravathi Chauhan", id: "mtsxE8dUckQ" },
    { title: "Srivalli", artist: "Javed Ali", id: "EW_PmLb-JzE" },
    { title: "Vaathi Coming", artist: "Anirudh Ravichander", id: "6Hgm4C0Wi5E" },
    { title: "Beast Mode", artist: "Anirudh Ravichander", id: "iBhVx5lqCN8" },
    { title: "Butta Bomma", artist: "Armaan Malik", id: "8p11Xx5wGBg" },
    { title: "Tum Hi Aana", artist: "Jubin Nautiyal", id: "MpBGpW1HwjE" }
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
