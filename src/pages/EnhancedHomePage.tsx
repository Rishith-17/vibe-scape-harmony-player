import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const languages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu', 
    'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Sanskrit',
    'Nepali', 'Sindhi', 'Konkani', 'Dogri', 'Manipuri', 'Bodo', 'Santhali',
    'Kashmiri', 'Bhojpuri', 'Magahi', 'Haryanvi', 'Rajasthani', 'Chhattisgarhi',
    'Tulu', 'Kodava', 'Khasi', 'Garo', 'Mizo', 'Tripuri', 'Spanish', 'French', 
    'German', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Chinese'
  ];

  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem('auratune_recommendations_cache');
      if (cached) {
        const parsedCache: CachedData = JSON.parse(cached);
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
    const processLogo = async () => {
      try {
        const transparentLogo = await processLogoBackground(aiMusicLogo);
        setProcessedLogo(transparentLogo);
      } catch (error) {
        console.error('Failed to process logo:', error);
      }
    };

    processLogo();
  }, []);

  useEffect(() => {
    localStorage.setItem('auratune_selected_country', selectedCountry);
    localStorage.setItem('auratune_selected_language', selectedLanguage);

    if (!hasInitialized.current) {
      const cachedData = getCachedData();
      if (cachedData) {
        setRecommendations(cachedData.data);
        setLastUpdated(new Date(cachedData.timestamp).toLocaleString());
        hasInitialized.current = true;
        return;
      }
    }

    loadRecommendations();
    hasInitialized.current = true;
  }, [selectedCountry, selectedLanguage]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
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
    localStorage.removeItem('auratune_recommendations_cache');
    loadRecommendations();
  };

  if (isLoading && !recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-6"
            style={{
              boxShadow: '0 0 30px hsl(180 100% 50% / 0.5), 0 0 60px hsl(180 100% 50% / 0.3)'
            }}
          />
          <p className="text-white text-xl font-semibold">Loading Your Music Universe...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching the latest trends worldwide</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white pb-32 overflow-x-hidden">
      {/* Floating Neon Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-60 right-20 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, 70, 0],
            scale: [1, 1.25, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-500/15 rounded-full blur-[120px]"
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10 pt-8 px-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col items-center justify-center mb-4 max-w-full">
            <motion.img 
              animate={{ 
                filter: [
                  'drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))',
                  'drop-shadow(0 0 40px rgba(0, 255, 255, 0.8))',
                  'drop-shadow(0 0 20px rgba(0, 255, 255, 0.6))'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              src={processedLogo} 
              alt="Aura Wave AI Logo" 
              className="w-12 h-12 mb-2"
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-wide max-w-full" 
                style={{ 
                  fontFamily: 'ui-monospace, "Cascadia Code", "Roboto Mono", monospace',
                  color: '#00ffff',
                  textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.2)'
                }}>
              Aura Wave
            </h1>
          </div>
          <p className="text-gray-300 text-lg mb-2">Discover the World's Trending Music Videos</p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Calendar size={16} />
                Last updated: {lastUpdated}
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="text-xs bg-purple-900/50 text-cyan-400 border-cyan-500/50 hover:bg-purple-800/50 hover:border-cyan-400"
                disabled={isLoading}
                style={{
                  boxShadow: '0 0 10px hsl(180 100% 50% / 0.3)'
                }}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Controls Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-12"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48 bg-slate-900/80 border-purple-500/50 text-white backdrop-blur-lg">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48 bg-slate-900/80 border-purple-500/50 text-white backdrop-blur-lg">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {languages.map(language => (
                  <SelectItem key={language} value={language}>{language}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleShufflePlay}
              className="px-12 py-6 rounded-full text-xl font-bold bg-slate-900/50 text-lime-400 backdrop-blur-lg animate-neon-glow-green"
              style={{
                border: '3px solid hsl(120 100% 50%)',
                boxShadow: '0 0 20px hsl(120 100% 50% / 0.6), 0 0 40px hsl(120 100% 50% / 0.4), inset 0 0 20px hsl(120 100% 50% / 0.1)'
              }}
            >
              <Shuffle className="mr-3 h-6 w-6" />
              Shuffle Play All
            </Button>
          </motion.div>
        </motion.div>
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
              gradient="from-cyan-500/20 to-blue-500/20"
              sectionId="global-top"
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
              sectionId="new-releases"
            />

            <EnhancedRecommendationSection
              title={`🏆 Top 10 in ${selectedCountry}`}
              subtitle={`Trending music videos in ${selectedCountry}, refreshed daily`}
              icon={<Map className="w-6 h-6" />}
              songs={recommendations.topByCountry}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-blue-500/20 to-indigo-500/20"
              sectionId="top-by-country"
            />

            <EnhancedRecommendationSection
              title={`🎤 Top ${selectedLanguage} Songs`}
              subtitle={`Most popular ${selectedLanguage} music videos right now`}
              icon={<Languages className="w-6 h-6" />}
              songs={recommendations.topByState}
              onPlaySong={handlePlaySong}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              gradient="from-pink-500/20 to-purple-500/20"
              sectionId="top-by-state"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedHomePage;
