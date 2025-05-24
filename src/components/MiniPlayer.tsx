
import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import FullPlayer from './FullPlayer';

const MiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    skipNext,
    skipPrevious,
    canSkipNext,
    canSkipPrevious,
  } = useMusicPlayer();
  
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-40">
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => setIsFullPlayerOpen(true)}
        >
          <div className="flex items-center space-x-3">
            {/* Track Info */}
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-12 h-9 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-1">
                {currentTrack.title}
              </h4>
              <p className="text-gray-400 text-xs line-clamp-1">
                {currentTrack.channelTitle}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  skipPrevious();
                }}
                disabled={!canSkipPrevious}
                className="text-gray-400 hover:text-white disabled:opacity-30 p-1"
              >
                <SkipBack size={18} />
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-8 h-8 p-0"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  skipNext();
                }}
                disabled={!canSkipNext}
                className="text-gray-400 hover:text-white disabled:opacity-30 p-1"
              >
                <SkipForward size={18} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullPlayerOpen(true);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <ChevronUp size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Player Modal */}
      <FullPlayer 
        isOpen={isFullPlayerOpen} 
        onClose={() => setIsFullPlayerOpen(false)} 
      />
    </>
  );
};

export default MiniPlayer;
