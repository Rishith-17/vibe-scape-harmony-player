import { useState, useEffect } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import RecommendationSection from '@/components/RecommendationSection';

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  language?: string;
  release_year?: number;
  category?: string;
  youtube_search_query?: string;
}

interface RecommendationData {
  topGlobal: Song[];
  newlyReleased: Song[];
  topRegional: Song[];
}

const HomePage = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Use the Gemini music feed function with structured prompts
      const { data, error } = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'energetic',
          country: 'Global',
          language: 'Multi-language',
          userHistory: []
        }
      });

      if (error) throw error;

      // Process the response and convert to our Song format
      const processedData: RecommendationData = {
        topGlobal: data.globalTrending?.map((song: any) => ({
          id: generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: `https://img.youtube.com/vi/${generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || 'English',
          release_year: song.release_year || 2024,
          category: 'Global',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || [],
        newlyReleased: data.personalizedRecommendations?.slice(0, 6).map((song: any) => ({
          id: generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: `https://img.youtube.com/vi/${generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || 'English',
          category: 'New',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || [],
        topRegional: data.regionalTrending?.songs?.map((song: any) => ({
          id: generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: `https://img.youtube.com/vi/${generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || data.regionalTrending?.language || 'English',
          category: 'Regional',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || []
      };
      
      setRecommendations(processedData);
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      
      // Fallback data with proper structure
      const fallbackData: RecommendationData = {
        topGlobal: [
          { 
            id: "dQw4w9WgXcQ", 
            title: "Never Gonna Give You Up", 
            artist: "Rick Astley", 
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            language: "English",
            release_year: 1987,
            category: "Global",
            youtube_search_query: "Never Gonna Give You Up Rick Astley"
          },
          { 
            id: "L_jWHffIx5E", 
            title: "Smells Like Teen Spirit", 
            artist: "Nirvana", 
            thumbnail: "https://img.youtube.com/vi/L_jWHffIx5E/hqdefault.jpg",
            language: "English",
            release_year: 1991,
            category: "Global",
            youtube_search_query: "Smells Like Teen Spirit Nirvana"
          },
          { 
            id: "fJ9rUzIMcZQ", 
            title: "Bohemian Rhapsody", 
            artist: "Queen", 
            thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
            language: "English",
            release_year: 1975,
            category: "Global",
            youtube_search_query: "Bohemian Rhapsody Queen"
          },
          { 
            id: "kJQP7kiw5Fk", 
            title: "Despacito", 
            artist: "Luis Fonsi", 
            thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
            language: "Spanish",
            release_year: 2017,
            category: "Global",
            youtube_search_query: "Despacito Luis Fonsi"
          },
          { 
            id: "CevxZvSJLk8", 
            title: "Gangnam Style", 
            artist: "PSY", 
            thumbnail: "https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg",
            language: "Korean",
            release_year: 2012,
            category: "Global",
            youtube_search_query: "Gangnam Style PSY"
          },
          { 
            id: "60ItHLz5WEA", 
            title: "Faded", 
            artist: "Alan Walker", 
            thumbnail: "https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg",
            language: "English",
            release_year: 2015,
            category: "Global",
            youtube_search_query: "Faded Alan Walker"
          }
        ],
        newlyReleased: [
          { 
            id: "nfWlot6h_JM", 
            title: "Shape of You", 
            artist: "Ed Sheeran", 
            thumbnail: "https://img.youtube.com/vi/nfWlot6h_JM/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "Shape of You Ed Sheeran"
          },
          { 
            id: "RgKAFK5djSk", 
            title: "Wrecking Ball", 
            artist: "Miley Cyrus", 
            thumbnail: "https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "Wrecking Ball Miley Cyrus"
          },
          { 
            id: "hT_nvWreIhg", 
            title: "Counting Stars", 
            artist: "OneRepublic", 
            thumbnail: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "Counting Stars OneRepublic"
          },
          { 
            id: "YQHsXMglC9A", 
            title: "Hello", 
            artist: "Adele", 
            thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "Hello Adele"
          },
          { 
            id: "pt8VYOfr8To", 
            title: "Sorry", 
            artist: "Justin Bieber", 
            thumbnail: "https://img.youtube.com/vi/pt8VYOfr8To/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "Sorry Justin Bieber"
          },
          { 
            id: "JGwWNGJdvx8", 
            title: "See You Again", 
            artist: "Wiz Khalifa", 
            thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg",
            language: "English",
            category: "New",
            youtube_search_query: "See You Again Wiz Khalifa"
          }
        ],
        topRegional: [
          { 
            id: "SlPhMPnQ58k", 
            title: "Cheap Thrills", 
            artist: "Sia", 
            thumbnail: "https://img.youtube.com/vi/SlPhMPnQ58k/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "Cheap Thrills Sia"
          },
          { 
            id: "lp-EO5I60KA", 
            title: "Thinking Out Loud", 
            artist: "Ed Sheeran", 
            thumbnail: "https://img.youtube.com/vi/lp-EO5I60KA/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "Thinking Out Loud Ed Sheeran"
          },
          { 
            id: "iLBBRuVDOo4", 
            title: "Can't Feel My Face", 
            artist: "The Weeknd", 
            thumbnail: "https://img.youtube.com/vi/iLBBRuVDOo4/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "Can't Feel My Face The Weeknd"
          },
          { 
            id: "UceaB4D0jpo", 
            title: "What Do You Mean?", 
            artist: "Justin Bieber", 
            thumbnail: "https://img.youtube.com/vi/UceaB4D0jpo/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "What Do You Mean Justin Bieber"
          },
          { 
            id: "CdqoNKCCt7A", 
            title: "Love Yourself", 
            artist: "Justin Bieber", 
            thumbnail: "https://img.youtube.com/vi/CdqoNKCCt7A/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "Love Yourself Justin Bieber"
          },
          { 
            id: "uelHwf8o7_U", 
            title: "Roar", 
            artist: "Katy Perry", 
            thumbnail: "https://img.youtube.com/vi/uelHwf8o7_U/hqdefault.jpg",
            language: "English",
            category: "Regional",
            youtube_search_query: "Roar Katy Perry"
          }
        ]
      };
      
      setRecommendations(fallbackData);
      toast({
        title: "Using Offline Content",
        description: "Showing popular music recommendations",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate consistent video IDs
  const generateVideoId = (title: string, artist: string): string => {
    const combined = `${title} ${artist}`.toLowerCase();
    // This is a simple hash function for demo - in production you'd use YouTube Search API
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString().substring(0, 11);
  };

  const handlePlaySong = async (song: Song) => {
    try {
      const track = {
        id: song.id,
        title: song.title,
        channelTitle: song.artist,
        thumbnail: song.thumbnail,
        url: `https://www.youtube.com/watch?v=${song.id}`,
      };

      playTrack(track);
      toast({
        title: "Now Playing",
        description: `${song.title} by ${song.artist}`,
      });
    } catch (error) {
      console.error('Error playing song:', error);
      toast({
        title: "Error",
        description: "Failed to play song",
        variant: "destructive",
      });
    }
  };

  const handleShufflePlay = () => {
    if (recommendations) {
      const allSongs = [...recommendations.topGlobal, ...recommendations.newlyReleased, ...recommendations.topRegional];
      const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
      handlePlaySong(randomSong);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-x-hidden">
        <div className="text-center px-4">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pb-24 overflow-x-hidden w-full">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-4 sm:left-20 w-32 sm:w-72 h-32 sm:h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 sm:top-60 right-4 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 pt-6 sm:pt-8 px-4 sm:px-6 w-full">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in max-w-full">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-scale-in px-2">
            MoodTunes
          </h1>
          <p className="text-gray-300 text-base sm:text-lg px-4">Discover amazing music powered by YouTube</p>
        </div>

        {/* Large Shuffle Play Button */}
        <div className="flex justify-center mb-8 sm:mb-12 animate-slide-in-right px-4">
          <Button
            onClick={handleShufflePlay}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-full text-lg sm:text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-green-500/25 w-full max-w-xs sm:max-w-none sm:w-auto"
          >
            <Shuffle className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">Shuffle Play</span>
          </Button>
        </div>
      </div>

      {/* Recommendations Content */}
      <div className="relative z-10 px-4 sm:px-6 space-y-8 sm:space-y-12 w-full overflow-x-hidden">
        {recommendations && (
          <>
            <RecommendationSection
              title="🔥 Top Songs Played Globally"
              subtitle="The most played tracks worldwide"
              songs={recommendations.topGlobal}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />

            <RecommendationSection
              title="🎵 Newly Released Songs Trending"
              subtitle="Fresh hits taking the world by storm"
              songs={recommendations.newlyReleased}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />

            <RecommendationSection
              title="🌍 Top Songs by Region"
              subtitle="Popular in your area"
              songs={recommendations.topRegional}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          </>
        )}
      </div>

      {/* 3D Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-4 sm:left-10 w-3 sm:w-4 h-3 sm:h-3 bg-green-400 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-1/3 right-4 sm:right-20 w-4 sm:w-6 h-4 sm:h-6 bg-purple-400 rounded-full animate-ping opacity-20 delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-3 sm:w-5 h-3 sm:h-5 bg-blue-400 rounded-full animate-ping opacity-20 delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-2 sm:w-3 h-2 sm:h-3 bg-yellow-400 rounded-full animate-ping opacity-20 delay-3000"></div>
      </div>
    </div>
  );
};

export default HomePage;
