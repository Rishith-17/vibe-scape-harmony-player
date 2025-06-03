import { useState, useEffect } from 'react';
import { Shuffle, Globe, Map, Languages, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import EnhancedRecommendationSection from '@/components/EnhancedRecommendationSection';

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
  country?: string;
  state?: string;
}

interface RecommendationData {
  globalTrending: Song[];
  newReleases: Song[];
  topByCountry: Song[];
  topByState: Song[];
}

const EnhancedHomePage = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  const countries = ['USA', 'India', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'South Korea', 'Brazil'];
  
  // Comprehensive list of Indian languages and major world languages
  const languages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu', 
    'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Sanskrit',
    'Nepali', 'Sindhi', 'Konkani', 'Dogri', 'Manipuri', 'Bodo', 'Santhali',
    'Kashmiri', 'Bhojpuri', 'Magahi', 'Haryanvi', 'Rajasthani', 'Chhattisgarhi',
    'Tulu', 'Kodava', 'Khasi', 'Garo', 'Mizo', 'Tripuri', 'Spanish', 'French', 
    'German', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Chinese'
  ];

  useEffect(() => {
    loadRecommendations();
    const interval = setInterval(loadRecommendations, 24 * 60 * 60 * 1000); // Update every 24 hours
    return () => clearInterval(interval);
  }, [selectedCountry, selectedLanguage]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Global trending
      const globalResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'global',
          country: 'Global',
          language: 'Multi-language',
          userHistory: []
        }
      });

      // New releases
      const newResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'new',
          country: selectedCountry,
          language: selectedLanguage,
          userHistory: []
        }
      });

      // Country-specific
      const countryResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'regional',
          country: selectedCountry,
          language: 'English',
          userHistory: []
        }
      });

      // Language-specific
      const languageResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'regional',
          country: selectedCountry,
          language: selectedLanguage,
          userHistory: []
        }
      });

      const processedData: RecommendationData = {
        globalTrending: globalResponse.data?.personalizedRecommendations?.slice(0, 10).map((song: any) => ({
          id: song.videoId || generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail || song.albumArt || `https://img.youtube.com/vi/${song.videoId || generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || 'English',
          category: 'Global',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || [],
        newReleases: newResponse.data?.personalizedRecommendations?.slice(0, 10).map((song: any) => ({
          id: song.videoId || generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail || song.albumArt || `https://img.youtube.com/vi/${song.videoId || generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || selectedLanguage,
          category: 'New Release',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || [],
        topByCountry: countryResponse.data?.personalizedRecommendations?.slice(0, 10).map((song: any) => ({
          id: song.videoId || generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail || song.albumArt || `https://img.youtube.com/vi/${song.videoId || generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: song.language || 'English',
          country: selectedCountry,
          category: 'Country Top',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || [],
        topByState: languageResponse.data?.personalizedRecommendations?.slice(0, 10).map((song: any) => ({
          id: song.videoId || generateVideoId(song.title, song.artist),
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail || song.albumArt || `https://img.youtube.com/vi/${song.videoId || generateVideoId(song.title, song.artist)}/hqdefault.jpg`,
          language: selectedLanguage,
          category: 'Language Top',
          youtube_search_query: song.youtube_search_query || `${song.title} ${song.artist}`
        })) || []
      };
      
      setRecommendations(processedData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error Loading Music",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateVideoId = (title: string, artist: string): string => {
    const combined = `${title} ${artist}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
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
      const allSongs = [
        ...recommendations.globalTrending,
        ...recommendations.newReleases,
        ...recommendations.topByCountry,
        ...recommendations.topByState
      ];
      const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
      handlePlaySong(randomSong);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold">Loading Your Music Universe...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching the latest trends worldwide</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pb-24 overflow-x-hidden">
      {/* Enhanced 3D Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 pt-8 px-6">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-scale-in">
            MoodTunes
          </h1>
          <p className="text-gray-300 text-lg mb-2">Discover the World's Trending Music Videos</p>
          {lastUpdated && (
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              <Calendar size={16} />
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600 text-white">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600 text-white">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {languages.map(language => (
                  <SelectItem key={language} value={language}>{language}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleShufflePlay}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-6 rounded-full text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Shuffle className="mr-3 h-6 w-6" />
            Shuffle Play All
          </Button>
        </div>
      </div>

      {/* Recommendations Content */}
      <div className="relative z-10 px-6 space-y-12">
        {recommendations && (
          <>
            <EnhancedRecommendationSection
              title="🌍 Global Top Music Videos"
              subtitle="The most trending music videos worldwide, updated daily"
              icon={<Globe className="w-6 h-6" />}
              songs={recommendations.globalTrending}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-green-500/20 to-emerald-500/20"
            />

            <EnhancedRecommendationSection
              title="🎵 New Releases"
              subtitle="Fresh music videos from the past 7 days"
              icon={<Calendar className="w-6 h-6" />}
              songs={recommendations.newReleases}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-purple-500/20 to-pink-500/20"
            />

            <EnhancedRecommendationSection
              title={`🏆 Top 10 in ${selectedCountry}`}
              subtitle={`Trending music videos in ${selectedCountry}, refreshed daily`}
              icon={<Map className="w-6 h-6" />}
              songs={recommendations.topByCountry}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-blue-500/20 to-cyan-500/20"
            />

            <EnhancedRecommendationSection
              title={`🎤 Top 10 in ${selectedLanguage}`}
              subtitle={`Trending ${selectedLanguage} music videos, updated daily`}
              icon={<Languages className="w-6 h-6" />}
              songs={recommendations.topByState}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-orange-500/20 to-red-500/20"
            />
          </>
        )}
      </div>

      {/* 3D Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-10 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-1/3 right-20 w-6 h-6 bg-purple-400 rounded-full animate-ping opacity-20 delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-20 delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-20 delay-3000"></div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-pink-400 rounded-full animate-ping opacity-20 delay-4000"></div>
      </div>
    </div>
  );
};

export default EnhancedHomePage;
