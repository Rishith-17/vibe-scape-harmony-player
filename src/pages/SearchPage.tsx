
import { useState } from 'react';
import { Search, TrendingUp, Clock, Play, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const trendingSearches = [
    'Happy songs',
    'Relaxing music',
    'Workout playlist',
    'Study music',
    'Love songs',
  ];

  const recentSearches = [
    'Calm vibes',
    'Energetic beats',
    'Sad ballads',
  ];

  const searchYoutube = async (query = searchQuery) => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query, maxResults: 10 }
      });

      if (error) throw error;

      setSearchResults(data.videos);
      toast({
        title: "Search Complete!",
        description: `Found ${data.videos.length} videos`,
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search YouTube",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrendingSearch = (query: string) => {
    setSearchQuery(query);
    searchYoutube(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Search Music
        </h1>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, artists, moods..."
            className="w-full bg-gray-800/70 border border-gray-600 rounded-2xl py-4 pl-12 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm"
            onKeyPress={(e) => e.key === 'Enter' && searchYoutube()}
          />
          <button
            onClick={() => searchYoutube()}
            disabled={isSearching}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-full hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <Search size={16} className="text-black" />
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Play className="text-green-400 mr-2" size={20} />
              Search Results
            </h2>
            <div className="space-y-4">
              {searchResults.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 flex items-start space-x-4"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-20 h-15 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-2">{video.channelTitle}</p>
                    <p className="text-gray-500 text-xs line-clamp-2">{video.description}</p>
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-colors duration-200 flex-shrink-0"
                  >
                    <ExternalLink size={16} className="text-white" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Searching YouTube...</p>
          </div>
        )}

        {/* Trending Searches */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-yellow-400 mr-2" size={20} />
            <h2 className="text-xl font-semibold">Trending</h2>
          </div>
          <div className="space-y-2">
            {trendingSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleTrendingSearch(search)}
                className="w-full bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 text-left"
              >
                <span className="text-gray-300">{search}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div>
          <div className="flex items-center mb-4">
            <Clock className="text-teal-400 mr-2" size={20} />
            <h2 className="text-xl font-semibold">Recent</h2>
          </div>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleTrendingSearch(search)}
                className="w-full bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 text-left"
              >
                <span className="text-gray-300">{search}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
