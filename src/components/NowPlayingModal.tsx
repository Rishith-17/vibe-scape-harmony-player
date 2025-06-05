
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
      <DialogContent className="max-w-full h-full bg-gradient-to-br from-red-50 via-white to-orange-50 text-gray-900 border-none p-0 m-0 overflow-hidden">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{
            backgroundImage: `url(${currentTrack.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-700 hover:bg-gray-200/80 rounded-full p-2"
            >
              <ChevronDown size={24} />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Now Playing</p>
              <p className="text-gray-500 text-xs mt-0.5">{playlist.length} songs</p>
            </div>
            <Button
              variant="ghost"
              className="text-gray-700 hover:bg-gray-200/80 rounded-full p-2"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>

          {/* Album Art - YouTube Music Style */}
          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="relative w-full max-w-sm aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-red-200/50 to-orange-200/50 rounded-full blur-2xl opacity-60" />
              <div className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/80 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-900/80 rounded-full border-2 border-white/80 backdrop-blur-sm">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="px-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2 mb-2">
                  {currentTrack.title}
                </h1>
                <p className="text-base text-gray-600 line-clamp-1">
                  {currentTrack.artist || 'Unknown Artist'}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-red-500 hover:bg-red-50 ml-4 rounded-full flex-shrink-0"
              >
                <Heart size={24} />
              </Button>
            </div>
          </div>

          {/* Progress Bar - Interactive */}
          <div className="px-6 pb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={onSeek}
              className="w-full mb-3 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                onClick={onShuffleToggle}
                className={`rounded-full p-3 ${isShuffleOn ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Shuffle size={20} />
              </Button>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={onPrevious}
                  className="text-gray-700 hover:bg-gray-100 rounded-full p-3"
                >
                  <SkipBack size={32} />
                </Button>

                <Button
                  onClick={onTogglePlay}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-16 h-16 shadow-xl transform transition-transform duration-150 hover:scale-105"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </Button>

                <Button
                  variant="ghost"
                  onClick={onNext}
                  className="text-gray-700 hover:bg-gray-100 rounded-full p-3"
                >
                  <SkipForward size={32} />
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={onRepeatToggle}
                className={`rounded-full p-3 relative ${repeatMode !== 'off' ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Repeat size={20} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </span>
                )}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 mb-6">
              <Volume2 size={18} className="text-gray-600" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-10 text-right font-medium">{volume}</span>
            </div>

            {/* Up Next Queue */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                <Music size={20} className="mr-2" />
                Up Next
              </h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {playlist.slice(currentIndex + 1, currentIndex + 4).map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => onTrackSelect(currentIndex + 1 + index)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/80 cursor-pointer transition-colors"
                  >
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium line-clamp-1">{track.title}</p>
                      <p className="text-gray-600 text-xs line-clamp-1">{track.artist || 'Unknown Artist'}</p>
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
