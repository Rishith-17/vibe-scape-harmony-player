
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
        <div className="px-4 py-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Content */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setIsNowPlayingOpen(true)}
          >
            {/* Track Info */}
            <div className="relative">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover shadow-lg"
              />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} border-2 border-gray-900`}></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-1">
                {currentTrack.title}
              </h4>
              <p className="text-gray-400 text-xs line-clamp-1">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="text-gray-400 hover:text-white p-2"
              >
                <SkipBack size={18} />
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-10 h-10 p-0 shadow-lg"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="text-gray-400 hover:text-white p-2"
              >
                <SkipForward size={18} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNowPlayingOpen(true);
                }}
                className="text-gray-400 hover:text-white p-2"
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
