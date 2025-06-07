
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

// This hook is now deprecated - use useMusicPlayer directly
export const useGlobalYouTubePlayer = () => {
  const musicPlayer = useMusicPlayer();
  
  return {
    ...musicPlayer,
    isDragging: false,
    handleDragStart: () => {},
    handleDragMove: () => {},
    handleDragEnd: (time: number) => musicPlayer.seekTo(time),
  };
};
