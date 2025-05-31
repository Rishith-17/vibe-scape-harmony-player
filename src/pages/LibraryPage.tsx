
import { useState, useEffect } from 'react';
import { Plus, Music, MoreHorizontal, Play, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigate } from 'react-router-dom';
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

const LibraryPage = () => {
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    getPlaylistSongs,
    playTrack,
    refreshPlaylists,
  } = useMusicPlayer();
  
  const navigate = useNavigate();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

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

  const handleViewPlaylist = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

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
              onClick={() => handleViewPlaylist(playlist.id)}
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
