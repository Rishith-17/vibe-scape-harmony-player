
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Shuffle, Plus, ArrowUpDown, Edit, MoreHorizontal, ArrowLeft, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlaylistSong {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  position: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  isEmotionPlaylist?: boolean;
}

const PlaylistDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlayPause, 
    getPlaylistSongs,
    removeFromPlaylist 
  } = useMusicPlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadPlaylistData();
      loadRecommendedSongs();
    }
  }, [id]);

  const loadPlaylistData = async () => {
    if (!id) return;
    
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (playlistData) {
        setPlaylist({ ...playlistData, isEmotionPlaylist: false });

        const { data: songsData, error: songsError } = await supabase
          .from('playlist_songs')
          .select('*')
          .eq('playlist_id', id)
          .order('position');

        if (songsError) throw songsError;
        setSongs(songsData || []);
      } else {
        const { data: emotionPlaylistData, error: emotionError } = await supabase
          .from('emotion_playlists')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (emotionError) throw emotionError;
        
        if (emotionPlaylistData) {
          setPlaylist({
            id: emotionPlaylistData.id,
            name: emotionPlaylistData.name,
            description: emotionPlaylistData.description || undefined,
            user_id: emotionPlaylistData.user_id,
            created_at: emotionPlaylistData.created_at,
            updated_at: emotionPlaylistData.updated_at,
            isEmotionPlaylist: true
          });

          const { data: emotionSongsData, error: emotionSongsError } = await supabase
            .from('emotion_playlist_songs')
            .select('*')
            .eq('emotion_playlist_id', id)
            .order('position');

          if (emotionSongsError) throw emotionSongsError;
          
          const mappedSongs: PlaylistSong[] = (emotionSongsData || []).map(s => ({
            id: s.id,
            song_id: s.song_id,
            title: s.title,
            artist: s.artist,
            thumbnail: s.thumbnail || '',
            url: s.url,
            position: s.position || 0
          }));
          setSongs(mappedSongs);
        } else {
          setPlaylist(null);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        title: "Error",
        description: "Failed to load playlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedSongs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-music-feed', {
        body: { 
          mood: 'happy',
          country: 'USA',
          language: 'English',
          userHistory: []
        }
      });

      if (error) throw error;
      setRecommendedSongs(data?.globalTrending?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handlePlaySong = async (song: PlaylistSong, index: number) => {
    try {
      const tracks = songs.map(s => ({
        id: s.song_id,
        title: s.title,
        channelTitle: s.artist,
        thumbnail: s.thumbnail,
        url: s.url,
      }));

      playTrack(tracks[index], tracks, index);
      
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
    if (songs.length === 0) return;
    
    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
    const tracks = shuffledSongs.map(s => ({
      id: s.song_id,
      title: s.title,
      channelTitle: s.artist,
      thumbnail: s.thumbnail,
      url: s.url,
    }));

    playTrack(tracks[0], tracks, 0);
    toast({
      title: "Shuffle Play",
      description: "Playing playlist in shuffle mode",
    });
  };

  const handleRemoveSong = async (songId: string) => {
    if (!id || !playlist) return;
    
    try {
      if (playlist.isEmotionPlaylist) {
        const { error } = await supabase
          .from('emotion_playlist_songs')
          .delete()
          .eq('emotion_playlist_id', id)
          .eq('song_id', songId);
        
        if (error) throw error;
      } else {
        await removeFromPlaylist(id, songId);
      }
      
      setSongs(songs.filter(s => s.song_id !== songId));
      toast({
        title: "Song Removed",
        description: "Song removed from playlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove song",
        variant: "destructive",
      });
    }
  };

  const isCurrentlyPlaying = (song: PlaylistSong) => {
    return currentTrack?.id === song.song_id && isPlaying;
  };

  const generatePlaylistCover = () => {
    const first4Songs = songs.slice(0, 4);
    if (first4Songs.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-0.5 w-32 h-32 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.3)]">
        {Array.from({ length: 4 }).map((_, index) => {
          const song = first4Songs[index];
          return (
            <div key={index} className="aspect-square bg-slate-800">
              {song ? (
                <img
                  src={`https://img.youtube.com/vi/${song.song_id}/hqdefault.jpg`}
                  alt={song.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/120x90/1a1a1a/ffffff?text=♪";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <div className="text-slate-500 text-xl">♪</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <Button onClick={() => navigate('/library')} className="bg-green-600 hover:bg-green-700 rounded-full">
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white pb-32">
      {/* Header */}
      <div className="p-4 md:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/library')}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 mb-4 p-2 rounded-full"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
      </div>

      {/* Playlist Details Section */}
      <div className="px-4 md:px-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
          {/* Playlist Cover */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {generatePlaylistCover() || (
              <div className="w-32 h-32 bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <div className="text-white text-5xl">♪</div>
              </div>
            )}
          </motion.div>

          {/* Playlist Info */}
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-sm text-slate-400 mb-1">Playlist</p>
            {/* Neon Green Title with Glow */}
            <h1 
              className="text-4xl md:text-5xl font-bold mb-3 line-clamp-2 text-green-400"
              style={{
                textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.4)'
              }}
            >
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-slate-300 mb-3 text-sm">{playlist.description}</p>
            )}
            <div className="flex items-center space-x-3 text-sm text-slate-400">
              <span>Created by You</span>
              <span className="text-green-400">•</span>
              <span>{songs.length} songs</span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-wrap items-center gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            onClick={handleShufflePlay}
            disabled={songs.length === 0}
            className="bg-green-600 hover:bg-green-500 text-white rounded-full px-6 py-2.5 font-semibold disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300"
          >
            <Shuffle size={18} className="mr-2" />
            Shuffle Play
          </Button>
          
          <Button variant="outline" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-green-500/50 rounded-full bg-slate-800/30">
            <Plus size={18} className="mr-2" />
            Add
          </Button>
          
          <Button variant="outline" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-green-500/50 rounded-full bg-slate-800/30">
            <ArrowUpDown size={18} className="mr-2" />
            Sort
          </Button>
          
          <Button variant="outline" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-green-500/50 rounded-full bg-slate-800/30">
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
        </motion.div>
      </div>

      {/* Song List */}
      <div className="px-4 md:px-6 mb-8">
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-400 text-xl mb-4">No songs in this playlist</div>
            <p className="text-slate-500">Add some songs to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => {
              const isHovered = hoveredIndex === index;
              const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;
              const isPlaying = isCurrentlyPlaying(song);
              
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isOtherHovered ? 0.5 : 1,
                    scale: isHovered ? 1.02 : isOtherHovered ? 0.98 : 1,
                    x: 0
                  }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`group flex items-center space-x-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-green-500/20 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                      : isHovered
                        ? 'bg-slate-800/70 border border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.25)]'
                        : 'bg-slate-800/30 border border-transparent'
                  }`}
                  onClick={() => handlePlaySong(song, index)}
                  style={{
                    boxShadow: isHovered ? '0 0 25px rgba(34, 197, 94, 0.25), 0 4px 20px rgba(0,0,0,0.3)' : undefined
                  }}
                >
                  {/* Track Number */}
                  <div className="w-8 text-center flex-shrink-0">
                    {isPlaying ? (
                      <Volume2 size={16} className="text-green-400 animate-pulse mx-auto" />
                    ) : (
                      <span className="text-slate-500 text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-slate-700/50">
                    <img
                      src={`https://img.youtube.com/vi/${song.song_id}/hqdefault.jpg`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/48x48/1a1a1a/ffffff?text=♪";
                      }}
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium line-clamp-1 transition-colors duration-300 ${
                      isPlaying ? 'text-green-400' : isHovered ? 'text-white' : 'text-slate-200'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-slate-400 text-sm line-clamp-1">{song.artist}</p>
                  </div>

                  {/* Play Button on Hover / Playing Indicator */}
                  <div className="flex items-center space-x-2">
                    {isPlaying && (
                      <div className="flex items-center space-x-1 mr-2">
                        <Play size={16} className="text-green-400 fill-green-400" />
                        <div className="flex space-x-0.5">
                          {[1, 2, 3].map((bar) => (
                            <div
                              key={bar}
                              className="w-0.5 bg-green-400 rounded-full animate-pulse"
                              style={{
                                height: `${8 + bar * 4}px`,
                                animationDelay: `${bar * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Options Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-slate-700/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 rounded-xl">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSong(song.song_id);
                          }}
                          className="text-red-400 hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          Remove from playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Songs Section */}
      {recommendedSongs.length > 0 && (
        <motion.div 
          className="px-4 md:px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 
            className="text-xl font-bold mb-6 text-green-400"
            style={{
              textShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
            }}
          >
            Recommended Songs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedSongs.map((song, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/30 hover:border-green-500/40 hover:shadow-[0_0_25px_rgba(34,197,94,0.2)] transition-all duration-300 cursor-pointer group"
              >
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={song.albumArt || "https://via.placeholder.com/240x180/1a1a1a/ffffff?text=♪"}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/240x180/1a1a1a/ffffff?text=♪";
                    }}
                  />
                </div>
                <h4 className="text-white font-medium line-clamp-1 mb-1 text-sm">{song.title}</h4>
                <p className="text-slate-400 text-xs line-clamp-1">{song.artist}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlaylistDetailPage;
