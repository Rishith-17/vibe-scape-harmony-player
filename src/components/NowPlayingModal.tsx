
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Repeat, Heart, MoreHorizontal, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatTime } from '@/lib/timeUtils';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  artist?: string;
}

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffleOn: boolean;
  repeatMode: 'off' | 'all' | 'one';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  playlist: Track[];
  currentIndex: number;
  onTrackSelect: (index: number) => void;
}

const NowPlayingModal = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffleOn,
  repeatMode,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onShuffleToggle,
  onRepeatToggle,
  playlist,
  currentIndex,
  onTrackSelect,
}: NowPlayingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white border-none p-0 m-0 overflow-hidden">
        <div className="flex flex-col h-full relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-32 h-16 sm:h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 sm:bottom-40 right-10 sm:right-20 w-24 sm:w-48 h-24 sm:h-48 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-64 h-32 sm:h-64 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 relative z-10">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full p-2"
            >
              <ChevronDown size={20} className="sm:w-6 sm:h-6" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-300">Now Playing</p>
              <p className="text-white font-medium text-sm">{playlist.length} songs</p>
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-full p-2"
            >
              <MoreHorizontal size={20} className="sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Album Art with 3D Effect */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
            <div className="relative group w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl sm:rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 hover:scale-105">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Vinyl Effect */}
                <div className={`absolute inset-0 bg-black/20 rounded-full border-2 sm:border-4 border-white/10 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }}>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 sm:w-8 h-4 sm:h-8 bg-black/50 rounded-full border border-white/20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="px-6 sm:px-8 pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white line-clamp-2 mb-2">
                  {currentTrack.title}
                </h1>
                <p className="text-base sm:text-lg text-gray-300 line-clamp-1">
                  {currentTrack.artist || 'Unknown Artist'}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-red-400 ml-4 rounded-full flex-shrink-0"
              >
                <Heart size={24} className="sm:w-7 sm:h-7" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 sm:px-8 pb-4 relative z-10">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={onSeek}
              className="w-full mb-3"
            />
            <div className="flex justify-between text-sm text-gray-300">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                onClick={onShuffleToggle}
                className={`rounded-full p-2 sm:p-3 ${isShuffleOn ? 'text-green-400' : 'text-gray-400'} hover:text-white`}
              >
                <Shuffle size={20} className="sm:w-6 sm:h-6" />
              </Button>
              
              <div className="flex items-center space-x-4 sm:space-x-6">
                <Button
                  variant="ghost"
                  onClick={onPrevious}
                  className="text-white hover:bg-white/10 rounded-full p-2 sm:p-3"
                >
                  <SkipBack size={28} className="sm:w-9 sm:h-9" />
                </Button>

                <Button
                  onClick={onTogglePlay}
                  className="bg-white hover:bg-gray-200 text-black rounded-full w-16 h-16 sm:w-20 sm:h-20 shadow-2xl transform transition-transform duration-150 hover:scale-105"
                >
                  {isPlaying ? <Pause size={28} className="sm:w-9 sm:h-9" /> : <Play size={28} className="sm:w-9 sm:h-9" />}
                </Button>

                <Button
                  variant="ghost"
                  onClick={onNext}
                  className="text-white hover:bg-white/10 rounded-full p-2 sm:p-3"
                >
                  <SkipForward size={28} className="sm:w-9 sm:h-9" />
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={onRepeatToggle}
                className={`rounded-full p-2 sm:p-3 relative ${repeatMode !== 'off' ? 'text-green-400' : 'text-gray-400'} hover:text-white`}
              >
                <Repeat size={20} className="sm:w-6 sm:h-6" />
                {repeatMode === 'one' && <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></span>}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 sm:space-x-4 mb-6">
              <Volume2 size={18} className="text-gray-300 sm:w-5 sm:h-5" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-300 w-8 text-right">{volume}</span>
            </div>

            {/* Queue */}
            <div className="bg-black/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                <Music size={18} className="mr-2 sm:w-5 sm:h-5" />
                Up Next
              </h3>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {playlist.slice(currentIndex + 1, currentIndex + 4).map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => onTrackSelect(currentIndex + 1 + index)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm line-clamp-1">{track.title}</p>
                      <p className="text-gray-400 text-xs line-clamp-1">{track.artist || 'Unknown Artist'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NowPlayingModal;
