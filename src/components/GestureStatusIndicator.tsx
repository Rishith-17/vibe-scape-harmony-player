import React from 'react';
import { Camera, Hand, Zap } from 'lucide-react';

interface GestureStatusIndicatorProps {
  isEnabled: boolean;
  isInitialized: boolean;
  isDetecting: boolean;
  lastGesture: string | null;
}

export const GestureStatusIndicator: React.FC<GestureStatusIndicatorProps> = ({
  isEnabled,
  isInitialized,
  isDetecting,
  lastGesture
}) => {
  if (!isEnabled) return null;

  const getStatusColor = () => {
    if (isDetecting) return 'text-green-400';
    if (isInitialized) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (isDetecting) return 'Active';
    if (isInitialized) return 'Ready';
    return 'Initializing...';
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 text-sm">
      <div className="flex items-center gap-2">
        <Camera size={16} className={getStatusColor()} />
        <span className="text-white">Gesture Detection:</span>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      
      {lastGesture && (
        <div className="flex items-center gap-1 ml-2 border-l border-gray-600 pl-2">
          <Hand size={14} className="text-blue-400" />
          <span className="text-blue-400 text-xs">{lastGesture.replace('_', ' ')}</span>
        </div>
      )}
      
      {isDetecting && (
        <Zap size={12} className="text-green-400 animate-pulse" />
      )}
    </div>
  );
};