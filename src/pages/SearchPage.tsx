
import { useState } from 'react';
import { Search, TrendingUp, Clock } from 'lucide-react';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Search
        </h1>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, artists, moods..."
            className="w-full bg-gray-800/70 border border-gray-600 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm"
          />
        </div>

        {/* Trending Searches */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-yellow-400 mr-2" size={20} />
            <h2 className="text-xl font-semibold">Trending</h2>
          </div>
          <div className="space-y-2">
            {trendingSearches.map((search, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 cursor-pointer"
              >
                <span className="text-gray-300">{search}</span>
              </div>
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
              <div
                key={index}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 cursor-pointer"
              >
                <span className="text-gray-300">{search}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
