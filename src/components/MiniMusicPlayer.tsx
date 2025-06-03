
import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Repeat, ChevronUp } from 'lucide-react';
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

  if (!isVisible || !currentTrack) return null;

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="fixed -top-full -left-full opacity-0 pointer-events-none">
        <div ref={playerRef} />
      </div>

      {/* Mini Player */}
      <div className="fixed bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900/95 via-purple-900/95 to-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 z-50 transition-all duration-300">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          {/* Progress Bar */}
          <div className="mb-2 sm:mb-3">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span className="min-w-[35px]">{formatTime(currentTime)}</span>
              <span className="min-w-[35px] text-right">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Content */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Track Info */}
            <div 
              className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsNowPlayingOpen(true)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-lg"
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} border-2 border-gray-900`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm line-clamp-1">
                  {currentTrack.title}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-1">
                  {currentTrack.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Previous Button - Hidden on very small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="text-gray-400 hover:text-white p-1 sm:p-2 hidden xs:inline-flex"
              >
                <SkipBack size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>

              {/* Play/Pause Button */}
              <Button
                onClick={togglePlayPause}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 shadow-lg flex-shrink-0"
              >
                {isPlaying ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
              </Button>

              {/* Next Button - Hidden on very small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="text-gray-400 hover:text-white p-1 sm:p-2 hidden xs:inline-flex"
              >
                <SkipForward size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNowPlayingOpen(true)}
                className="text-gray-400 hover:text-white p-1 sm:p-2"
              >
                <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" />
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
