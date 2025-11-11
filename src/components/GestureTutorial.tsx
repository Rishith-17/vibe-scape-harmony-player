import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GestureTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureTutorial: React.FC<GestureTutorialProps> = ({ isOpen, onClose }) => {
  const gestures = [
    {
      emoji: '✊',
      name: 'Closed Fist',
      action: 'Stop',
      description: 'Make a closed fist to stop music playback'
    },
    {
      emoji: '🖐️',
      name: 'Open Hand',
      action: 'Play / Resume',
      description: 'All five fingers spread wide to play or resume'
    },
    {
      emoji: '🤙',
      name: 'Call Me',
      action: 'Voice Control',
      description: 'Thumb and pinky extended to activate voice assistant'
    },
    {
      emoji: '👍',
      name: 'Thumbs Up',
      action: 'Navigation',
      description: 'Thumb up to cycle through pages or go to favorite'
    },
    {
      emoji: '✌️',
      name: 'Peace Sign',
      action: 'Volume Up',
      description: 'Index and middle finger up, others down'
    },
    {
      emoji: '🤟',
      name: 'Rock Sign',
      action: 'Volume Down',
      description: 'Index finger and pinky up, thumb out'
    },
    {
      emoji: '👏',
      name: 'Double Clap',
      action: 'Voice Control',
      description: 'Clap twice quickly to activate voice assistant'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>🤚 Gesture Controls</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use these hand gestures and double clap to control music and activate voice commands:
          </p>
          
          <div className="space-y-3">
            {gestures.map((gesture, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl flex-shrink-0 w-8 text-center">
                  {gesture.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{gesture.name}</h4>
                    <span className="text-xs text-primary font-medium">{gesture.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{gesture.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>💡 Tips:</strong> Hold gestures for 1 second • Keep hand visible to camera • Works best in good lighting
            </p>
          </div>
          
          <Button onClick={onClose} className="w-full">
            Got it! Start Using Gestures
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};