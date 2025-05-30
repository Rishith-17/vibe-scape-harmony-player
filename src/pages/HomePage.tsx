
import { useState, useEffect } from 'react';
import { Send, Mic, Camera, Zap, Music, Globe, MapPin, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MoodCard from '../components/MoodCard';
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
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'photo'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moodAnalysis, setMoodAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [musicFeed, setMusicFeed] = useState<MusicFeed | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const { toast } = useToast();

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '⚡', label: 'Energetic', icon: <div className="text-yellow-400">⚡</div> },
    { emoji: '😌', label: 'Calm' },
  ];

  // Load music feed on component mount
  useEffect(() => {
    loadMusicFeed();
  }, []);

  const loadMusicFeed = async () => {
    setIsLoadingFeed(true);
    try {
      // Get user's mood from analysis or default
      const currentMood = moodAnalysis?.mood || selectedMood || 'happy';
      
      // Get user's country (you could use geolocation API here)
      const userCountry = 'USA'; // Default, could be detected
      const userLanguage = 'English'; // Default, could be from user preferences
      
      // You could also get user's listening history from your database
      const userHistory = recommendations.slice(0, 5);

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

  // Reload feed when mood changes
  useEffect(() => {
    if (moodAnalysis || selectedMood) {
      loadMusicFeed();
    }
  }, [moodAnalysis, selectedMood]);

  const analyzeMood = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mood-analysis', {
        body: { text: inputText, provider: 'openai' }
      });

      if (error) throw error;

      setMoodAnalysis(data.analysis);
      setSelectedMood(data.analysis.mood);

      // Get music recommendations based on the analysis
      const { data: recData, error: recError } = await supabase.functions.invoke('music-recommendations', {
        body: { 
          mood: data.analysis.mood, 
          intensity: data.analysis.intensity,
          genres: data.analysis.music_suggestions 
        }
      });

      if (recError) throw recError;
      setRecommendations(recData.recommendations);

      toast({
        title: "Analysis Complete!",
        description: `Detected mood: ${data.analysis.mood} (${data.analysis.intensity}/10)`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze mood",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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

      {/* Input Mode Tabs */}
      <div className="px-6 mb-6">
        <div className="flex bg-gray-800/50 rounded-2xl p-1 backdrop-blur-sm">
          {[
            { id: 'text', label: 'Text', icon: Send },
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'photo', label: 'Photo', icon: Camera },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setInputMode(id as any)}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 ${
                inputMode === id
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 mb-8">
        {inputMode === 'text' && (
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="How are you feeling today?"
              className="w-full bg-gray-800/70 border border-gray-600 rounded-2xl py-4 px-6 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm transition-all duration-300"
              onKeyPress={(e) => e.key === 'Enter' && analyzeMood()}
            />
            <button 
              onClick={analyzeMood}
              disabled={isAnalyzing}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-full hover:scale-110 transition-transform duration-200 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Zap size={18} className="text-black animate-spin" />
              ) : (
                <Send size={18} className="text-black" />
              )}
            </button>
          </div>
        )}

        {inputMode === 'voice' && (
          <div className="text-center py-8">
            <button className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-full hover:scale-110 transition-transform duration-300 animate-pulse">
              <Mic size={32} className="text-white" />
            </button>
            <p className="text-gray-300 mt-4">Tap to record your voice</p>
          </div>
        )}

        {inputMode === 'photo' && (
          <div className="text-center py-8">
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full hover:scale-110 transition-transform duration-300">
              <Camera size={32} className="text-white" />
            </button>
            <p className="text-gray-300 mt-4">Take a photo or upload from gallery</p>
          </div>
        )}
      </div>

      {/* Mood Analysis Results */}
      {moodAnalysis && (
        <div className="px-6 mb-8">
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="text-yellow-400 mr-2" size={20} />
              Mood Analysis
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Mood</p>
                <p className="text-white font-semibold capitalize">{moodAnalysis.mood}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Intensity</p>
                <p className="text-white font-semibold">{moodAnalysis.intensity}/10</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Genres</p>
                <p className="text-white font-semibold text-xs">{moodAnalysis.music_suggestions?.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Music className="text-teal-400 mr-2" size={24} />
            AI Recommendations
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {recommendations.slice(0, 4).map((song, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300"
              >
                <h4 className="text-white font-semibold">{song.title}</h4>
                <p className="text-gray-400 text-sm">{song.artist} • {song.genre}</p>
                <p className="text-gray-500 text-xs mt-1">{song.match_reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Mood Selection */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">How are you feeling?</h2>
        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood) => (
            <MoodCard
              key={mood.label}
              emoji={mood.emoji}
              label={mood.label}
              icon={mood.icon}
              isSelected={selectedMood === mood.label.toLowerCase()}
              onClick={() => setSelectedMood(mood.label.toLowerCase())}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
