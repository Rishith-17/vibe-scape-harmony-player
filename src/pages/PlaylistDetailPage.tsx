
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Shuffle, Plus, ArrowUpDown, Edit, MoreHorizontal, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    if (id) {
      loadPlaylistData();
      loadRecommendedSongs();
    }
  }, [id]);

  const loadPlaylistData = async () => {
    if (!id) return;
    
    try {
      // Load playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Load playlist songs
      const { data: songsData, error: songsError } = await supabase
        .from('playlist_songs')
        .select('*')
        .eq('playlist_id', id)
        .order('position');

      if (songsError) throw songsError;
      setSongs(songsData || []);
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
      // Get global trending for recommendations
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
    if (!id) return;
    
    try {
      await removeFromPlaylist(id, songId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <Button onClick={() => navigate('/library')} className="bg-green-600 hover:bg-green-700">
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
      {/* Header */}
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/library')}
          className="text-gray-400 hover:text-white mb-4 p-2"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
      </div>

      {/* Playlist Details Section */}
      <div className="px-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-6">
          {/* Playlist Cover */}
          <div className="flex-shrink-0">
            {generatePlaylistCover() || (
              <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-xl">
                <div className="text-white text-6xl">♪</div>
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400 mb-2">Playlist</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 line-clamp-2">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-gray-300 mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Created by You</span>
              <span>•</span>
              <span>{songs.length} songs</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mt-8">
          <Button
            onClick={handleShufflePlay}
            disabled={songs.length === 0}
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
          
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Edit size={20} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Song List */}
      <div className="px-6 mb-8">
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-xl mb-4">No songs in this playlist</div>
            <p className="text-gray-500">Add some songs to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => (
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
    </div>
  );
};

export default PlaylistDetailPage;
