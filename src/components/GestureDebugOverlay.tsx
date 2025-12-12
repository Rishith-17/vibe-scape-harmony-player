/**
 * Gesture Debug Overlay
 * Simplified debug info for point-to-click gesture only
 */

import React from 'react';

interface GestureDebugInfo {
  palmX: number;
  palmY: number;
  isPointing: boolean;
  lastGesture: string | null;
}

interface GestureDebugOverlayProps {
  debugInfo: GestureDebugInfo;
  isVisible: boolean;
}

export const GestureDebugOverlay: React.FC<GestureDebugOverlayProps> = ({
  debugInfo,
  isVisible,
}) => {
  if (!isVisible || import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[9998] bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg border border-green-500/30 min-w-[180px]">
      <div className="text-green-300 font-bold mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Gesture Debug
      </div>
      
      <div className="space-y-1">
        <div>Palm: ({debugInfo.palmX.toFixed(2)}, {debugInfo.palmY.toFixed(2)})</div>
        <div>Pointing: {debugInfo.isPointing ? '👆 Yes' : 'No'}</div>
        <div className="text-yellow-400">Last: {debugInfo.lastGesture || 'none'}</div>
      </div>
    </div>
  );
};

export default GestureDebugOverlay;
