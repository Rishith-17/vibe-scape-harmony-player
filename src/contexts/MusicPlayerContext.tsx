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

interface EmotionPlaylist {
  id: string;
  emotion: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  likedSongs: Set<string>;
  toggleLikeSong: (track: Track) => Promise<void>;
  isLiked: (trackId: string) => boolean;
  emotionPlaylists: EmotionPlaylist[];
  getEmotionPlaylist: (emotion: string) => EmotionPlaylist | null;
  addToEmotionPlaylist: (emotion: string, track: Track) => Promise<void>;
  getEmotionPlaylistSongs: (emotion: string) => Promise<Track[]>;
  playEmotionPlaylist: (emotion: string) => Promise<void>;
  refreshEmotionPlaylists: () => Promise<void>;
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
  const [emotionPlaylists, setEmotionPlaylists] = useState<EmotionPlaylist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Get YouTube player manager instance
  const playerManager = YouTubePlayerManager.getInstance();

  const skipNext = useCallback(() => {
    console.log('🎵 skipNext called - playlist length:', playlist.length, 'currentIndex:', currentIndex);
    
    if (playlist.length === 0) {
      console.log('❌ No playlist available for skipNext');
      return;
    }
    
    // Standard music player behavior: loop to first track if at end
    let nextIndex;
    if (currentIndex < playlist.length - 1) {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = 0; // Loop to first track
    }
    
    const nextTrack = playlist[nextIndex];
    
    console.log(`🎵 Skip Next: ${currentIndex} → ${nextIndex} (${nextTrack.title})`);
    
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    
    playerManager.playTrack(nextTrack);
  }, [currentIndex, playlist, playerManager]);

  const skipPrevious = useCallback(() => {
    console.log('🎵 skipPrevious called - playlist length:', playlist.length, 'currentIndex:', currentIndex);
    
    if (playlist.length === 0) {
      console.log('❌ No playlist available for skipPrevious');
      return;
    }
    
    // Smart Previous behavior like Spotify/YouTube Music
    const currentTime = playerManager.getCurrentTime();
    
    // If song has been playing for > 5 seconds, restart current track
    if (currentTime > 5 && currentTrack) {
      playerManager.seekTo(0);
      console.log(`🔄 Restart current track: ${currentTrack.title}`);
      return;
    }
    
    // Otherwise, go to previous track (loop to last if at beginning)
    let prevIndex;
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else {
      prevIndex = playlist.length - 1; // Loop to last track
    }
    
    const prevTrack = playlist[prevIndex];
    
    console.log(`🎵 Skip Previous: ${currentIndex} → ${prevIndex} (${prevTrack.title})`);
    
    setCurrentIndex(prevIndex);
    setCurrentTrack(prevTrack);
    
    playerManager.playTrack(prevTrack);
  }, [currentIndex, playlist, playerManager, currentTrack]);

  // Subscribe to player state changes - Fixed useEffect
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

