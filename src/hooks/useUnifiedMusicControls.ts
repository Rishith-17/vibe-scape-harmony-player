import { useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/voice/commandRunner';
import { musicController } from '@/controllers/MusicControllerImpl';

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

    // Execute the command - EXACT 4-gesture mapping
    switch (command.toLowerCase()) {
      case 'open_hand':
        // 🤚 Open Hand → Activate THE SAME mic instance as Tap-Mic button
        console.log('🤚 Open hand detected - activating EXACT SAME mic as Tap-Mic');
        
        // This triggers voiceController.manualTrigger() - the SAME function Tap-Mic uses
        const voiceEvent = new CustomEvent('vibescape:trigger-voice');
        window.dispatchEvent(voiceEvent);
        
        toast({
          title: "🎤 Voice Control (Gesture)",
          description: "Same mic as Tap-Mic activated!",
        });
        break;
        
      case 'fist':
        // ✊ Fist → Toggle Play/Pause on active music player
        console.log('✊ Fist detected - toggling play/pause on current player');
        
        try {
          // Use the MusicPlayerContext directly - it controls the actual player
          console.log('✊ Current player state:', isPlaying ? 'Playing' : 'Paused');
          
          // Simply toggle using the context's togglePlayPause
          togglePlayPause();
          
          toast({
            title: isPlaying ? "⏸️ Paused" : "▶️ Playing",
            description: isPlaying ? "Playback paused" : (currentTrack?.title || "Music resumed"),
          });
          
          console.log('✊ Fist action completed:', !isPlaying ? 'Now Playing' : 'Now Paused');
        } catch (error) {
          console.error('✊ Fist gesture error:', error);
          toast({
            title: "No Music",
            description: "Play a song first",
            variant: "destructive",
          });
        }
        break;
        
      case 'rock':
        // 🤘 Rock → Volume Down (-10)
        console.log('🤘 Rock hand detected - volume down');
        musicController.adjustVolume(-10);
        toast({
          title: "🔉 Volume Down",
          description: "Volume decreased by 10%",
        });
        break;
        
      case 'peace':
        // ✌️ Peace → Volume Up (+10)
        console.log('✌️ Peace hand detected - volume up');
        musicController.adjustVolume(+10);
        toast({
          title: "🔊 Volume Up",
          description: "Volume increased by 10%",
        });
        break;
      
      // Voice commands (not gesture-triggered)
      case 'play':
      case 'resume':
        if (!isPlaying && (currentTrack || playlist.length > 0)) {
          togglePlayPause();
          toast({
            title: "▶️ Playing",
            description: currentTrack?.title || "Music resumed",
          });
        }
        break;
      
      case 'pause':
      case 'stop':
        if (isPlaying) {
          togglePlayPause();
          toast({
            title: "⏸️ Paused",
            description: "Playback paused",
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
    // Only allow the 4 specified gestures
    const allowedGestures = ['open_hand', 'fist', 'rock', 'peace'];
    if (!allowedGestures.includes(gesture)) {
      console.log('🚫 Gesture not in allowed list:', gesture);
      return;
    }

    const gestureIcons: Record<string, string> = {
      open_hand: '🤚',
      fist: '✊',
      rock: '🤘',
      peace: '✌️'
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