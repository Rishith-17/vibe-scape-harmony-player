import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

interface TestGestureControllerProps {
  enabled: boolean;
}

export const TestGestureController: React.FC<TestGestureControllerProps> = ({ enabled }) => {
  const [status] = useState('Test Mode Active');
  const { togglePlayPause, skipNext, skipPrevious, setVolume } = useMusicPlayer();
  const { toast } = useToast();
  const [currentVolume, setCurrentVolume] = useState(70);
  
  const handleGesture = (gestureType: string) => {
    console.log('🎯 Test gesture:', gestureType);
    
    switch (gestureType) {
      case 'fist':
        if (togglePlayPause) {
          togglePlayPause();
        }
        toast({
          title: "🎵 Test Gesture",
          description: "✊ Stop (Key: 1)",
        });
        break;
        
      case 'open_hand':
        if (togglePlayPause) {
          togglePlayPause();
        }
        toast({
          title: "🎵 Test Gesture",
          description: "🖐️ Play/Resume (Key: 2)",
        });
        break;
        
      case 'call_me':
        toast({
          title: "🎵 Test Gesture",
          description: "🤙 Voice Control (Key: 3)",
        });
        break;
        
      case 'peace':
        const newVolumeUp = Math.min(100, currentVolume + 10);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        toast({
          title: "🎵 Test Gesture",
          description: `✌️ Volume up: ${newVolumeUp}% (Key: 5)`,
        });
        break;
        
      case 'rock':
        const newVolumeDown = Math.max(0, currentVolume - 10);
        setCurrentVolume(newVolumeDown);
        setVolume(newVolumeDown);
        toast({
          title: "🎵 Test Gesture",
          description: `🤟 Volume down: ${newVolumeDown}% (Key: 6)`,
        });
        break;
    }
  };
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      switch(event.key) {
        case '1': handleGesture('fist'); break;
        case '2': handleGesture('open_hand'); break;
        case '3': handleGesture('call_me'); break;
        case '4': handleGesture('peace'); break;
        case '5': handleGesture('rock'); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, handleGesture]);
  
  if (!enabled) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-3 max-w-xs">
      <div className="text-sm font-medium text-yellow-800">⚠️ {status}</div>
      <div className="text-xs text-yellow-700 mt-1">
        Test with keyboard: 1=✊ 2=🖐️ 3=🤙 4=✌️ 5=🤟
      </div>
      <div className="text-xs text-yellow-600 mt-1">
        Camera gesture detection will replace this when ready
      </div>
    </div>
  );
};