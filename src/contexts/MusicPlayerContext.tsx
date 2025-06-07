import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import YouTubePlayerManager from '@/lib/youtubePlayerManager';

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface Playlist {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
  playlist: Track[];
  currentIndex: number;
  playTrack: (track: Track, newPlaylist?: Track[], index?: number) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistSongs: (playlistId: string) => Promise<Track[]>;
  refreshPlaylists: () => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    hasError: false,
  });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { toast } = useToast();
  
  // Get YouTube player manager instance
  const playerManager = YouTubePlayerManager.getInstance();

  const skipNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextTrack = playlist[nextIndex];
      
      setCurrentIndex(nextIndex);
      setCurrentTrack(nextTrack);
      
      playerManager.playTrack(nextTrack);
    }
  }, [currentIndex, playlist, playerManager]);

  const skipPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevTrack = playlist[prevIndex];
      
      setCurrentIndex(prevIndex);
      setCurrentTrack(prevTrack);
      
      playerManager.playTrack(prevTrack);
    }
  }, [currentIndex, playlist, playerManager]);

  // Subscribe to player state changes
  useEffect(() => {
    const unsubscribe = playerManager.subscribe(() => {
      setPlayerState({
        isPlaying: playerManager.getIsPlaying(),
        currentTime: playerManager.getCurrentTime(),
        duration: playerManager.getDuration(),
        isLoading: playerManager.getIsLoading(),
        hasError: playerManager.getHasError(),
      });
    });

    // Set up track end callback for autoplay
    playerManager.setOnTrackEnd(() => {
      skipNext();
    });

    // Set up error callback for auto-skip
    playerManager.setOnError(() => {
      toast({
        title: "Playback Error",
        description: "This video is not available. Skipping to next song.",
        variant: "destructive",
      });
      setTimeout(() => skipNext(), 1000);
    });

    return unsubscribe;
  }, [skipNext, toast]);

  const playTrack = useCallback((track: Track, newPlaylist?: Track[], index = 0) => {
    console.log('PlayTrack called:', track.title);
    
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index);
    } else {
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setCurrentIndex(trackIndex);
      }
    }
    
    setCurrentTrack(track);
    playerManager.playTrack(track);
  }, [playlist, playerManager]);

  const togglePlayPause = useCallback(() => {
    playerManager.togglePlayPause();
  }, [playerManager]);

  const seekTo = useCallback((time: number) => {
    playerManager.seekTo(time);
  }, [playerManager]);

  const setVolume = useCallback((volume: number) => {
    playerManager.setVolume(volume);
  }, [playerManager]);

  const refreshPlaylists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching playlists:', error);
        toast({
          title: "Error",
          description: "Failed to load playlists",
          variant: "destructive",
        });
      }

      if (data) {
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const createPlaylist = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create playlists",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('playlists')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating playlist:', error);
        toast({
          title: "Error",
          description: "Failed to create playlist",
          variant: "destructive",
        });
      }

      if (data) {
        setPlaylists(prevPlaylists => [...prevPlaylists, data]);
        toast({
          title: "Success",
          description: "Playlist created successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting playlist:', error);
        toast({
          title: "Error",
          description: "Failed to delete playlist",
          variant: "destructive",
        });
      } else {
        setPlaylists(prevPlaylists => prevPlaylists.filter(playlist => playlist.id !== id));
        toast({
          title: "Success",
          description: "Playlist deleted successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error deleting playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  const renamePlaylist = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ name })
        .eq('id', id);

      if (error) {
        console.error('Error renaming playlist:', error);
        toast({
          title: "Error",
          description: "Failed to rename playlist",
          variant: "destructive",
        });
      } else {
        setPlaylists(prevPlaylists => 
          prevPlaylists.map(playlist => 
            playlist.id === id ? { ...playlist, name } : playlist
          )
        );
        toast({
          title: "Success",
          description: "Playlist renamed successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error renaming playlist:', error);
      toast({
        title: "Error",
        description: "Failed to rename playlist",
        variant: "destructive",
      });
    }
  };

  const getPlaylistSongs = async (playlistId: string): Promise<Track[]> => {
    try {
      const { data, error } = await supabase
        .from('playlist_songs')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position');

      if (error) {
        console.error('Error getting playlist songs:', error);
        throw error;
      }

      return (data || []).map(song => ({
        id: song.song_id,
        title: song.title,
        channelTitle: song.artist,
        thumbnail: song.thumbnail,
        url: song.url,
      }));
    } catch (error) {
      console.error('Unexpected error getting playlist songs:', error);
      throw error;
    }
  };

  const addToPlaylist = async (playlistId: string, track: Track) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .insert([{ 
          playlist_id: playlistId, 
          song_id: track.id, 
          title: track.title,
          artist: track.channelTitle,
          thumbnail: track.thumbnail,
          url: track.url
        }]);

      if (error) {
        console.error('Error adding to playlist:', error);
        toast({
          title: "Error",
          description: "Failed to add song to playlist",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Song added to playlist",
        });
      }
    } catch (error) {
      console.error('Unexpected error adding to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add song to playlist",
        variant: "destructive",
      });
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', trackId);

      if (error) {
        console.error('Error removing from playlist:', error);
        toast({
          title: "Error",
          description: "Failed to remove song from playlist",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Song removed from playlist",
        });
      }
    } catch (error) {
      console.error('Unexpected error removing from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove song from playlist",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentTrack,
    isPlaying: playerState.isPlaying,
    currentTime: playerState.currentTime,
    duration: playerState.duration,
    isLoading: playerState.isLoading,
    hasError: playerState.hasError,
    playlist,
    currentIndex,
    playTrack,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume,
    canSkipNext: currentIndex < playlist.length - 1,
    canSkipPrevious: currentIndex > 0,
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistSongs,
    refreshPlaylists,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};
