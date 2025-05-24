
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  currentTrack: {
    title: string;
    channelTitle: string;
    thumbnail: string;
  };
}

const PlaybackControls = ({
  isPlaying,
  onTogglePlay,
  onSkipNext,
  onSkipPrevious,
  canSkipNext,
  canSkipPrevious,
  currentTrack,
}: PlaybackControlsProps) => {
  return (
    <div className="fixed bottom-16 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-40">
      <div className="px-6 py-4">
        {/* Track Info */}
        <div className="flex items-center space-x-3 mb-4">
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
          <div className="flex items-center space-x-1">
            <Volume2 size={16} className="text-yellow-400" />
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipPrevious}
            disabled={!canSkipPrevious}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <SkipBack size={20} />
          </Button>

          <Button
            onClick={onTogglePlay}
            className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-full w-12 h-12 p-0"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipNext}
            disabled={!canSkipNext}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <SkipForward size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
