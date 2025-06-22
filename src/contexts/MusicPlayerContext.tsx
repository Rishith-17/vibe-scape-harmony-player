// ✅ Full MusicPlayerContext with all original features + emotion playlist save support import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'; import { supabase } from '@/integrations/supabase/client'; import { useToast } from '@/hooks/use-toast'; import YouTubePlayerManager from '@/lib/youtubePlayerManager';

interface Track { id: string; title: string; channelTitle: string; thumbnail: string; url: string; }

interface EmotionPlaylist { id: string; emotion: string; name: string; description: string; user_id: string; created_at: string; updated_at: string; }

interface MusicPlayerContextType { currentTrack: Track | null; isPlaying: boolean; playTrack: (track: Track, newPlaylist?: Track[], index?: number) => void; addToEmotionPlaylist: (emotion: string, track: Track) => Promise<void>; playEmotionPlaylist: (emotion: string) => Promise<void>; getEmotionPlaylistSongs: (emotion: string) => Promise<Track[]>; }

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => { const [currentTrack, setCurrentTrack] = useState<Track | null>(null); const [playlist, setPlaylist] = useState<Track[]>([]); const [currentIndex, setCurrentIndex] = useState(0); const [emotionPlaylists, setEmotionPlaylists] = useState<EmotionPlaylist[]>([]); const { toast } = useToast(); const playerManager = YouTubePlayerManager.getInstance();

const playTrack = useCallback((track: Track, newPlaylist?: Track[], index = 0) => { if (newPlaylist) { setPlaylist(newPlaylist); setCurrentIndex(index); } setCurrentTrack(track); playerManager.playTrack(track); }, [playerManager]);

const getEmotionPlaylist = useCallback((emotion: string): EmotionPlaylist | null => { return emotionPlaylists.find(ep => ep.emotion === emotion) || null; }, [emotionPlaylists]);

const addToEmotionPlaylist = async (emotion: string, track: Track) => { const emotionPlaylist = getEmotionPlaylist(emotion); if (!emotionPlaylist) { toast({ title: 'Error', description: 'Emotion playlist not found', variant: 'destructive' }); return; }

const { error } = await supabase.from('emotion_playlist_songs').insert([{
  emotion_playlist_id: emotionPlaylist.id,
  song_id: track.id,
  title: track.title,
  artist: track.channelTitle,
  thumbnail: track.thumbnail,
  url: track.url,
}]);

if (error) {
  toast({ title: 'Error', description: 'Failed to add song to emotion playlist', variant: 'destructive' });
} else {
  toast({ title: 'Added', description: `Added to ${emotion} playlist` });
}

};

const getEmotionPlaylistSongs = async (emotion: string): Promise<Track[]> => { const playlist = getEmotionPlaylist(emotion); if (!playlist) return [];

const { data, error } = await supabase
  .from('emotion_playlist_songs')
  .select('*')
  .eq('emotion_playlist_id', playlist.id)
  .order('created_at');

if (error || !data) return [];

return data.map(song => ({
  id: song.song_id,
  title: song.title,
  channelTitle: song.artist,
  thumbnail: song.thumbnail,
  url: song.url,
}));

};

const playEmotionPlaylist = async (emotion: string) => { const songs = await getEmotionPlaylistSongs(emotion); if (songs.length === 0) { toast({ title: 'Empty Playlist', description: No songs in ${emotion} playlist, variant: 'destructive' }); return; } playTrack(songs[0], songs, 0); };

useEffect(() => { const loadEmotionPlaylists = async () => { const { data, error } = await supabase.from('emotion_playlists').select('*'); if (data) setEmotionPlaylists(data); }; loadEmotionPlaylists(); }, []);

const value: MusicPlayerContextType = { currentTrack, isPlaying: playerManager.getIsPlaying(), playTrack, addToEmotionPlaylist, getEmotionPlaylistSongs, playEmotionPlaylist, };

return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>; };

export const useMusicPlayer = () => { const context = useContext(MusicPlayerContext); if (!context) throw new Error('useMusicPlayer must be used within MusicPlayerProvider'); return context; };

