import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Play, Pause, Plus, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
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
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlayPause, 
    playlists, 
    emotionPlaylists,
    addToPlaylist,
    addToEmotionPlaylist,
    toggleLikeSong,
    isLiked
  } = useMusicPlayer();
  const { toast } = useToast();

  // Auto-search when query parameter is present (from voice command)
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      searchYoutube(query);
    }
  }, [searchParams]);

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
      
      // Show fallback popular songs on error
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

  const handlePlayTrack = (video: YouTubeVideo, index: number) => {
    const track = {
      id: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnail,
      url: video.url,
    };

    playTrack(track, searchResults.map(v => ({
      id: v.id,
      title: v.title,
      channelTitle: v.channelTitle,
      thumbnail: v.thumbnail,
      url: v.url,
    })), index);

    toast({
      title: "Now Playing",
      description: video.title,
    });
  };

  const handleAddToPlaylist = async (video: YouTubeVideo, playlistId: string) => {
    try {
      const track = {
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnail: video.thumbnail,
        url: video.url,
      };

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

  const handleAddToEmotionPlaylist = async (video: YouTubeVideo, emotion: string) => {
    try {
      const track = {
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnail: video.thumbnail,
        url: video.url,
      };

      await addToEmotionPlaylist(emotion, track);
      
      toast({
        title: "Added to Emotion Playlist",
        description: `"${video.title}" added to your ${emotion} playlist`,
      });
    } catch (error) {
      console.error('Error adding to emotion playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add song to emotion playlist",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081032] via-[#0B295A] to-[#0e1c3d] text-white pb-32">
      <div className="pt-12 px-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">
          Search Music
        </h1>

        {/* 3D Glowing Search Bar */}
        <motion.div 
          className="relative mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative rounded-3xl border-2 border-yellow-400 bg-gradient-to-br from-[#0B295A]/80 to-[#081032]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] transition-all duration-300">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for music tracks, artists, albums..."
              className="w-full bg-transparent py-5 pl-6 pr-20 text-white text-lg placeholder-blue-300/60 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && searchYoutube()}
            />
            <motion.button
              onClick={() => searchYoutube()}
              disabled={isSearching}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] disabled:opacity-50"
              whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(250,204,21,0.8)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={20} className="text-[#081032]" />
            </motion.button>
          </div>
        </motion.div>

        {/* Error Message */}
        {searchError && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm">Search temporarily limited. Showing popular tracks instead.</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Searching for music...</p>
          </div>
        )}

        {/* 3D Animated Song Cards */}
        {searchResults.length > 0 && !isSearching && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-white/90">
              <Play className="text-green-400 mr-3 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" size={24} />
              Music Tracks ({searchResults.length})
            </h2>
            <div className="space-y-4">
              {searchResults.map((video, index) => {
                const isHovered = hoveredCard === video.id;
                const isOtherHovered = hoveredCard && hoveredCard !== video.id;
                
                return (
                  <motion.div
                    key={video.id}
                    onHoverStart={() => setHoveredCard(video.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    animate={{
                      scale: isHovered ? 1.05 : isOtherHovered ? 0.95 : 1,
                      opacity: isOtherHovered ? 0.6 : 1,
                      y: isHovered ? -8 : 0,
                    }}
                    transition={{ 
                      duration: 0.3, 
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{
                      perspective: 1000,
                      transformStyle: "preserve-3d",
                    }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        rotateX: isHovered ? 2 : 0,
                        rotateY: isHovered ? -2 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`relative rounded-2xl border-2 backdrop-blur-xl p-5 flex items-center space-x-5 cursor-pointer overflow-hidden ${
                        currentTrack?.id === video.id 
                          ? 'border-yellow-400/80 bg-gradient-to-br from-[#0B295A]/90 to-[#081032]/95 shadow-[0_0_40px_rgba(250,204,21,0.4)]' 
                          : isHovered
                          ? 'border-blue-400/80 bg-gradient-to-br from-[#0B295A]/95 to-[#081032]/98 shadow-[0_8px_50px_rgba(96,165,250,0.5)]'
                          : 'border-blue-500/30 bg-gradient-to-br from-[#0B295A]/70 to-[#081032]/80 shadow-[0_4px_20px_rgba(59,130,246,0.2)]'
                      }`}
                    >
                      {/* Neon glow effect overlay */}
                      {isHovered && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      
                      {/* Album Art */}
                      <motion.img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-lg relative z-10"
                        onClick={() => handlePlayTrack(video, index)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/320x180/0B295A/ffffff?text=♪";
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      />
                      
                      {/* Song Info */}
                      <div 
                        className="flex-1 min-w-0 relative z-10" 
                        onClick={() => handlePlayTrack(video, index)}
                      >
                        <motion.h3 
                          className="text-white font-bold text-lg line-clamp-1 mb-1"
                          animate={{
                            textShadow: isHovered 
                              ? "0 0 20px rgba(255,255,255,0.5)" 
                              : "0 0 0px rgba(255,255,255,0)"
                          }}
                        >
                          {video.title}
                        </motion.h3>
                        <p className="text-blue-300/80 text-sm font-medium">{video.channelTitle}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 relative z-10">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong({
                              id: video.id,
                              title: video.title,
                              channelTitle: video.channelTitle,
                              thumbnail: video.thumbnail,
                              url: video.url,
                            });
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isLiked(video.id) 
                              ? 'text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-400 hover:bg-white/10 hover:text-red-400'
                          }`}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart size={18} fill={isLiked(video.id) ? 'currentColor' : 'none'} />
                        </motion.button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.button
                              className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus size={18} />
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#0B295A]/95 backdrop-blur-xl border-blue-500/30">
                            {playlists.length > 0 && (
                              <>
                                {playlists.map((playlist) => (
                                  <DropdownMenuItem
                                    key={playlist.id}
                                    onClick={() => handleAddToPlaylist(video, playlist.id)}
                                    className="text-white hover:bg-blue-500/20"
                                  >
                                    Add to {playlist.name}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            
                            {emotionPlaylists.length > 0 && (
                              <>
                                {playlists.length > 0 && (
                                  <div className="border-t border-blue-500/30 my-1" />
                                )}
                                <div className="px-2 py-1 text-xs text-blue-300/60 font-medium">Emotion Playlists</div>
                                {emotionPlaylists.map((emotionPlaylist) => (
                                  <DropdownMenuItem
                                    key={emotionPlaylist.id}
                                    onClick={() => handleAddToEmotionPlaylist(video, emotionPlaylist.emotion)}
                                    className="text-white hover:bg-blue-500/20"
                                  >
                                    Add to {emotionPlaylist.name}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            
                            {playlists.length === 0 && emotionPlaylists.length === 0 && (
                              <DropdownMenuItem disabled className="text-gray-400">
                                No playlists available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Green Glowing Play Button */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentTrack?.id === video.id) {
                              togglePlayPause();
                            } else {
                              handlePlayTrack(video, index);
                            }
                          }}
                          className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_35px_rgba(34,197,94,0.8)]"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          animate={{
                            boxShadow: currentTrack?.id === video.id && isPlaying
                              ? ["0 0 20px rgba(34,197,94,0.6)", "0 0 35px rgba(34,197,94,0.9)", "0 0 20px rgba(34,197,94,0.6)"]
                              : "0 0 20px rgba(34,197,94,0.6)"
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: currentTrack?.id === video.id && isPlaying ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        >
                          {currentTrack?.id === video.id && isPlaying ? (
                            <Pause size={18} className="text-[#081032]" />
                          ) : (
                            <Play size={18} className="text-[#081032]" />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;