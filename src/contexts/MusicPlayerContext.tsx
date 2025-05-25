
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';

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
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  added_at: string;
  position: number;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  currentIndex: number;
  playlists: Playlist[];
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaylist: (playlist: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  playTrack: (track: Track, playlist?: Track[], index?: number) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  createPlaylist: (name: string, description?: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  getPlaylistSongs: (playlistId: string) => Promise<Track[]>;
  refreshPlaylists: () => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const playTrack = (track: Track, newPlaylist?: Track[], index?: number) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index || 0);
    } else if (playlist.length === 0) {
      setPlaylist([track]);
      setCurrentIndex(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentTrack(playlist[nextIndex]);
    }
  };

  const skipPrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentTrack(playlist[prevIndex]);
    }
  };

  const canSkipNext = playlist.length > 0 && currentIndex < playlist.length - 1;
  const canSkipPrevious = playlist.length > 0 && currentIndex > 0;

  const createPlaylist = async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('playlists')
      .insert({
        name,
        description,
        user_id: user.id,
      });

    if (error) throw error;
    await refreshPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await refreshPlaylists();
  };

  const renamePlaylist = async (id: string, name: string) => {
    const { error } = await supabase
      .from('playlists')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await refreshPlaylists();
  };

  const addToPlaylist = async (playlistId: string, track: Track) => {
    const { data: existingSongs } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingSongs && existingSongs.length > 0 
      ? existingSongs[0].position + 1 
      : 0;

    const { error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: track.id,
        title: track.title,
        artist: track.channelTitle,
        thumbnail: track.thumbnail,
        url: track.url,
        position: nextPosition,
      });

    if (error) throw error;
  };

  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) throw error;
  };

  const getPlaylistSongs = async (playlistId: string): Promise<Track[]> => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position');

    if (error) throw error;

    return data?.map(song => ({
      id: song.song_id,
      title: song.title,
      channelTitle: song.artist,
      thumbnail: song.thumbnail,
      url: song.url,
    })) || [];
  };

  const refreshPlaylists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlists:', error);
      return;
    }

    setPlaylists(data || []);
  };

  useEffect(() => {
    refreshPlaylists();
  }, []);

  useBackgroundAudio({
    currentTrack,
    isPlaying,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onNext: skipNext,
    onPrevious: skipPrevious,
  });

  const value: MusicPlayerContextType = {
    currentTrack,
    isPlaying,
    playlist,
    currentIndex,
    playlists,
    setCurrentTrack,
    setIsPlaying,
    setPlaylist,
    setCurrentIndex,
    playTrack,
    togglePlayPause,
    skipNext,
    skipPrevious,
    canSkipNext,
    canSkipPrevious,
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
