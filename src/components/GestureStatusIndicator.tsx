import React from 'react';
import { Camera, Hand, Zap, Loader2, AlertCircle } from 'lucide-react';

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
    return 'text-blue-400'; // Initializing
  };

  const getStatusText = () => {
    if (isDetecting) return 'Detecting';
    if (isInitialized) return 'Ready';
    return 'Starting...';
  };

  const getStatusIcon = () => {
    if (isDetecting) return <Zap size={16} className={getStatusColor()} />;
    if (isInitialized) return <Camera size={16} className={getStatusColor()} />;
    return <Loader2 size={16} className="text-blue-400 animate-spin" />;
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-2 text-sm max-w-xs min-w-max">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-white font-medium">Gestures:</span>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      
      {lastGesture && isInitialized && (
        <div className="flex items-center gap-2 bg-green-900/30 px-2 py-1 rounded">
          <Hand size={12} className="text-green-400" />
          <span className="text-green-400 text-xs font-bold">
            {lastGesture.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}
      
      {!isInitialized && isEnabled && (
        <div className="bg-blue-900/30 px-2 py-1 rounded">
          <span className="text-blue-400 text-xs">
            {isDetecting ? 'Loading AI model...' : 'Requesting camera...'}
          </span>
        </div>
      )}
      
      {isInitialized && !isDetecting && (
        <div className="text-gray-400 text-xs text-center">
          Show hand gestures to control music
        </div>
      )}
    </div>
  );
};