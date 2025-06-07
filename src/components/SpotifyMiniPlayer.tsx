
import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronUp, Volume2, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { formatTime } from '@/lib/timeUtils';
import NowPlayingModal from './NowPlayingModal';

const SpotifyMiniPlayer = () => {
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const { 
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    hasError,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume: setPlayerVolume,
    canSkipNext,
    canSkipPrevious,
    playlist,
    currentIndex
  } = useMusicPlayer();

  const handleSeek = (value: number[]) => {
    const targetTime = value[0];
    setIsDragging(true);
    setDragTime(targetTime);
  };

  const handleSeekCommit = (value: number[]) => {
    setIsDragging(false);
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setPlayerVolume(value[0]);
  };

  const displayTime = isDragging ? dragTime : currentTime;

  if (!currentTrack) return null;

  return (
    <>
      {/* Spotify-Style Mini Player */}
      <div className="fixed bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl border-t border-gray-700/50 z-50 shadow-2xl">
        {/* Interactive Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 group cursor-pointer">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
            style={{ width: `${duration > 0 ? (displayTime / duration) * 100 : 0}%` }}
          />
          <div className="absolute top-0 left-0 right-0 h-3 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Slider
              value={[displayTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              onValueCommit={handleSeekCommit}
              className="w-full h-3"
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center space-x-4">
            {/* Track Info - Left Section */}
            <div 
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsNowPlayingOpen(true)}
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 group-hover:scale-105">
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {/* 3D Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg" />
                </div>
                
                {/* Loading/Playing Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 size={10} className="text-green-400 animate-spin" />
                  ) : isPlaying ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm line-clamp-1 mb-1 group-hover:text-green-400 transition-colors">
                  {currentTrack.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-xs line-clamp-1">
                    {currentTrack.channelTitle || 'Unknown Artist'}
                  </p>
                  {hasError && (
                    <span className="text-red-400 text-xs">• Error</span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Heart size={16} />
              </Button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipPrevious}
                disabled={!canSkipPrevious}
                className="text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-700/50 rounded-full p-2 transition-all hover:scale-110"
              >
                <SkipBack size={16} />
              </Button>

              <Button
                onClick={togglePlayPause}
                disabled={isLoading}
                className="bg-white hover:bg-gray-100 text-black rounded-full w-8 h-8 p-0 shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipNext}
                disabled={!canSkipNext}
                className="text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-700/50 rounded-full p-2 transition-all hover:scale-110"
              >
                <SkipForward size={16} />
              </Button>
            </div>

            {/* Right Section - Volume & Time */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-400 font-mono">
                <span>{formatTime(displayTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="hidden lg:flex items-center space-x-2 w-24">
                <Volume2 size={14} className="text-gray-400" />
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNowPlayingOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full p-2 transition-all hover:scale-110"
              >
                <ChevronUp size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Now Playing Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        currentTrack={{
          id: currentTrack.id,
          title: currentTrack.title,
          thumbnail: currentTrack.thumbnail,
          artist: currentTrack.channelTitle,
        }}
        isPlaying={isPlaying}
        currentTime={displayTime}
        duration={duration}
        volume={volume}
        isShuffleOn={false}
        repeatMode="off"
        isDragging={isDragging}
        onTogglePlay={togglePlayPause}
        onNext={skipNext}
        onPrevious={skipPrevious}
        onSeek={handleSeek}
        onSeekCommit={handleSeekCommit}
        onVolumeChange={handleVolumeChange}
        onShuffleToggle={() => {}}
        onRepeatToggle={() => {}}
        playlist={playlist.map(track => ({
          id: track.id,
          title: track.title,
          thumbnail: track.thumbnail,
          artist: track.channelTitle,
        }))}
        currentIndex={currentIndex}
        onTrackSelect={() => {}}
      />
    </>
  );
};

export default SpotifyMiniPlayer;
