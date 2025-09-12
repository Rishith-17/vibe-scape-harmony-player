import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ControlFeedbackProps {
  gestureIcon?: string;
  voiceText?: string;
  show: boolean;
  onComplete: () => void;
}

export const ControlFeedback: React.FC<ControlFeedbackProps> = ({
  gestureIcon,
  voiceText,
  show,
  onComplete
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !visible) return null;

  return (
    <div className={cn(
      "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
      "bg-background/90 backdrop-blur-sm border rounded-lg p-6 shadow-lg",
      "transition-all duration-300 ease-out",
      visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
    )}>
      {gestureIcon && (
        <div className="text-center">
          <div className="text-6xl mb-2 animate-pulse">
            {gestureIcon}
          </div>
          <p className="text-sm text-muted-foreground">Gesture Control</p>
        </div>
      )}
      
      {voiceText && (
        <div className="text-center">
          <div className="text-2xl mb-2 font-medium text-primary">
            🎤
          </div>
          <p className="text-lg font-medium capitalize">{voiceText}</p>
          <p className="text-sm text-muted-foreground">Voice Command</p>
        </div>
      )}
    </div>
  );
};