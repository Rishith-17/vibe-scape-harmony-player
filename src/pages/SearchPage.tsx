import { useState } from 'react'; import { Search, Play, Pause, Plus, Heart, Smile } from 'lucide-react'; import { supabase } from '@/integrations/supabase/client'; import { useToast } from '@/hooks/use-toast'; import { Button } from '@/components/ui/button'; import { useMusicPlayer } from '@/contexts/MusicPlayerContext'; import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';

interface YouTubeVideo { id: string; title: string; description: string; thumbnail: string; channelTitle: string; publishedAt: string; url: string; }

const EMOTIONS = ['Happy', 'Sad', 'Excited', 'Calm'];

const SearchPage = () => { const [searchQuery, setSearchQuery] = useState(''); const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]); const [isSearching, setIsSearching] = useState(false); const [searchError, setSearchError] = useState<string | null>(null); const { currentTrack, isPlaying, playTrack, togglePlayPause, playlists, addToPlaylist, toggleLikeSong, isLiked } = useMusicPlayer(); const { toast } = useToast();

const searchYoutube = async (query = searchQuery) => { if (!query.trim()) { toast({ title: "Error", description: "Please enter a search term", variant: "destructive", }); return; }

setIsSearching(true);
setSearchError(null);

try {
  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: { query: `${query} music`, maxResults: 20 }
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(error.message || 'Failed to search YouTube');
  }

  if (data?.videos) {
    setSearchResults(data.videos);

    if (data.fallback) {
      toast({
        title: "Limited Results",
        description: "Showing popular songs due to API constraints",
      });
    } else {
      toast({
        title: "Search Complete!",
        description: `Found ${data.videos.length} music tracks`,
      });
    }
  } else {
    throw new Error('No results found');
  }
} catch (error: any) {
  console.error('Search error:', error);
  setSearchError(error.message);

  const fallbackResults = [
    {
      id: "G7KNmW9a75Y",
      title: "Flowers",
      description: "Flowers by Miley Cyrus",
      thumbnail: "https://img.youtube.com/vi/G7KNmW9a75Y/hqdefault.jpg",
      channelTitle: "Miley Cyrus",
      publishedAt: new Date().toISOString(),
      url: "https://www.youtube.com/watch?v=G7KNmW9a75Y"
    },
    {
      id: "H5v3kku4y6Q",
      title: "As It Was",
      description: "As It Was by Harry Styles",
      thumbnail: "https://img.youtube.com/vi/H5v3kku4y6Q/hqdefault.jpg",
      channelTitle: "Harry Styles",
      publishedAt: new Date().toISOString(),
      url: "https://www.youtube.com/watch?v=H5v3kku4y6Q"
    }
  ];

  setSearchResults(fallbackResults);

  toast({
    title: "Search Issues",
    description: "Showing popular songs instead",
  });
} finally {
  setIsSearching(false);
}

};

const handlePlayTrack = (video: YouTubeVideo, index: number) => { const track = { id: video.id, title: video.title, channelTitle: video.channelTitle, thumbnail: video.thumbnail, url: video.url, };

playTrack(
  track,
  searchResults.map(v => ({
    id: v.id,
    title: v.title,
    channelTitle: v.channelTitle,
    thumbnail: v.thumbnail,
    url: v.url,
  })),
  index
);

toast({
  title: "Now Playing",
  description: video.title,
});

};

const handleAddToEmotionPlaylist = async (video: YouTubeVideo, emotion: string) => { const { data: playlists, error } = await supabase .from('emotion_playlists') .select('id') .eq('emotion', emotion) .single();

if (!playlists || error) {
  toast({
    title: "Playlist Error",
    description: `Couldn't find ${emotion} playlist`,
    variant: "destructive",
  });
  return;
}

await handleAddToPlaylist(video, playlists.id);

};

const handleAddToPlaylist = async (video: YouTubeVideo, playlistId: string) => { try { const track = { id: video.id, title: video.title, channelTitle: video.channelTitle, thumbnail: video.thumbnail, url: video.url, };

await addToPlaylist(playlistId, track);

  const playlistName = playlists.find(p => p.id === playlistId)?.name;
  toast({
    title: "Added to Playlist",
    description: `"${video.title}" added to ${playlistName}`,
  });
} catch (error) {
  toast({
    title: "Error",
    description: "Failed to add song to playlist",
    variant: "destructive",
  });
}

};

return ( <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32"> <div className="pt-8 px-6"> <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent"> Search Music </h1>

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

    {searchError && (
      <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <p className="text-red-200 text-sm">Search temporarily limited. Showing popular tracks instead.</p>
      </div>
    )}

    {isSearching && (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Searching for music...</p>
      </div>
    )}

    {searchResults.length > 0 && !isSearching && (
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
                onClick={() => handlePlayTrack(video, index)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/320x180/1a1a1a/ffffff?text=♪";
                }}
              />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayTrack(video, index)}>
                <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-xs">{video.channelTitle}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleLikeSong({
                    id: video.id,
                    title: video.title,
                    channelTitle: video.channelTitle,
                    thumbnail: video.thumbnail,
                    url: video.url,
                  })}
                  className={`${isLiked(video.id) ? 'text-red-400' : 'text-gray-400'} hover:text-red-400`}
                >
                  <Heart size={16} fill={isLiked(video.id) ? 'currentColor' : 'none'} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Smile size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    {EMOTIONS.map((emotion) => (
                      <DropdownMenuItem
                        key={emotion}
                        onClick={() => handleAddToEmotionPlaylist(video, emotion)}
                        className="text-white hover:bg-gray-700"
                      >
                        Save to {emotion}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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
                        onClick={() => handleAddToPlaylist(video, playlist.id)}
                        className="text-white hover:bg-gray-700"
                      >
                        Add to {playlist.name}
                      </DropdownMenuItem>
                    ))}
                    {playlists.length === 0 && (
                      <DropdownMenuItem disabled className="text-gray-400">
                        No playlists available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  onClick={() => {
                    if (currentTrack?.id === video.id) {
                      togglePlayPause();
                    } else {
                      handlePlayTrack(video, index);
                    }
                  }}
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
  </div>
</div>

); };

export default SearchPage;

