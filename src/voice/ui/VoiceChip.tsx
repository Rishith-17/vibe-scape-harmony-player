import React from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { VoiceState } from '../types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceChipProps {
  state: VoiceState;
  onClick?: () => void;
  onManualTrigger?: () => void;
}

export const VoiceChip: React.FC<VoiceChipProps> = ({ state, onClick, onManualTrigger }) => {
  const isMobile = useIsMobile();

  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-5 h-5 animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'speaking':
        return <Mic className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Mic className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-green-500 hover:bg-green-600 shadow-green-500/50';
      case 'processing':
        return 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/50';
      case 'speaking':
        return 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/50';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 shadow-red-500/50';
      default:
        return 'bg-primary hover:bg-primary/90 shadow-primary/50';
    }
  };

  const getText = () => {
    if (isMobile) {
      switch (state) {
        case 'listening':
          return 'Listening...';
        case 'processing':
          return 'Processing...';
        case 'speaking':
          return 'Speaking...';
        case 'error':
          return 'Try Again';
        default:
          return 'Tap to Speak';
      }
    }

    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return 'Error';
      default:
        return 'Say "Hey Vibe"';
    }
  };

  const handleClick = () => {
    if (isMobile && onManualTrigger) {
      // On mobile, use push-to-talk
      onManualTrigger();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'fixed bottom-24 right-4 z-50',
        'flex items-center gap-2 px-5 py-3 rounded-full',
        'text-white text-sm font-medium',
        'shadow-lg transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isMobile && 'px-6 py-4 text-base shadow-xl',
        getColor()
      )}
      aria-label={getText()}
    >
      {getIcon()}
      <span className="font-semibold">{getText()}</span>
    </button>
  );
};
