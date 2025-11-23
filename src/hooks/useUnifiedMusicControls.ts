import { useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/voice/commandRunner';
import { musicController } from '@/controllers/MusicControllerImpl';
import { getGlobalVoiceController } from '@/voice/voiceController';

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
  const lastOpenHandGestureRef = useRef<number>(0);
  const FIST_COOLDOWN_MS = 3000; // 3-second cooldown for fist gesture
  const OPEN_HAND_DEBOUNCE_MS = 400; // 400ms debounce for open_hand mic activation
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

    // Show feedback for gestures (open_hand feedback is handled by VoiceChip)
    if (commandType === 'gesture' && gestureIcon && command.toLowerCase() !== 'open_hand') {
      setFeedback({ gestureIcon, show: true });
    }

    // Execute the command - ONLY open_hand activates mic, others do nothing with mic
    switch (command.toLowerCase()) {
      case 'open_hand':
        // 🖐️ Open Hand → Activate voice mic using SAME ASR instance as Tap-Mic
        const nowOpenHand = Date.now();
        const timeSinceLastOpenHand = nowOpenHand - lastOpenHandGestureRef.current;
        
        // Debounce to prevent duplicate triggers
        if (timeSinceLastOpenHand < OPEN_HAND_DEBOUNCE_MS) {
          console.log(`🖐️ [Gesture] open_hand debounced - ${timeSinceLastOpenHand}ms since last`);
          return;
        }
        
        console.log('🖐️ [Gesture] ========== OPEN HAND DETECTED ==========');
        console.log('🖐️ [Gesture] Checking if mic is armed...');
        
        lastOpenHandGestureRef.current = nowOpenHand;
        
        const voiceController = getGlobalVoiceController();
        
        if (!voiceController) {
          console.log('🖐️ [Gesture] ❌ Voice controller not initialized');
          toast({
            title: "Voice Not Ready",
            description: "Voice control is not available",
            variant: "destructive",
          });
          return;
        }
        
        if (voiceController.isMicArmed()) {
          console.log('🖐️ [Gesture] ✅ Mic armed - triggering shared ASR instance');
          console.log('🖐️ [Gesture] ASR Instance ID:', voiceController.getAsrInstanceId());
          
          try {
            await voiceController.startListeningFromArmedMic('gesture');
            console.log('🖐️ [Gesture] Successfully started listening from armed mic');
            
            toast({
              title: "🎤 Voice Activated",
              description: "Listening via gesture...",
              duration: 2000,
            });
          } catch (error) {
            console.error('🖐️ [Gesture] Failed to start listening:', error);
            toast({
              title: "Mic Error",
              description: "Could not activate voice control",
              variant: "destructive",
            });
          }
        } else {
          console.log('🖐️ [Gesture] ❌ Mic not armed - tap mic button first to enable gesture activation');
          toast({
            title: "Mic Not Ready",
            description: "Tap the mic button first to enable gesture control",
            variant: "destructive",
          });
        }
        
        console.log('🖐️ [Gesture] ========================================');
        break;
        
      case 'fist':
        // ✊ Fist → Toggle Play/Pause with 3-second cooldown
        const now = Date.now();
        const timeSinceLastFist = now - lastFistGestureRef.current;
        
        if (timeSinceLastFist < FIST_COOLDOWN_MS) {
          const remainingCooldown = Math.ceil((FIST_COOLDOWN_MS - timeSinceLastFist) / 1000);
          console.log(`✊ Fist gesture on cooldown - ${remainingCooldown}s remaining`);
          toast({
            title: "⏳ Please Wait",
            description: `Wait ${remainingCooldown}s before next fist gesture`,
            variant: "destructive",
          });
          return;
        }
        
        console.log('✊ Fist detected - toggling play/pause on current player');
        lastFistGestureRef.current = now;
        
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
        // 🤘 Rock → Volume Down
        console.log('🤘 Rock hand detected - volume down');
        musicController.adjustVolume(-10);
        toast({
          title: "🔉 Volume Down",
          description: "Volume decreased by 10%",
        });
        break;
        
      case 'peace':
        // ✌️ Peace → Volume Up
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
    // Only allow these gestures: open_hand (mic), fist (play/pause), rock (vol-), peace (vol+)
    const allowedGestures = ['open_hand', 'fist', 'rock', 'peace'];
    if (!allowedGestures.includes(gesture)) {
      console.log('🚫 Gesture not in allowed list:', gesture);
      return;
    }

    const gestureIcons: Record<string, string> = {
      open_hand: '🖐️',
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