    return () => {
      unsubscribe();
    };
  }, [skipNext, toast, playerManager]);

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

  // Setup background playback and media session
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // Set up action handlers with proper error handling
      navigator.mediaSession.setActionHandler('play', () => {
        try {
          if (!playerState.isPlaying) {
            togglePlayPause();
          }
        } catch (error) {
          console.error('Media session play error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        try {
          if (playerState.isPlaying) {
            togglePlayPause();
          }
        } catch (error) {
          console.error('Media session pause error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        try {
          skipNext();
        } catch (error) {
          console.error('Media session next error:', error);
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        try {
          skipPrevious();
        } catch (error) {
          console.error('Media session previous error:', error);
        }
      });

      // Handle seek if supported
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        try {
          if (details.seekTime !== undefined) {
            seekTo(details.seekTime);
          }
        } catch (error) {
          console.error('Media session seek error:', error);
        }
      });

      // Update position state for better scrubbing support
      if (playerState.duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: playerState.duration,
          playbackRate: 1.0,
          position: Math.min(playerState.currentTime, playerState.duration)
        });
      }
    }
  }, [currentTrack, playerState.isPlaying, playerState.currentTime, playerState.duration, togglePlayPause, skipNext, skipPrevious, seekTo]);

  // Handle page visibility changes for background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('App backgrounded - maintaining playback');
      } else {
        console.log('App foregrounded - syncing state');
      }
    };

    const handleBeforeUnload = () => {
      // Save playback state before page unload for persistence
      if (currentTrack) {
        localStorage.setItem('vibescape_playback_state', JSON.stringify({
          currentTrack,
          isPlaying: playerState.isPlaying,
          currentTime: playerState.currentTime,
          duration: playerState.duration,
          playlist,
          currentIndex,
          timestamp: Date.now()
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentTrack, playerState, playlist, currentIndex]);

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

  const refreshEmotionPlaylists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_playlists')
        .select('*')
        .order('emotion');

      if (error) {
        console.error('Error fetching emotion playlists:', error);
        return;
      }

      if (data) {
        setEmotionPlaylists(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching emotion playlists:', error);
    }
  }, []);

  useEffect(() => {
    refreshPlaylists();
    refreshEmotionPlaylists();
  }, [refreshPlaylists, refreshEmotionPlaylists]);

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

  // Emotion playlist functions
  const getEmotionPlaylist = useCallback((emotion: string): EmotionPlaylist | null => {
    return emotionPlaylists.find(ep => ep.emotion === emotion) || null;
  }, [emotionPlaylists]);

  const addToEmotionPlaylist = async (emotion: string, track: Track) => {
    try {
      const emotionPlaylist = getEmotionPlaylist(emotion);
      if (!emotionPlaylist) {
        toast({
          title: "Error",
          description: "Emotion playlist not found",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('emotion_playlist_songs')
        .insert([{
          emotion_playlist_id: emotionPlaylist.id,
          song_id: track.id,
          title: track.title,
          artist: track.channelTitle,
          thumbnail: track.thumbnail,
          url: track.url
        }]);

      if (error) {
        console.error('Error adding to emotion playlist:', error);
        toast({
          title: "Error",
          description: "Failed to add song to emotion playlist",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Song added to ${emotion} playlist`,
        });
      }
    } catch (error) {
      console.error('Unexpected error adding to emotion playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add song to emotion playlist",
        variant: "destructive",
      });
    }
  };

  const getEmotionPlaylistSongs = async (emotion: string): Promise<Track[]> => {
    try {
      const emotionPlaylist = getEmotionPlaylist(emotion);
      if (!emotionPlaylist) {
        return [];
      }

      const { data, error } = await supabase
        .from('emotion_playlist_songs')
        .select('*')
        .eq('emotion_playlist_id', emotionPlaylist.id)
        .order('created_at');

      if (error) {
        console.error('Error getting emotion playlist songs:', error);
        return [];
      }

      return (data || []).map(song => ({
        id: song.song_id,
        title: song.title,
        channelTitle: song.artist,
        thumbnail: song.thumbnail,
        url: song.url,
      }));
    } catch (error) {
      console.error('Unexpected error getting emotion playlist songs:', error);
      return [];
    }
  };

  const playEmotionPlaylist = async (emotion: string) => {
    try {
      const songs = await getEmotionPlaylistSongs(emotion);
      if (songs.length > 0) {
        playTrack(songs[0], songs, 0);
        toast({
          title: "Now Playing",
          description: `Playing ${emotion} playlist`,
        });
      } else {
        toast({
          title: "Empty Playlist",
          description: `No songs in ${emotion} playlist`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play emotion playlist",
        variant: "destructive",
      });
    }
  };

  const createLikedSongsPlaylist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Check if "Liked Songs" playlist already exists
      const { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Liked Songs')
        .single();

      if (existingPlaylist) {
        return existingPlaylist.id;
      }

      // Create "Liked Songs" playlist
      const { data: newPlaylist, error } = await supabase
        .from('playlists')
        .insert([{ 
          name: 'Liked Songs', 
          description: 'Your favorite songs',
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (newPlaylist) {
        setPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
        return newPlaylist.id;
      }

      return null;
    } catch (error) {
      console.error('Error creating Liked Songs playlist:', error);
      return null;
    }
  };

  const toggleLikeSong = async (track: Track) => {
    try {
      const isCurrentlyLiked = likedSongs.has(track.id);
      
      if (isCurrentlyLiked) {
        // Unlike the song - remove from all playlists named "Liked Songs"
        const likedPlaylist = playlists.find(p => p.name === 'Liked Songs');
        if (likedPlaylist) {
          await removeFromPlaylist(likedPlaylist.id, track.id);
        }
        
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(track.id);
          return newSet;
        });

        toast({
          title: "Removed from Liked Songs",
          description: `"${track.title}" removed from your liked songs`,
        });
      } else {
        // Like the song - add to "Liked Songs" playlist
        let likedPlaylistId = playlists.find(p => p.name === 'Liked Songs')?.id;
        
        if (!likedPlaylistId) {
          likedPlaylistId = await createLikedSongsPlaylist();
        }

        if (likedPlaylistId) {
          await addToPlaylist(likedPlaylistId, track);
        }

        setLikedSongs(prev => new Set([...prev, track.id]));

        toast({
          title: "Added to Liked Songs",
          description: `"${track.title}" added to your liked songs`,
        });
      }
    } catch (error) {
      console.error('Error toggling like for song:', error);
      toast({
        title: "Error",
        description: "Failed to update liked songs",
        variant: "destructive",
      });
    }
  };

  const isLiked = (trackId: string) => {
    return likedSongs.has(trackId);
  };

  // Load liked songs on component mount
  useEffect(() => {
    const loadLikedSongs = async () => {
      try {
        const likedPlaylist = playlists.find(p => p.name === 'Liked Songs');
        if (likedPlaylist) {
          const songs = await getPlaylistSongs(likedPlaylist.id);
          setLikedSongs(new Set(songs.map(song => song.id)));
        }
      } catch (error) {
        console.error('Error loading liked songs:', error);
      }
    };

    if (playlists.length > 0) {
      loadLikedSongs();
    }
  }, [playlists]);

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
    canSkipNext: playlist.length > 0, // Always can skip with looping
    canSkipPrevious: playlist.length > 0, // Always can skip with looping
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistSongs,
    refreshPlaylists,
    likedSongs,
    toggleLikeSong,
    isLiked,
    emotionPlaylists,
    getEmotionPlaylist,
    addToEmotionPlaylist,
    getEmotionPlaylistSongs,
    playEmotionPlaylist,
    refreshEmotionPlaylists,
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