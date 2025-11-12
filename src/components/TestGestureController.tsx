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
          description: "✊ Toggle Play/Pause (Key: F)",
        });
        break;
        
      case 'open_hand':
        toast({
          title: "🎵 Test Gesture",
          description: "🖐️ Voice Control (Key: O)",
        });
        // Dispatch voice control event
        const voiceEvent = new CustomEvent('vibescape:trigger-voice');
        window.dispatchEvent(voiceEvent);
        break;
        
      case 'peace':
        const newVolumeUp = Math.min(100, currentVolume + 5);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        toast({
          title: "🎵 Test Gesture",
          description: `✌️ Volume up: ${newVolumeUp}% (Key: P)`,
        });
        break;
        
      case 'rock':
        const newVolumeDown = Math.max(0, currentVolume - 5);
        setCurrentVolume(newVolumeDown);
        setVolume(newVolumeDown);
        toast({
          title: "🎵 Test Gesture",
          description: `🤟 Volume down: ${newVolumeDown}% (Key: R)`,
        });
        break;
    }
  };
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      switch(event.key.toLowerCase()) {
        case 'f': handleGesture('fist'); break;
        case 'o': handleGesture('open_hand'); break;
        case 'p': handleGesture('peace'); break;
        case 'r': handleGesture('rock'); break;
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
        Test with keyboard: F=✊ O=🖐️ P=✌️ R=🤟
      </div>
      <div className="text-xs text-yellow-600 mt-1">
        Camera gesture detection will replace this when ready
      </div>
    </div>
  );
};