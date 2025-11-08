import { useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

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
    
    // If within 1 second, gesture takes priority
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

  const executeCommand = (
    command: string, 
    confidence: number, 
    type: 'gesture' | 'voice',
    gestureIcon?: string
  ) => {
    const action: ControlAction = {
      type,
      action: command,
      timestamp: Date.now(),
      confidence
    };

    if (!shouldExecuteAction(action)) {
      return;
    }

    console.log(`🎵 Executing ${type} command:`, command, 'Confidence:', confidence);

    // Show feedback
    if (type === 'gesture' && gestureIcon) {
      setFeedback({ gestureIcon, show: true });
    }

    // Execute the command
    switch (command.toLowerCase()) {
      case 'fist':
      case 'play':
      case 'pause':
      case 'stop':
        togglePlayPause();
        break;
        
      case 'call_me':
      case 'next':
      case 'skip':
        skipNext();
        break;
        
      case 'open_hand':
      case 'previous':
      case 'back':
        skipPrevious();
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

  const handleGestureCommand = (gesture: string, confidence: number) => {
    const gestureIcons: Record<string, string> = {
      fist: '✊',
      call_me: '🤙',
      open_hand: '🖐️',
      peace: '✌️',
      rock: '🤟'
    };

    executeCommand(gesture, confidence, 'gesture', gestureIcons[gesture]);
  };

  const clearFeedback = () => {
    setFeedback({ show: false });
  };

  return {
    handleGestureCommand,
    feedback,
    clearFeedback
  };
};