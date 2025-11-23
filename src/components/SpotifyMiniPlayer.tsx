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
      {/* Pill-Shaped Floating Capsule Mini Player */}
      <div className="fixed bottom-20 left-4 right-4 md:left-8 md:right-8 z-40 flex justify-center pointer-events-none">
        <div 
          className="relative w-full max-w-5xl pointer-events-auto"
          style={{
            borderRadius: '60px',
          }}
        >
          {/* Glowing Gradient Border Effect */}
          <div 
            className="absolute inset-0 rounded-[60px] p-[2px]"
            style={{
              background: 'linear-gradient(135deg, #00FFFF 0%, #8A2BE2 100%)',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}
          >
            {/* Inner Container with Dark Background */}
            <div 
              className="h-full w-full rounded-[58px] backdrop-blur-xl relative overflow-hidden"
              style={{
                background: 'rgba(26, 26, 46, 0.95)',
              }}
            >
              {/* Interactive Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 group cursor-pointer rounded-t-[58px] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
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

              <div className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Album Art - Left Section */}
                  <div 
                    className="flex-shrink-0 cursor-pointer group/art"
                    onClick={() => setIsNowPlayingOpen(true)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 group-hover/art:scale-110 ring-2 ring-cyan-400/30">
                        <img
                          src={currentTrack.thumbnail}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Glass Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1A1A2E] flex items-center justify-center" style={{background: 'rgba(26, 26, 46, 0.95)'}}>
                        {isLoading ? (
                          <Loader2 size={10} className="text-cyan-400 animate-spin" />
                        ) : isPlaying ? (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Track Info & Visualizer */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer group/info"
                    onClick={() => setIsNowPlayingOpen(true)}
                  >
                    <h4 className="text-white font-bold text-sm md:text-base line-clamp-1 mb-0.5 group-hover/info:text-cyan-400 transition-colors">
                      {currentTrack.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-400 text-xs md:text-sm line-clamp-1">
                        {currentTrack.channelTitle || 'Unknown Artist'}
                      </p>
                      {/* Simple Visualizer Bars */}
                      {isPlaying && (
                        <div className="hidden md:flex items-center gap-0.5 ml-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full"
                              style={{
                                height: `${4 + Math.random() * 8}px`,
                                animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipPrevious}
                      disabled={!canSkipPrevious}
                      className="text-gray-400 hover:text-cyan-400 disabled:opacity-30 hover:bg-white/10 rounded-full p-2 transition-all hover:scale-110"
                    >
                      <SkipBack size={16} className="md:w-5 md:h-5" />
                    </Button>

                    <Button
                      onClick={togglePlayPause}
                      disabled={isLoading}
                      className="bg-gradient-to-br from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-white rounded-full w-10 h-10 md:w-12 md:h-12 p-0 shadow-lg shadow-cyan-500/30 transform transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} className="ml-0.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipNext}
                      disabled={!canSkipNext}
                      className="text-gray-400 hover:text-cyan-400 disabled:opacity-30 hover:bg-white/10 rounded-full p-2 transition-all hover:scale-110"
                    >
                      <SkipForward size={16} className="md:w-5 md:h-5" />
                    </Button>
                  </div>

                  {/* Right Section - Volume & Expand */}
                  <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                      <span>{formatTime(displayTime)}</span>
                      <span className="text-gray-600">/</span>
                      <span>{formatTime(duration)}</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 w-24">
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
                      className="text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded-full p-2 transition-all hover:scale-110"
                    >
                      <ChevronUp size={16} />
                    </Button>
                  </div>
                </div>
              </div>
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
        playlist={playlist}
        currentIndex={currentIndex}
        onTrackSelect={() => {}}
      />
    </>
  );
};

export default SpotifyMiniPlayer;
