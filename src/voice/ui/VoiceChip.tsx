import React from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { VoiceState } from '../types';
import { cn } from '@/lib/utils';

interface VoiceChipProps {
  state: VoiceState;
  onClick?: () => void;
}

export const VoiceChip: React.FC<VoiceChipProps> = ({ state, onClick }) => {
  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-4 h-4 animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'speaking':
        return <Mic className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MicOff className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-green-500 hover:bg-green-600';
      case 'processing':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'speaking':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-muted hover:bg-muted/80';
    }
  };

  const getText = () => {
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

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-4 z-50',
        'flex items-center gap-2 px-4 py-2 rounded-full',
        'text-white text-sm font-medium',
        'shadow-lg transition-all duration-200',
        'hover:scale-105 active:scale-95',
        getColor()
      )}
    >
      {getIcon()}
      <span>{getText()}</span>
    </button>
  );
};
