
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

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  currentIndex: number;
  playTrack: (track: Track, newPlaylist?: Track[], index?: number) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { toast } = useToast();
  
  // Get YouTube player manager instance
  const playerManager = YouTubePlayerManager.getInstance();
  const [isPlaying, setIsPlaying] = useState(false);

  const skipNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentTrack(playlist[nextIndex]);
      playerManager.playTrack({
        id: playlist[nextIndex].id,
        title: playlist[nextIndex].title,
        thumbnail: playlist[nextIndex].thumbnail,
        artist: playlist[nextIndex].channelTitle
      });
    }
  }, [currentIndex, playlist, playerManager]);

  const skipPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentTrack(playlist[prevIndex]);
      playerManager.playTrack({
        id: playlist[prevIndex].id,
        title: playlist[prevIndex].title,
        thumbnail: playlist[prevIndex].thumbnail,
        artist: playlist[prevIndex].channelTitle
      });
    }
  }, [currentIndex, playlist, playerManager]);

  // Subscribe to player state changes
  useEffect(() => {
    const unsubscribe = playerManager.subscribe(() => {
      setIsPlaying(playerManager.getIsPlaying());
    });

    // Set up track end callback
    playerManager.setOnTrackEnd(() => {
      skipNext();
    });

    return unsubscribe;
  }, [skipNext, playerManager]);

  useEffect(() => {
    const fetchPlaylists = async () => {
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
    };

    fetchPlaylists();
  }, [toast]);

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

  const playTrack = useCallback((track: Track, newPlaylist?: Track[], index = 0) => {
    console.log('Playing track:', track.title);
    
    // Stop current playback immediately to prevent overlapping
    if (currentTrack && currentTrack.id !== track.id) {
      playerManager.togglePlayPause(); // Pause current if playing
    }
    
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index);
    } else {
      // Find track in current playlist
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setCurrentIndex(trackIndex);
      }
    }
    
    setCurrentTrack(track);
    
    // Load and play the new track immediately
    playerManager.playTrack({
      id: track.id,
      title: track.title,
      thumbnail: track.thumbnail,
      artist: track.channelTitle
    });
  }, [playlist, playerManager, currentTrack]);

  const togglePlayPause = useCallback(() => {
    playerManager.togglePlayPause();
  }, [playerManager]);

  const value = {
    currentTrack,
    isPlaying,
    playlist,
    currentIndex,
    playTrack,
    togglePlayPause,
    skipNext,
    skipPrevious,
    canSkipNext: currentIndex < playlist.length - 1,
    canSkipPrevious: currentIndex > 0,
    playlists,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
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
