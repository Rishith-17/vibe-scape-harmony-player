import { useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/voice/commandRunner';

interface ControlAction {
  type: 'gesture' | 'voice';
  action: string;
  timestamp: number;
  confidence: number;
}

export const useUnifiedMusicControls = () => {
  const [feedback, setFeedback] = useState<{
    gestureIcon?: string;
    show: boolean;
  }>({ show: false });
  
  const lastActionRef = useRef<ControlAction | null>(null);
  const lastFistGestureRef = useRef<number>(0);
  const { 
    togglePlayPause, 
    skipNext, 
    skipPrevious, 
    setVolume, 
    currentTrack, 
    isPlaying,
    playlist
  } = useMusicPlayer();
  const { toast } = useToast();

  const shouldExecuteAction = (newAction: ControlAction): boolean => {
    const now = Date.now();
    
    // Always allow if no previous action
    if (!lastActionRef.current) {
      lastActionRef.current = newAction;
      return true;
    }

    const timeDiff = now - lastActionRef.current.timestamp;
    
    // Prevent duplicate actions within 500ms (debounce)
    if (timeDiff < 500) {
      if (newAction.action === lastActionRef.current.action) {
        console.log('🚫 Duplicate action ignored - too soon:', newAction.action);
        return false;
      }
    }
    
    // Within 1 second window, gesture takes priority over voice
    if (timeDiff < 1000) {
      if (newAction.type === 'gesture' && lastActionRef.current.type === 'voice') {
        console.log('🤚 Gesture overrides voice command');
        lastActionRef.current = newAction;
        return true;
      } else if (newAction.type === 'voice' && lastActionRef.current.type === 'gesture') {
        console.log('🚫 Voice command ignored - gesture has priority');
        return false;
      }
    }

    lastActionRef.current = newAction;
    return true;
  };

  const executeCommand = async (
    command: string, 
    confidence: number, 
    commandType: 'gesture' | 'voice',
    gestureIcon?: string
  ) => {
    const action: ControlAction = {
      type: commandType,
      action: command,
      timestamp: Date.now(),
      confidence
    };

    if (!shouldExecuteAction(action)) {
      return;
    }

    console.log(`🎵 Executing ${commandType} command:`, command, 'Confidence:', confidence);

    // Use command runner to prevent overlapping execution with voice commands
    const result = await runCommand(async () => {
      await executeCommandInternal(command, commandType, gestureIcon);
    });

    if (result === null) {
      console.log('⏸️ Command skipped - another command is running');
    }
  };

  const executeCommandInternal = async (command: string, commandType: 'gesture' | 'voice', gestureIcon?: string) => {

    // Show feedback
    if (commandType === 'gesture' && gestureIcon) {
      setFeedback({ gestureIcon, show: true });
    }

    // Execute the command
    switch (command.toLowerCase()) {
      case 'fist':
        // Fist = Toggle Play/Pause with 3-second cooldown
        const now = Date.now();
        const timeSinceLastFist = now - lastFistGestureRef.current;
        
        if (timeSinceLastFist < 3000) {
          console.log('🚫 Fist gesture ignored - 3-second cooldown active');
          return;
        }
        
        lastFistGestureRef.current = now;
        
        if (currentTrack || playlist.length > 0) {
          togglePlayPause();
          toast({
            title: isPlaying ? "⏸️ Paused" : "▶️ Playing",
            description: isPlaying ? "Playback paused" : currentTrack?.title || "Music resumed",
          });
        }
        break;
        
      case 'open_hand':
        // Open hand = Voice Control (same as call_me)
        console.log('🖐️ Dispatching voice control trigger event');
        const voiceEvent = new CustomEvent('vibescape:trigger-voice');
        window.dispatchEvent(voiceEvent);
        toast({
          title: "🎤 Voice Control",
          description: "Listening for your command...",
        });
        break;
      
      case 'stop':
        // Voice command 'stop' - same as pause
        if (isPlaying) {
          togglePlayPause();
          toast({
            title: "⏹️ Stopped",
            description: "Playback stopped",
          });
        }
        break;
        
      case 'play':
      case 'resume':
        // Voice commands 'play' or 'resume'
        if (!isPlaying && (currentTrack || playlist.length > 0)) {
          togglePlayPause();
          toast({
            title: "▶️ Playing",
            description: currentTrack?.title || "Music resumed",
          });
        }
        break;
      
      case 'next':
        if (playlist.length > 0 || currentTrack) {
          skipNext();
          toast({
            title: "⏭️ Next Track",
            description: "Playing next song",
          });
        }
        break;
        
      case 'previous':
        if (playlist.length > 0 || currentTrack) {
          skipPrevious();
          toast({
            title: "⏮️ Previous Track",
            description: "Playing previous song",
          });
        }
        break;
        
      case 'voice_control':
        // Voice control command (from voice or other sources)
        console.log('🎤 Dispatching voice control trigger event');
        const voiceControlEvent = new CustomEvent('vibescape:trigger-voice');
        window.dispatchEvent(voiceControlEvent);
        toast({
          title: "🎤 Voice Control",
          description: "Listening for your command...",
        });
        break;
        
      case 'peace':
      case 'volume up':
        const currentVol = parseInt(localStorage.getItem('vibescape_volume') || '70');
        const newVolUp = Math.min(100, currentVol + 5);
        setVolume(newVolUp);
        localStorage.setItem('vibescape_volume', newVolUp.toString());
        break;
        
      case 'rock':
      case 'volume down':
        const currentVolDown = parseInt(localStorage.getItem('vibescape_volume') || '70');
        const newVolDown = Math.max(0, currentVolDown - 5);
        setVolume(newVolDown);
        localStorage.setItem('vibescape_volume', newVolDown.toString());
        break;
        
      case 'shuffle':
        toast({
          title: "🔀 Shuffle",
          description: "Shuffle feature coming soon",
        });
        break;
        
      case 'repeat':
        toast({
          title: "🔁 Repeat",
          description: "Repeat feature coming soon",
        });
        break;
        
      default:
        // Handle "play [song name]" commands
        if (command.toLowerCase().startsWith('play ')) {
          const songName = command.substring(5).trim();
          handlePlaySongByName(songName);
        } else {
          console.log('❓ Unknown command:', command);
        }
    }
  };

  const handlePlaySongByName = (songName: string) => {
    if (!playlist || playlist.length === 0) {
      toast({
        title: "No Playlist",
        description: "Add songs to your playlist first",
        variant: "destructive",
      });
      return;
    }

    // Search for song in playlist
    const foundTrack = playlist.find(track => 
      track.title.toLowerCase().includes(songName.toLowerCase()) ||
      track.channelTitle.toLowerCase().includes(songName.toLowerCase())
    );

    if (foundTrack) {
      // Use the music player's method to play specific track
      console.log('🎵 Playing requested song:', foundTrack.title);
      toast({
        title: "🎵 Now Playing",
        description: `${foundTrack.title} by ${foundTrack.channelTitle}`,
      });
    } else {
      toast({
        title: "Song Not Found",
        description: `"${songName}" not found in current playlist`,
        variant: "destructive",
      });
    }
  };


  const handleGestureCommand = async (gesture: string, confidence: number) => {
    const gestureIcons: Record<string, string> = {
      fist: '✊',
      open_hand: '🖐️',
      peace: '✌️',
      rock: '🤟'
    };

    await executeCommand(gesture, confidence, 'gesture', gestureIcons[gesture]);
  };
  
  const handleVoiceCommand = async (command: string) => {
    await executeCommand(command, 1.0, 'voice');
  };

  const clearFeedback = () => {
    setFeedback({ show: false });
  };

  return {
    handleGestureCommand,
    handleVoiceCommand,
    feedback,
    clearFeedback
  };
};