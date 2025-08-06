
import { useState, useEffect, useRef } from 'react';
import aiMusicLogo from '@/assets/ai-music-logo.png';
import { Shuffle, Globe, Map, Languages, Calendar } from 'lucide-react';
import { processLogoBackground } from '@/lib/backgroundRemover';
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

interface CachedData {
  data: RecommendationData;
  country: string;
  language: string;
  timestamp: number;
}

const EnhancedHomePage = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string>(aiMusicLogo);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('auratune_selected_country') || 'USA';
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('auratune_selected_language') || 'English';
  });
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const hasInitialized = useRef(false);

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

  // Cache management
  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem('auratune_recommendations_cache');
      if (cached) {
        const parsedCache: CachedData = JSON.parse(cached);
        // Check if cache is less than 1 hour old
        const cacheAge = Date.now() - parsedCache.timestamp;
        const oneHour = 60 * 60 * 1000;
        
        if (cacheAge < oneHour && 
            parsedCache.country === selectedCountry && 
            parsedCache.language === selectedLanguage) {
          return parsedCache;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (data: RecommendationData) => {
    try {
      const cacheData: CachedData = {
        data,
        country: selectedCountry,
        language: selectedLanguage,
        timestamp: Date.now()
      };
      localStorage.setItem('auratune_recommendations_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  useEffect(() => {
    // Process logo background on component mount
    const processLogo = async () => {
      try {
        const transparentLogo = await processLogoBackground(aiMusicLogo);
        setProcessedLogo(transparentLogo);
      } catch (error) {
        console.error('Failed to process logo:', error);
        // Keep original logo if processing fails
      }
    };

    processLogo();
  }, []);

  useEffect(() => {
    // Save selected filters to localStorage
    localStorage.setItem('auratune_selected_country', selectedCountry);
    localStorage.setItem('auratune_selected_language', selectedLanguage);

    // Load recommendations on mount or when filters change
    if (!hasInitialized.current) {
      // First load - check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setRecommendations(cachedData.data);
        setLastUpdated(new Date(cachedData.timestamp).toLocaleString());
        hasInitialized.current = true;
        return;
      }
    }

    // Load fresh data if no cache or filters changed
    loadRecommendations();
    hasInitialized.current = true;
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

      const newResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'new',
          country: selectedCountry,
          language: selectedLanguage,
          userHistory: []
        }
      });

      const countryResponse = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'regional',
          country: selectedCountry,
          language: 'English',
          userHistory: []
        }
      });

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
      setCachedData(processedData);
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

  const handleRefresh = () => {
    // Clear cache and force reload
    localStorage.removeItem('auratune_recommendations_cache');
    loadRecommendations();
  };

  if (isLoading && !recommendations) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pb-32 overflow-x-hidden">
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
          <div className="flex flex-col items-center justify-center mb-4 max-w-full">
            <img 
              src={processedLogo} 
              alt="Aura Wave AI Logo" 
              className="w-12 h-12 mb-2 filter brightness-125 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse"
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-scale-in tracking-wide max-w-full" 
                style={{ 
                  fontFamily: 'ui-monospace, "Cascadia Code", "Roboto Mono", monospace',
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))',
                  textShadow: '0 0 30px rgba(59, 130, 246, 0.3), 0 0 60px rgba(147, 51, 234, 0.2)'
                }}>
              Aura Wave
            </h1>
          </div>
          <p className="text-gray-300 text-lg mb-2">Discover the World's Trending Music Videos</p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-4">
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Calendar size={16} />
                Last updated: {lastUpdated}
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="relative text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg hover:shadow-xl hover:scale-110 transform transition-all duration-300 animate-pulse hover:animate-none group overflow-hidden"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, hsla(var(--primary), 1), hsla(var(--accent), 1))',
                  boxShadow: '0 0 20px hsla(var(--primary), 0.5), inset 0 1px 0 hsla(var(--accent), 0.8)',
                  filter: 'drop-shadow(0 4px 8px hsla(var(--primary), 0.3))',
                  transform: 'perspective(500px) rotateX(5deg) rotateY(-5deg)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${isLoading ? 'animate-spin border-2 border-current border-t-transparent' : 'bg-current animate-pulse'}`}></div>
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </div>
              </Button>
            </div>
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
