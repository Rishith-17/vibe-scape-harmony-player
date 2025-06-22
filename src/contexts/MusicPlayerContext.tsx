import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { usePlayerManager } from "@/hooks/usePlayerManager";

type Song = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
};

type EmotionPlaylist = {
  id: string;
  user_id: string;
  emotion: string;
};

type MusicPlayerContextType = {
  playTrack: (track: Song, queue?: Song[], index?: number) => void;
  addToEmotionPlaylist: (emotion: string, song: Song) => void;
  playEmotionPlaylist: (emotion: string) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const playerManager = usePlayerManager();
  const [emotionPlaylists, setEmotionPlaylists] = useState<EmotionPlaylist[]>([]);

  const refreshEmotionPlaylists = useCallback(async () => {
    const { data, error } = await supabase.from("emotion_playlists").select("*");
    if (error) {
      console.error("Error fetching emotion playlists:", error);
    } else {
      setEmotionPlaylists(data);
    }
  }, []);

  useEffect(() => {
    refreshEmotionPlaylists();
  }, [refreshEmotionPlaylists]);

  const getEmotionPlaylist = (emotion: string) => {
    return emotionPlaylists.find((p) => p.emotion === emotion);
  };

  const addToEmotionPlaylist = async (emotion: string, song: Song) => {
    const playlist = getEmotionPlaylist(emotion);
    if (!playlist) {
      toast({
        title: "Playlist not found",
        description: `No playlist for ${emotion}`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("emotion_playlist_songs").insert({
      emotion_playlist_id: playlist.id,
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      url: song.url,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Could not add song to emotion playlist",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Added to ${emotion} playlist`,
      });
    }
  };

  const getEmotionPlaylistSongs = async (emotion: string): Promise<Song[]> => {
    const playlist = getEmotionPlaylist(emotion);
    if (!playlist) return [];

    const { data, error } = await supabase
      .from("emotion_playlist_songs")
      .select("*")
      .eq("emotion_playlist_id", playlist.id);

    if (error) {
      console.error("Error fetching songs:", error);
      return [];
    }

    return (data || []).map((song: any) => ({
      id: song.song_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      url: song.url,
    }));
  };

  const playEmotionPlaylist = async (emotion: string) => {
    const songs = await getEmotionPlaylistSongs(emotion);

    if (songs.length === 0) {
      toast({
        title: "Empty Playlist",
        description: `No songs in ${emotion} playlist`,
        variant: "destructive",
      });
      return;
    }

    playerManager.playTrack(songs[0], songs);
    toast({
      title: "Playing",
      description: `Playing ${emotion} playlist`,
    });
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        playTrack: playerManager.playTrack,
        addToEmotionPlaylist,
        playEmotionPlaylist,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  return context;
};