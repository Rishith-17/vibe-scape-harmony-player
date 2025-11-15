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
      emoji: '🖐️',
      name: 'Open Hand',
      action: 'Start Voice Control',
      description: 'All 5 fingers extended - starts mic (same as Tap-Mic)'
    },
    {
      emoji: '✊',
      name: 'Fist',
      action: 'Play/Pause Toggle',
      description: 'All fingers closed - toggles between play and pause'
    },
    {
      emoji: '🤘',
      name: 'Rock Hand',
      action: 'Volume Down',
      description: 'Index and pinky up - decreases volume by 10%'
    },
    {
      emoji: '✌️',
      name: 'Peace Sign',
      action: 'Volume Up',
      description: 'Index and middle finger up - increases volume by 10%'
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
            Control your music using these 4 hand gestures. Hold gestures clearly for best detection:
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
              <strong>💡 Tips:</strong> Hold gestures clearly for 250ms • Keep hand visible • Good lighting helps • Open Hand uses same mic as Tap-Mic button • Wake word "Hello Vibe" or double clap 👏👏 also activates voice
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