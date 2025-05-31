
import { useState, useEffect } from 'react';
import { Plus, Music, MoreHorizontal, Play, Trash2, Edit, ArrowLeft, Shuffle, ArrowUpDown } from 'lucide-react';
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
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    getPlaylistSongs,
    playTrack,
    refreshPlaylists,
    currentTrack,
    isPlaying,
    removeFromPlaylist,
  } = useMusicPlayer();
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistSongs();
      loadRecommendedSongs();
    }
  }, [selectedPlaylist]);

  const loadPlaylistSongs = async () => {
    if (!selectedPlaylist) return;
    
    setIsLoadingSongs(true);
    try {
      const { data: songsData, error } = await supabase
        .from('playlist_songs')
        .select('*')
        .eq('playlist_id', selectedPlaylist.id)
        .order('position');

      if (error) throw error;
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
    if (!selectedPlaylist) return;
    
    try {
      await removeFromPlaylist(selectedPlaylist.id, songId);
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

  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
        {/* Header */}
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedPlaylist(null)}
            className="text-gray-400 hover:text-white mb-4 p-2"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Library
          </Button>
        </div>

        {/* Playlist Details Section */}
        <div className="px-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-6">
            {/* Playlist Cover */}
            <div className="flex-shrink-0">
              {generatePlaylistCover(selectedPlaylist) || (
                <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-xl">
                  <div className="text-white text-6xl">♪</div>
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 mb-2">Playlist</p>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 line-clamp-2">{selectedPlaylist.name}</h1>
              {selectedPlaylist.description && (
                <p className="text-gray-300 mb-4">{selectedPlaylist.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Created by You</span>
                <span>•</span>
                <span>{playlistSongs.length} songs</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
            
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => startEditPlaylist(selectedPlaylist)}
            >
              <Edit size={20} className="mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Song List */}
        <div className="px-6 mb-8">
          {isLoadingSongs ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading songs...</p>
            </div>
          ) : playlistSongs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-xl mb-4">No songs in this playlist</div>
              <p className="text-gray-500">Add some songs from the search page to get started</p>
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
                  {/* Track Number / Play Indicator */}
                  <div className="w-6 text-center">
                    {isCurrentlyPlaying(song) ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    ) : (
                      <span className="text-gray-400 text-sm group-hover:hidden">{index + 1}</span>
                    )}
                    <Play size={16} className="text-gray-400 hidden group-hover:block" />
                  </div>

                  {/* Thumbnail */}
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

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium line-clamp-1 ${
                      isCurrentlyPlaying(song) ? 'text-green-400' : 'text-white'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-1">{song.artist}</p>
                  </div>

                  {/* Options Menu */}
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

        {/* Recommended Songs Section */}
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

        {/* Edit Dialog */}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
      <div className="pt-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
            Your Playlists
          </h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus size={20} className="mr-2" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlaylist}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Playlists */}
        <div className="space-y-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-between cursor-pointer"
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Music size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm">Playlist</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPlaylist(playlist.id);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play size={16} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditPlaylist(playlist);
                      }}
                      className="text-white hover:bg-gray-700"
                    >
                      <Edit size={16} className="mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id, playlist.name);
                      }}
                      className="text-red-400 hover:bg-gray-700"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {playlists.length === 0 && (
          <div className="text-center py-16">
            <Music size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No playlists yet</h3>
            <p className="text-gray-500 mb-6">Create your first playlist to get started</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus size={20} className="mr-2" />
                  Create Your First Playlist
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}

        {/* Edit Dialog */}
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
    </div>
  );
};

export default LibraryPage;
