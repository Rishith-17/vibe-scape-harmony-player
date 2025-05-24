
import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, SkipForward, SkipBack, Volume2, Plus, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import YouTubePlayer from '@/components/YouTubePlayer';
import PlaybackControls from '@/components/PlaybackControls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlists] = useState([
    { id: '1', name: 'My Favorites' },
    { id: '2', name: 'Workout Hits' },
  ]);
  const { toast } = useToast();

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
        body: { query: `${query} official audio music`, maxResults: 20 }
      });

      if (error) throw error;

      setSearchResults(data.videos);
      toast({
        title: "Search Complete!",
        description: `Found ${data.videos.length} music tracks`,
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

  const playTrack = (video: YouTubeVideo, index?: number) => {
    setCurrentTrack(video);
    setIsPlaying(true);
    
    if (index !== undefined) {
      setCurrentIndex(index);
      setPlaylist(searchResults);
    } else if (playlist.length === 0) {
      setPlaylist([video]);
      setCurrentIndex(0);
    }

    toast({
      title: "Now Playing",
      description: video.title,
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      playTrack(playlist[nextIndex]);
    }
  };

  const skipPrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      playTrack(playlist[prevIndex]);
    }
  };

  const addToPlaylist = (video: YouTubeVideo, playlistId: string) => {
    const playlistName = playlists.find(p => p.id === playlistId)?.name;
    toast({
      title: "Added to Playlist",
      description: `"${video.title}" added to ${playlistName}`,
    });
  };

  const addToFavorites = (video: YouTubeVideo) => {
    toast({
      title: "Added to Favorites",
      description: `"${video.title}" added to your favorites`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Music Player
        </h1>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for music tracks, artists, albums..."
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

        {/* Current Track Info */}
        {currentTrack && (
          <div className="mb-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-16 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm line-clamp-1">
                  {currentTrack.title}
                </h3>
                <p className="text-gray-400 text-xs">{currentTrack.channelTitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 size={16} className="text-yellow-400" />
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Play className="text-green-400 mr-2" size={20} />
              Music Tracks ({searchResults.length})
            </h2>
            <div className="space-y-3">
              {searchResults.map((video, index) => (
                <div
                  key={video.id}
                  className={`bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 flex items-center space-x-4 ${
                    currentTrack?.id === video.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-16 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack(video, index)}
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(video, index)}>
                    <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 text-xs">{video.channelTitle}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => addToFavorites(video)}
                      variant="ghost"
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Heart size={16} />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                        >
                          <Plus size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-800 border-gray-700">
                        {playlists.map((playlist) => (
                          <DropdownMenuItem
                            key={playlist.id}
                            onClick={() => addToPlaylist(video, playlist.id)}
                            className="text-white hover:bg-gray-700"
                          >
                            Add to {playlist.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      size="sm"
                      onClick={() => playTrack(video, index)}
                      className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                    >
                      {currentTrack?.id === video.id && isPlaying ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Searching for music...</p>
          </div>
        )}
      </div>

      {/* YouTube Player (Hidden) */}
      {currentTrack && (
        <YouTubePlayer
          videoId={currentTrack.id}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnd={skipNext}
        />
      )}

      {/* Fixed Bottom Playback Controls */}
      {currentTrack && (
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlayPause}
          onSkipNext={skipNext}
          onSkipPrevious={skipPrevious}
          canSkipNext={currentIndex < playlist.length - 1}
          canSkipPrevious={currentIndex > 0}
          currentTrack={currentTrack}
        />
      )}
    </div>
  );
};

export default SearchPage;
