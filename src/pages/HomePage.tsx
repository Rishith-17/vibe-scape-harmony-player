
import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MusicFeedSection from '../components/MusicFeedSection';
import MusicFeedGrid from '../components/MusicFeedGrid';

interface Song {
  title: string;
  artist: string;
  genre: string;
  match_reason?: string;
}

interface MusicFeed {
  personalizedRecommendations: Song[];
  globalTrending: Song[];
  countryTrending: {
    country: string;
    songs: Song[];
  };
  regionalTrending: {
    language: string;
    songs: Song[];
  };
}

const HomePage = () => {
  const [musicFeed, setMusicFeed] = useState<MusicFeed | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const { toast } = useToast();

  // Load music feed on component mount
  useEffect(() => {
    loadMusicFeed();
  }, []);

  const loadMusicFeed = async () => {
    setIsLoadingFeed(true);
    try {
      // Default mood for music feed
      const currentMood = 'happy';
      
      // Get user's country (you could use geolocation API here)
      const userCountry = 'USA'; // Default, could be detected
      const userLanguage = 'English'; // Default, could be from user preferences
      
      // Empty user history for now
      const userHistory: Song[] = [];

      const { data, error } = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: currentMood,
          country: userCountry,
          language: userLanguage,
          userHistory
        }
      });

      if (error) throw error;
      setMusicFeed(data);
    } catch (error: any) {
      console.error('Error loading music feed:', error);
      toast({
        title: "Error",
        description: "Failed to load music recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handlePlaySong = async (song: Song, index: number) => {
    try {
      // Search for the song on YouTube
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${song.title} ${song.artist} official audio`, maxResults: 1 }
      });

      if (error) throw error;

      if (data.videos && data.videos.length > 0) {
        // This would be handled by the MusicFeedSection component
        console.log('Playing song:', song);
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      {/* Header */}
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          MoodTunes
        </h1>
      </div>

      {/* Music Feed */}
      {isLoadingFeed ? (
        <div className="px-6 mb-8">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Loading personalized music feed...</p>
          </div>
        </div>
      ) : musicFeed && (
        <div className="px-6 mb-8">
          {/* Personalized Recommendations */}
          {musicFeed.personalizedRecommendations.length > 0 && (
            <MusicFeedSection
              title="Made for You"
              subtitle="Personalized recommendations based on your mood and taste"
              songs={musicFeed.personalizedRecommendations}
              showMatchReason={true}
            />
          )}

          {/* Quick Picks Grid */}
          <MusicFeedGrid
            title="Quick Picks"
            songs={musicFeed.globalTrending.slice(0, 6)}
            onPlaySong={handlePlaySong}
          />

          {/* Global Trending */}
          <MusicFeedSection
            title="Global Top 10"
            subtitle="Most streamed songs worldwide"
            songs={musicFeed.globalTrending}
          />

          {/* Country Trending */}
          {musicFeed.countryTrending.songs.length > 0 && (
            <MusicFeedSection
              title={`Trending in ${musicFeed.countryTrending.country}`}
              subtitle="Popular in your country"
              songs={musicFeed.countryTrending.songs}
            />
          )}

          {/* Regional/Language */}
          {musicFeed.regionalTrending.songs.length > 0 && (
            <MusicFeedSection
              title={`${musicFeed.regionalTrending.language} Hits`}
              subtitle="Popular songs in your language"
              songs={musicFeed.regionalTrending.songs}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
