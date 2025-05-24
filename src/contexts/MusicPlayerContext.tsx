
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  currentIndex: number;
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

  const value: MusicPlayerContextType = {
    currentTrack,
    isPlaying,
    playlist,
    currentIndex,
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
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
