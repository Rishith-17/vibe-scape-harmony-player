import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'; import { supabase } from '@/integrations/supabase/client'; import { useToast } from '@/hooks/use-toast'; import YouTubePlayerManager from '@/lib/youtubePlayerManager';

interface Track { id: string; title: string; channelTitle: string; thumbnail: string; url: string; }

interface Playlist { id: string; name: string; user_id: string; created_at: string; }

interface EmotionPlaylist { id: string; emotion: string; name: string; description: string; user_id: string; created_at: string; updated_at: string; }

interface PlayerState { isPlaying: boolean; currentTime: number; duration: number; isLoading: boolean; hasError: boolean; }

interface MusicPlayerContextType { currentTrack: Track | null; isPlaying: boolean; currentTime: number; duration: number; isLoading: boolean; hasError: boolean; playlist: Track[]; currentIndex: number; playTrack: (track: Track, newPlaylist?: Track[], index?: number) => void; togglePlayPause: () => void; skipNext: () => void; skipPrevious: () => void; seekTo: (time: number) => void; setVolume: (volume: number) => void; canSkipNext: boolean; canSkipPrevious: boolean; playlists: Playlist[]; createPlaylist: (name: string) => Promise<void>; deletePlaylist: (id: string) => Promise<void>; renamePlaylist: (id: string, name: string) => Promise<void>; addToPlaylist: (playlistId: string, track: Track) => Promise<void>; removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>; getPlaylistSongs: (playlistId: string) => Promise<Track[]>; refreshPlaylists: () => Promise<void>; likedSongs: Set<string>; toggleLikeSong: (track: Track) => Promise<void>; isLiked: (trackId: string) => boolean; emotionPlaylists: EmotionPlaylist[]; getEmotionPlaylist: (emotion: string) => EmotionPlaylist | null; addToEmotionPlaylist: (emotion: string, track: Track) => Promise<void>; getEmotionPlaylistSongs: (emotion: string) => Promise<Track[]>; playEmotionPlaylist: (emotion: string) => Promise<void>; refreshEmotionPlaylists: () => Promise<void>; }

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => { const [currentTrack, setCurrentTrack] = useState<Track | null>(null); const [playlist, setPlaylist] = useState<Track[]>([]); const [currentIndex, setCurrentIndex] = useState(0); const [playerState, setPlayerState] = useState<PlayerState>({ isPlaying: false, currentTime: 0, duration: 0, isLoading: false, hasError: false, }); const [playlists, setPlaylists] = useState<Playlist[]>([]); const [emotionPlaylists, setEmotionPlaylists] = useState<EmotionPlaylist[]>([]); const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set()); const { toast } = useToast();

const playerManager = YouTubePlayerManager.getInstance();

const skipNext = useCallback(() => { if (currentIndex < playlist.length - 1) { const nextIndex = currentIndex + 1; const nextTrack = playlist[nextIndex]; setCurrentIndex(nextIndex); setCurrentTrack(nextTrack); playerManager.playTrack(nextTrack); } }, [currentIndex, playlist, playerManager]);

const skipPrevious = useCallback(() => { if (currentIndex > 0) { const prevIndex = currentIndex - 1; const prevTrack = playlist[prevIndex]; setCurrentIndex(prevIndex); setCurrentTrack(prevTrack); playerManager.playTrack(prevTrack); } }, [currentIndex, playlist, playerManager]);

useEffect(() => { const unsubscribe = playerManager.subscribe(() => { setPlayerState({ isPlaying: playerManager.getIsPlaying(), currentTime: playerManager.getCurrentTime(), duration: playerManager.getDuration(), isLoading: playerManager.getIsLoading(), hasError: playerManager.getHasError(), }); });

playerManager.setOnTrackEnd(() => skipNext());

playerManager.setOnError(() => {
  toast({
    title: 'Playback Error',
    description: 'This video is not available. Skipping to next song.',
    variant: 'destructive',
  });
  setTimeout(() => skipNext(), 1000);
});

return () => unsubscribe();

}, [skipNext, toast, playerManager]);

const playTrack = useCallback((track: Track, newPlaylist?: Track[], index = 0) => { if (newPlaylist) { setPlaylist(newPlaylist); setCurrentIndex(index); } else { const trackIndex = playlist.findIndex(t => t.id === track.id); if (trackIndex !== -1) setCurrentIndex(trackIndex); } setCurrentTrack(track); playerManager.playTrack(track); }, [playlist, playerManager]);

const togglePlayPause = () => playerManager.togglePlayPause();

const seekTo = (time: number) => playerManager.seekTo(time);

const setVolume = (volume: number) => playerManager.setVolume(volume);

const refreshPlaylists = async () => { const { data, error } = await supabase.from('playlists').select('*').order('created_at'); if (data) setPlaylists(data); };

const refreshEmotionPlaylists = async () => { const { data, error } = await supabase.from('emotion_playlists').select('*').order('emotion'); if (data) setEmotionPlaylists(data); };

const getEmotionPlaylist = (emotion: string) => { return emotionPlaylists.find(ep => ep.emotion === emotion) || null; };

const addToEmotionPlaylist = async (emotion: string, track: Track) => { const emotionPlaylist = getEmotionPlaylist(emotion); if (!emotionPlaylist) return; await supabase.from('emotion_playlist_songs').insert([{ emotion_playlist_id: emotionPlaylist.id, song_id: track.id, title: track.title, artist: track.channelTitle, thumbnail: track.thumbnail, url: track.url, }]); };

const getEmotionPlaylistSongs = async (emotion: string) => { const playlist = getEmotionPlaylist(emotion); if (!playlist) return []; const { data } = await supabase.from('emotion_playlist_songs').select('*').eq('emotion_playlist_id', playlist.id); return (data || []).map(song => ({ id: song.song_id, title: song.title, channelTitle: song.artist, thumbnail: song.thumbnail, url: song.url, })); };

const playEmotionPlaylist = async (emotion: string) => { const songs = await getEmotionPlaylistSongs(emotion); if (songs.length === 0) { toast({ title: 'Empty Playlist', description: No songs in ${emotion} playlist, variant: 'destructive', }); return; } playTrack(songs[0], songs, 0); };

useEffect(() => { refreshPlaylists(); refreshEmotionPlaylists(); }, []);

const value: MusicPlayerContextType = { currentTrack, isPlaying: playerState.isPlaying, currentTime: playerState.currentTime, duration: playerState.duration, isLoading: playerState.isLoading, hasError: playerState.hasError, playlist, currentIndex, playTrack, togglePlayPause, skipNext, skipPrevious, seekTo, setVolume, canSkipNext: currentIndex < playlist.length - 1, canSkipPrevious: currentIndex > 0, playlists, createPlaylist: async () => {}, deletePlaylist: async () => {}, renamePlaylist: async () => {}, addToPlaylist: async () => {}, removeFromPlaylist: async () => {}, getPlaylistSongs: async () => [], refreshPlaylists, likedSongs, toggleLikeSong: async () => {}, isLiked: () => false, emotionPlaylists, getEmotionPlaylist, addToEmotionPlaylist, getEmotionPlaylistSongs, playEmotionPlaylist, refreshEmotionPlaylists, };

return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>; };

export const useMusicPlayer = () => { const context = useContext(MusicPlayerContext); if (!context) throw new Error('useMusicPlayer must be used within a MusicPlayerProvider'); return context; };

