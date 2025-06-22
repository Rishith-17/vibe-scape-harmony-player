// src/contexts/MusicPlayerContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, } from "react"; import { supabase } from "@/integrations/supabase/client"; import { useToast } from "@/hooks/use-toast"; import YouTubePlayerManager from "@/lib/youtubePlayerManager";

interface Track { id: string; title: string; channelTitle: string; thumbnail: string; url: string; }

interface EmotionPlaylist { id: string; emotion: string; name: string; description: string; user_id: string; created_at: string; updated_at: string; }

interface MusicPlayerContextType { playEmotionPlaylist: (emotion: string) => Promise<void>; addToEmotionPlaylist: (emotion: string, track: Track) => Promise<void>; getEmotionPlaylistSongs: (emotion: string) => Promise<Track[]>; refreshEmotionPlaylists: () => Promise<void>; emotionPlaylists: EmotionPlaylist[]; }

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => { const [emotionPlaylists, setEmotionPlaylists] = useState<EmotionPlaylist[]>([]); const playerManager = YouTubePlayerManager.getInstance(); const { toast } = useToast();

const getEmotionPlaylist = useCallback( (emotion: string): EmotionPlaylist | null => { return emotionPlaylists.find((ep) => ep.emotion === emotion) || null; }, [emotionPlaylists] );

const getEmotionPlaylistSongs = async (emotion: string): Promise<Track[]> => { const playlist = getEmotionPlaylist(emotion); if (!playlist) return [];

const { data } = await supabase
  .from("emotion_playlist_songs")
  .select("*")
  .eq("emotion_playlist_id", playlist.id);

return (data || []).map((song) => ({
  id: song.song_id,
  title: song.title,
  channelTitle: song.artist,
  thumbnail: song.thumbnail,
  url: song.url,
}));

};

const addToEmotionPlaylist = async (emotion: string, track: Track) => { const playlist = getEmotionPlaylist(emotion); if (!playlist) return;

const { error } = await supabase.from("emotion_playlist_songs").insert([
  {
    emotion_playlist_id: playlist.id,
    song_id: track.id,
    title: track.title,
    artist: track.channelTitle,
    thumbnail: track.thumbnail,
    url: track.url,
  },
]);

if (error) {
  toast({
    title: "Error",
    description: "Could not add song to emotion playlist",
    variant: "destructive",
  });
} else {
  toast({
    title: "Added",
    description: `Added song to ${emotion} playlist`,
  });
}

};

const playEmotionPlaylist = async (emotion: string) => { const songs = await getEmotionPlaylistSongs(emotion); if (songs.length === 0) { toast({ title: "Empty Playlist", description: No songs in ${emotion} playlist, variant: "destructive", }); return; } playerManager.playTrack(songs[0], songs); toast({ title: "Playing", description: Playing ${emotion} playlist, }); };

const refreshEmotionPlaylists = useCallback(async () => { const { data } = await supabase.from("emotion_playlists").select("*"); if (data) setEmotionPlaylists(data); }, []);

useEffect(() => { refreshEmotionPlaylists(); }, [refreshEmotionPlaylists]);

return ( <MusicPlayerContext.Provider value={{ playEmotionPlaylist, addToEmotionPlaylist, getEmotionPlaylistSongs, refreshEmotionPlaylists, emotionPlaylists, }} > {children} </MusicPlayerContext.Provider> ); };

export const useMusicPlayer = () => { const context = useContext(MusicPlayerContext); if (!context) { throw new Error("useMusicPlayer must be used within a MusicPlayerProvider"); } return context; };

