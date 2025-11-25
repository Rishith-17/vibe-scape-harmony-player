import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronUp, Volume2, Heart, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { formatTime } from '@/lib/timeUtils';
import NowPlayingModal from './NowPlayingModal';
import { AIResponsePanel } from './AIResponsePanel';
import { getGlobalVoiceController, setAIResponseCallback } from '@/voice/voiceController';

const SpotifyMiniPlayer = () => {
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

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

  // Setup AI response callback
  useEffect(() => {
    setAIResponseCallback((response: string, loading: boolean) => {
      setIsAILoading(loading);
      if (!loading) {
        setAiResponse(response);
        setShowAIPanel(true);
      }
    });

    return () => {
      setAIResponseCallback(null);
    };
  }, []);

  const handleAIExplainClick = async () => {
    const controller = getGlobalVoiceController();
    if (controller) {
      console.log('[MiniPlayer] 🎵 AI Explain Song clicked');
      setShowAIPanel(true);
      setIsAILoading(true);
      await controller.analyzeCurrentAudio();
    }
  };

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
      {/* Pill-Shaped Mini Player with Neon Glow */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-40">
        <div className="relative rounded-full bg-background/95 backdrop-blur-xl border-2 border-primary/60 shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] px-6 py-4">
          {/* Interactive Progress Bar */}
          <div className="absolute -top-2 left-6 right-6 h-1 bg-muted rounded-full overflow-hidden group cursor-pointer">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 shadow-[0_0_8px_hsl(var(--primary))]"
              style={{ width: `${duration > 0 ? (displayTime / duration) * 100 : 0}%` }}
            />
            <div className="absolute -top-1 left-0 right-0 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
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

          <div className="flex items-center space-x-4">
            {/* Track Info - Left Section */}
            <div 
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsNowPlayingOpen(true)}
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg border-2 border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.3)] transform transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {/* 3D Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
                </div>
                
                {/* Loading/Playing Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary/60 flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.4)]">
                  {isLoading ? (
                    <Loader2 size={10} className="text-primary animate-spin" />
                  ) : isPlaying ? (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-foreground font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                  {currentTrack.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <p className="text-muted-foreground text-xs line-clamp-1">
                    {currentTrack.channelTitle || 'Unknown Artist'}
                  </p>
                  {hasError && (
                    <span className="text-destructive text-xs">• Error</span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-full"
              >
                <Heart size={16} />
              </Button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={skipPrevious}
                disabled={!canSkipPrevious}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-primary/10 rounded-full w-9 h-9 p-0 transition-all hover:scale-110 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] active:scale-95"
              >
                <SkipBack size={18} />
              </Button>

              <Button
                onClick={togglePlayPause}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-11 h-11 p-0 shadow-[0_0_20px_hsl(var(--primary)/0.5)] transform transition-all duration-200 hover:scale-110 hover:shadow-[0_0_25px_hsl(var(--primary)/0.7)] active:scale-95 disabled:opacity-50"
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
                size="icon"
                onClick={skipNext}
                disabled={!canSkipNext}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-primary/10 rounded-full w-9 h-9 p-0 transition-all hover:scale-110 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] active:scale-95"
              >
                <SkipForward size={18} />
              </Button>
            </div>

            {/* Right Section - AI, Volume & Time */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* AI Explain Song Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAIExplainClick}
                disabled={isAILoading || !currentTrack}
                className="text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full w-9 h-9 p-0 transition-all hover:scale-110 hover:shadow-[0_0_12px_hsl(180_100%_50%/0.3)] active:scale-95 disabled:opacity-30"
                title="AI Explain Song"
              >
                {isAILoading ? (
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                ) : (
                  <Sparkles size={16} />
                )}
              </Button>

              <div className="hidden md:flex items-center space-x-2 text-xs text-muted-foreground font-mono">
                <span>{formatTime(displayTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="hidden lg:flex items-center space-x-2 w-24">
                <Volume2 size={14} className="text-muted-foreground" />
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
                size="icon"
                onClick={() => setIsNowPlayingOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full w-9 h-9 p-0 transition-all hover:scale-110 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] active:scale-95"
              >
                <ChevronUp size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Response Panel */}
      <AIResponsePanel
        isVisible={showAIPanel}
        response={aiResponse}
        isLoading={isAILoading}
        onClose={() => setShowAIPanel(false)}
      />

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
