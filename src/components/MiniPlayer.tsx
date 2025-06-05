
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import MiniMusicPlayer from './MiniMusicPlayer';

const MiniPlayer = () => {
  const { currentTrack, playlist, currentIndex } = useMusicPlayer();

  // Transform the tracks to match our YouTube player format
  const youtubePlaylist = playlist.map(track => ({
    id: track.id,
    title: track.title,
    thumbnail: track.thumbnail,
    artist: track.channelTitle,
  }));

  const handleTrackChange = () => {
    // Track changes are handled by the global context
  };

  return (
    <MiniMusicPlayer 
      playlist={youtubePlaylist}
      isVisible={!!currentTrack}
    />
  );
};

export default MiniPlayer;
