
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import YouTubePlayerManager from '@/lib/youtubePlayerManager';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface FullPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FullPlayer = ({ isOpen, onClose }: FullPlayerProps) => {
  const {
    currentTrack,
    skipNext,
    skipPrevious,
    canSkipNext,
    canSkipPrevious,
  } = useMusicPlayer();

  const playerManager = YouTubePlayerManager.getInstance();
  const isPlaying = playerManager.getIsPlaying();

  const togglePlayPause = () => {
    playerManager.togglePlayPause();
  };

  if (!currentTrack) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white border-none p-0 m-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-gray-800"
            >
              <ChevronDown size={24} />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-400">Playing from</p>
              <p className="text-white font-medium">Search Results</p>
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-80 h-60 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="px-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white line-clamp-1 mb-1">
                  {currentTrack.title}
                </h1>
                <p className="text-lg text-gray-400 line-clamp-1">
                  {currentTrack.channelTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-red-400 ml-4"
              >
                <Heart size={24} />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pb-4">
            <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-1/3"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>1:23</span>
              <span>3:45</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <Shuffle size={20} />
              </Button>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={skipPrevious}
                  disabled={!canSkipPrevious}
                  className="text-white hover:bg-gray-800 disabled:opacity-30"
                >
                  <SkipBack size={32} />
                </Button>

                <Button
                  onClick={togglePlayPause}
                  className="bg-white hover:bg-gray-200 text-black rounded-full w-16 h-16"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </Button>

                <Button
                  variant="ghost"
                  onClick={skipNext}
                  disabled={!canSkipNext}
                  className="text-white hover:bg-gray-800 disabled:opacity-30"
                >
                  <SkipForward size={32} />
                </Button>
              </div>

              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <Repeat size={20} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullPlayer;
