
import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { formatTime } from '@/lib/timeUtils';
import NowPlayingModal from './NowPlayingModal';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  artist?: string;
}

interface MiniMusicPlayerProps {
  playlist: Track[];
  isVisible: boolean;
}

const MiniMusicPlayer = ({ playlist, isVisible }: MiniMusicPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useState(80);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      return; // YouTube player will automatically repeat
    }
    
    if (repeatMode === 'all' && currentIndex === playlist.length - 1) {
      setCurrentIndex(0);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const {
    playerRef,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTo,
    setVolume: setPlayerVolume,
  } = useYouTubePlayer({
    playlist,
    currentIndex,
    onTrackChange: setCurrentIndex,
    onTrackEnd: handleTrackEnd,
  });

  const handleNext = () => {
    if (isShuffleOn) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(randomIndex);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (repeatMode === 'all') {
      setCurrentIndex(playlist.length - 1);
    }
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setPlayerVolume(value[0]);
  };

  const currentTrack = playlist[currentIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isVisible || !currentTrack) return null;

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="fixed -top-full -left-full opacity-0 pointer-events-none">
        <div ref={playerRef} />
      </div>

      {/* Mini Player - YouTube Music Style */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 z-50 transition-all duration-300 shadow-lg">
        {/* Thin Progress Bar at Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-red-500 transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center space-x-3">
            {/* Track Info - Clickable */}
            <div 
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer active:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
              onClick={() => setIsNowPlayingOpen(true)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover shadow-md"
                />
                {/* Play Status Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${isPlaying ? 'bg-red-500' : 'bg-gray-400'} border-2 border-white shadow-sm`}>
                  {isPlaying && <div className="w-full h-full bg-red-500 rounded-full animate-pulse" />}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 font-medium text-sm line-clamp-1 mb-0.5">
                  {currentTrack.title}
                </h4>
                <div className="flex items-center space-x-1">
                  <p className="text-gray-600 text-xs line-clamp-1">
                    {currentTrack.artist || 'Unknown Artist'}
                  </p>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Previous Button - Hidden on small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full hidden sm:inline-flex"
              >
                <SkipBack size={18} />
              </Button>

              {/* Play/Pause Button */}
              <Button
                onClick={togglePlayPause}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-10 h-10 p-0 shadow-md flex-shrink-0"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </Button>

              {/* Next Button - Hidden on small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full hidden sm:inline-flex"
              >
                <SkipForward size={18} />
              </Button>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNowPlayingOpen(true)}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full"
              >
                <ChevronUp size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Now Playing Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffleOn={isShuffleOn}
        repeatMode={repeatMode}
        onTogglePlay={togglePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onShuffleToggle={() => setIsShuffleOn(!isShuffleOn)}
        onRepeatToggle={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
        playlist={playlist}
        currentIndex={currentIndex}
        onTrackSelect={setCurrentIndex}
      />
    </>
  );
};

export default MiniMusicPlayer;
