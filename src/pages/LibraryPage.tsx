import { useState, useEffect } from 'react';
import { Plus, Music, MoreHorizontal, Play, Trash2, Edit, ArrowLeft, Shuffle, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PlaylistSong {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  position: number;
}

const LibraryPage = () => {
  const {
    playlists,
    emotionPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    getPlaylistSongs,
    getEmotionPlaylistSongs,
    playTrack,
    refreshPlaylists,
    refreshEmotionPlaylists,
    currentTrack,
    isPlaying,
    removeFromPlaylist,
    playEmotionPlaylist,
  } = useMusicPlayer();
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedEmotionPlaylist, setSelectedEmotionPlaylist] = useState<any>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshPlaylists();
    refreshEmotionPlaylists();
  }, [refreshPlaylists, refreshEmotionPlaylists]);

  useEffect(() => {
    if (selectedPlaylist || selectedEmotionPlaylist) {
      loadPlaylistSongs();
      loadRecommendedSongs();
    }
  }, [selectedPlaylist, selectedEmotionPlaylist]);

  const loadPlaylistSongs = async () => {
    if (!selectedPlaylist && !selectedEmotionPlaylist) return;
    
    setIsLoadingSongs(true);
    try {
      let songsData;
      
      if (selectedPlaylist) {
        const { data, error } = await supabase
          .from('playlist_songs')
          .select('*')
          .eq('playlist_id', selectedPlaylist.id)
          .order('position');
        
        if (error) throw error;
        songsData = data || [];
      } else if (selectedEmotionPlaylist) {
        const { data, error } = await supabase
          .from('emotion_playlist_songs')
          .select('*')
          .eq('emotion_playlist_id', selectedEmotionPlaylist.id)
          .order('created_at');
        
        if (error) throw error;
        songsData = data || [];
      }

      setPlaylistSongs(songsData || []);
    } catch (error) {
      console.error('Error loading playlist songs:', error);
      toast({
        title: "Error",
        description: "Failed to load playlist songs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSongs(false);
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

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Playlist "${newPlaylistName.trim()}" created`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await deletePlaylist(playlistId);
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
      toast({
        title: "Deleted",
        description: `Playlist "${playlistName}" deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  const startEditPlaylist = (playlist: any) => {
    setEditingPlaylist(playlist.id);
    setEditName(playlist.name);
    setIsEditDialogOpen(true);
  };

  const saveEditPlaylist = async () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    if (!editingPlaylist) return;

    try {
      await renamePlaylist(editingPlaylist, editName.trim());
      if (selectedPlaylist?.id === editingPlaylist) {
        setSelectedPlaylist({ ...selectedPlaylist, name: editName.trim() });
      }
      setIsEditDialogOpen(false);
      setEditingPlaylist(null);
      setEditName('');
      
      toast({
        title: "Success",
        description: "Playlist renamed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const songs = await getPlaylistSongs(playlistId);
      if (songs.length > 0) {
        playTrack(songs[0], songs, 0);
        toast({
          title: "Now Playing",
          description: `Playing playlist`,
        });
      } else {
        toast({
          title: "Empty Playlist",
          description: "This playlist has no songs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlayEmotionPlaylist = async (emotion: string) => {
    try {
      await playEmotionPlaylist(emotion);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play emotion playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlaySong = async (song: PlaylistSong, index: number) => {
    try {
      const tracks = playlistSongs.map(s => ({
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
    if (playlistSongs.length === 0) return;
    
    const shuffledSongs = [...playlistSongs].sort(() => Math.random() - 0.5);
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
    if (!selectedPlaylist && !selectedEmotionPlaylist) return;
    
    try {
      if (selectedPlaylist) {
        await removeFromPlaylist(selectedPlaylist.id, songId);
      } else if (selectedEmotionPlaylist) {
        const { error } = await supabase
          .from('emotion_playlist_songs')
          .delete()
          .eq('emotion_playlist_id', selectedEmotionPlaylist.id)
          .eq('song_id', songId);
        
        if (error) throw error;
      }
      
      setPlaylistSongs(playlistSongs.filter(s => s.song_id !== songId));
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

  const generatePlaylistCover = (playlist: any) => {
    const first4Songs = playlistSongs.slice(0, 4);
    if (first4Songs.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-0.5 w-48 h-48 rounded-lg overflow-hidden shadow-xl">
        {Array.from({ length: 4 }).map((_, index) => {
          const song = first4Songs[index];
          return (
            <div key={index} className="aspect-square bg-gray-800">
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
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <div className="text-gray-500 text-2xl">♪</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      happy: 'from-yellow-400 to-orange-500',
      sad: 'from-blue-400 to-blue-600',
      angry: 'from-red-400 to-red-600',
      fear: 'from-purple-400 to-purple-600',
      surprise: 'from-pink-400 to-pink-600',
      disgust: 'from-green-400 to-green-600',
      neutral: 'from-gray-400 to-gray-600'
    };
    return colorMap[emotion] || 'from-gray-400 to-gray-600';
  };

  if (selectedPlaylist || selectedEmotionPlaylist) {
    const currentPlaylistData = selectedPlaylist || selectedEmotionPlaylist;
    const isEmotionPlaylist = !!selectedEmotionPlaylist;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedPlaylist(null);
              setSelectedEmotionPlaylist(null);
            }}
            className="text-gray-400 hover:text-white mb-4 p-2"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Library
          </Button>
        </div>

        <div className="px-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              {generatePlaylistCover(currentPlaylistData) || (
                <div className={`w-48 h-48 bg-gradient-to-br ${
                  isEmotionPlaylist ? getEmotionColor(currentPlaylistData.emotion) : 'from-purple-500 to-pink-500'
                } rounded-lg flex items-center justify-center shadow-xl`}>
                  <div className="text-white text-6xl">
                    {isEmotionPlaylist ? getEmotionEmoji(currentPlaylistData.emotion) : '♪'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 mb-2">
                {isEmotionPlaylist ? 'Emotion Playlist' : 'Playlist'}
              </p>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 line-clamp-2">{currentPlaylistData.name}</h1>
              {currentPlaylistData.description && (
                <p className="text-gray-300 mb-4">{currentPlaylistData.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Created by You</span>
                <span>•</span>
                <span>{playlistSongs.length} songs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-8">
            <Button
              onClick={handleShufflePlay}
              disabled={playlistSongs.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-3 text-lg font-semibold disabled:opacity-50"
            >
              <Shuffle size={20} className="mr-2" />
              Shuffle Play
            </Button>
            
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Plus size={20} className="mr-2" />
              Add
            </Button>
            
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <ArrowUpDown size={20} className="mr-2" />
              Sort
            </Button>
            
            {!isEmotionPlaylist && (
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => startEditPlaylist(selectedPlaylist)}
              >
                <Edit size={20} className="mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 mb-8">
          {isLoadingSongs ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading songs...</p>
            </div>
          ) : playlistSongs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-xl mb-4">No songs in this playlist</div>
              <p className="text-gray-500">
                {isEmotionPlaylist 
                  ? `Add songs to your ${currentPlaylistData.emotion} playlist from search or when emotions are detected`
                  : 'Add some songs from the search page to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {playlistSongs.map((song, index) => (
                <div
                  key={song.id}
                  className={`group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    isCurrentlyPlaying(song) ? 'bg-gray-700/70' : ''
                  }`}
                  onClick={() => handlePlaySong(song, index)}
                >
                  <div className="w-6 text-center">
                    {isCurrentlyPlaying(song) ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    ) : (
                      <span className="text-gray-400 text-sm group-hover:hidden">{index + 1}</span>
                    )}
                    <Play size={16} className="text-gray-400 hidden group-hover:block" />
                  </div>

                  <div className="w-12 h-9 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={`https://img.youtube.com/vi/${song.song_id}/hqdefault.jpg`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/48x36/1a1a1a/ffffff?text=♪";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium line-clamp-1 ${
                      isCurrentlyPlaying(song) ? 'text-green-400' : 'text-white'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSong(song.song_id);
                        }}
                        className="text-red-400 hover:bg-gray-700"
                      >
                        Remove from playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>

        {recommendedSongs.length > 0 && (
          <div className="px-6">
            <h2 className="text-2xl font-bold mb-6">Recommended Songs</h2>
            <div className="grid grid-cols-2 gap-4">
              {recommendedSongs.map((song, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-full aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={song.albumArt || "https://via.placeholder.com/240x180/1a1a1a/ffffff?text=♪"}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/240x180/1a1a1a/ffffff?text=♪";
                      }}
                    />
                  </div>
                  <h4 className="text-white font-medium line-clamp-1 mb-1">{song.title}</h4>
                  <p className="text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Rename Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter new playlist name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && saveEditPlaylist()}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveEditPlaylist}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Combine all playlists for circular arrangement
  const allPlaylists = [
    ...emotionPlaylists.map(p => ({ ...p, type: 'emotion' as const })),
    ...playlists.map(p => ({ ...p, type: 'regular' as const }))
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white pb-32 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 200, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 200, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="pt-8 px-6 relative z-10">
        <div className="flex items-center justify-between mb-16">
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 200%' }}
          >
            Your Library
          </motion.h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white shadow-lg shadow-green-500/50">
                  <Plus size={20} className="mr-2" />
                  Create Playlist
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-cyan-400">Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-cyan-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlaylist}
                    className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {allPlaylists.length === 0 ? (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-gray-400 text-xl mb-4">Your library is empty</div>
              <p className="text-gray-500 mb-6">Create your first playlist to get started</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white"
              >
                <Plus size={20} className="mr-2" />
                Create Playlist
              </Button>
            </motion.div>
          </div>
        ) : (
          /* Circular 3D Playlist Arrangement */
          <div className="relative w-full min-h-[600px] flex items-center justify-center perspective-[2000px]">
            <motion.div
              className="relative w-full max-w-4xl aspect-square"
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {allPlaylists.map((playlist, index) => {
                const angle = (index / allPlaylists.length) * 2 * Math.PI;
                const radius = 280;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const isEmotion = playlist.type === 'emotion';

                return (
                  <motion.div
                    key={`${playlist.type}-${playlist.id}`}
                    className="absolute top-1/2 left-1/2 cursor-pointer"
                    style={{
                      transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${-angle * (180 / Math.PI)}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{
                      scale: 1.3,
                      z: 100,
                      rotateY: 15,
                      transition: { duration: 0.3 },
                    }}
                    onClick={() => {
                      if (isEmotion) {
                        setSelectedEmotionPlaylist(playlist);
                      } else {
                        setSelectedPlaylist(playlist);
                      }
                    }}
                  >
                    <motion.div
                      className="relative w-44 h-56 rounded-3xl overflow-hidden"
                      style={{
                        background: isEmotion 
                          ? `linear-gradient(135deg, ${
                              playlist.emotion === 'happy' ? '#fbbf24, #f59e0b' : 
                              playlist.emotion === 'sad' ? '#60a5fa, #3b82f6' :
                              playlist.emotion === 'angry' ? '#f87171, #dc2626' :
                              playlist.emotion === 'fear' ? '#a78bfa, #8b5cf6' :
                              playlist.emotion === 'surprise' ? '#f472b6, #ec4899' :
                              playlist.emotion === 'disgust' ? '#34d399, #10b981' :
                              '#9ca3af, #6b7280'
                            })`
                          : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        boxShadow: '0 0 40px rgba(0, 255, 200, 0.6), inset 0 0 20px rgba(0, 255, 200, 0.2)',
                        border: '2px solid rgba(0, 255, 200, 0.5)',
                      }}
                      animate={{
                        boxShadow: [
                          '0 0 40px rgba(0, 255, 200, 0.6), inset 0 0 20px rgba(0, 255, 200, 0.2)',
                          '0 0 60px rgba(0, 255, 200, 0.8), inset 0 0 30px rgba(0, 255, 200, 0.3)',
                          '0 0 40px rgba(0, 255, 200, 0.6), inset 0 0 20px rgba(0, 255, 200, 0.2)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {/* Glowing Border Animation */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          border: '3px solid transparent',
                          background: 'linear-gradient(45deg, #00ffcc, #00ff88, #00ffcc) border-box',
                          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'destination-out',
                          maskComposite: 'exclude',
                        }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      {/* Card Content */}
                      <div className="relative z-10 h-full p-6 flex flex-col items-center justify-between">
                        <div className="flex-1 flex items-center justify-center">
                          {isEmotion ? (
                            <div className="text-7xl mb-2">{getEmotionEmoji(playlist.emotion)}</div>
                          ) : (
                            <Music size={60} className="text-white/90" />
                          )}
                        </div>
                        
                        <div className="text-center space-y-2 w-full">
                          <h3 className="text-white font-bold text-lg line-clamp-1 capitalize">
                            {isEmotion ? playlist.emotion : playlist.name}
                          </h3>
                          {isEmotion && playlist.description && (
                            <p className="text-white/70 text-xs line-clamp-2">{playlist.description}</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 mt-3">
                          <motion.button
                            className="p-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                            whileHover={{ scale: 1.2, boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEmotion) {
                                handlePlayEmotionPlaylist(playlist.emotion);
                              } else {
                                handlePlayPlaylist(playlist.id);
                              }
                            }}
                          >
                            <Play size={16} className="text-white fill-white" />
                          </motion.button>
                          
                          {!isEmotion && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.button
                                  className="p-2 bg-gray-700/80 rounded-full"
                                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(55, 65, 81, 1)' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal size={16} className="text-white" />
                                </motion.button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-900 border-cyan-500/30">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditPlaylist(playlist);
                                  }}
                                  className="text-white hover:bg-gray-800"
                                >
                                  <Edit size={16} className="mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlaylist(playlist.id, playlist.name);
                                  }}
                                  className="text-red-400 hover:bg-gray-800"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* Data Stream Particles */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: '10%',
                          }}
                          animate={{
                            y: [0, 200],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'translateZ(-50px)' }}>
                {allPlaylists.map((_, index) => {
                  const nextIndex = (index + 1) % allPlaylists.length;
                  const angle1 = (index / allPlaylists.length) * 2 * Math.PI;
                  const angle2 = (nextIndex / allPlaylists.length) * 2 * Math.PI;
                  const radius = 280;
                  const centerX = 50;
                  const centerY = 50;
                  const x1 = centerX + (Math.cos(angle1) * radius) / 8;
                  const y1 = centerY + (Math.sin(angle1) * radius) / 8;
                  const x2 = centerX + (Math.cos(angle2) * radius) / 8;
                  const y2 = centerY + (Math.sin(angle2) * radius) / 8;

                  return (
                    <motion.line
                      key={`line-${index}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="rgba(0, 255, 200, 0.3)"
                      strokeWidth="2"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.1,
                      }}
                    />
                  );
                })}
              </svg>
            </motion.div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400">Rename Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter new playlist name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-cyan-400"
              onKeyPress={(e) => e.key === 'Enter' && saveEditPlaylist()}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEditPlaylist}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes grid-flow {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        .perspective-\\[2000px\\] {
          perspective: 2000px;
        }
      `}</style>
    </div>
  );
};

export default LibraryPage;
