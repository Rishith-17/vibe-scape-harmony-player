/**
 * Gesture Debug Overlay
 * Dev-only overlay showing gesture detection state
 */

import React from 'react';

interface GestureDebugInfo {
  palmY: number;
  palmX: number;
  scrollVelocity: number;
  scrollDirection: string | null;
  scrollCooldown: number;
  swipeVelocity: number;
  swipeDirection: string | null;
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
  hoveredElement: string | null;
  hoverProgress: number;
  lastGesture: string | null;
  fps: number;
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
    <div className="fixed top-20 right-4 z-[9998] bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg border border-green-500/30 min-w-[220px]">
      <div className="text-green-300 font-bold mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Gesture Debug
      </div>
      
      <div className="space-y-1">
        <div className="text-gray-400">── Scroll ──</div>
        <div>palmY: {debugInfo.palmY.toFixed(3)}</div>
        <div>velocity: {debugInfo.scrollVelocity.toFixed(4)}</div>
        <div>direction: {debugInfo.scrollDirection || 'none'}</div>
        <div>cooldown: {debugInfo.scrollCooldown}ms</div>
        
        <div className="text-gray-400 mt-2">── Swipe ──</div>
        <div>palmX: {debugInfo.palmX.toFixed(3)}</div>
        <div>velocity: {debugInfo.swipeVelocity.toFixed(4)}</div>
        <div>direction: {debugInfo.swipeDirection || 'none'}</div>
        
        <div className="text-gray-400 mt-2">── Cursor ──</div>
        <div>pos: ({debugInfo.cursorX.toFixed(0)}, {debugInfo.cursorY.toFixed(0)})</div>
        <div>pinching: {debugInfo.isPinching ? '✓' : '✗'}</div>
        <div>hover: {debugInfo.hoveredElement || 'none'}</div>
        <div>hoverProg: {(debugInfo.hoverProgress * 100).toFixed(0)}%</div>
        
        <div className="text-gray-400 mt-2">── Status ──</div>
        <div>lastGesture: {debugInfo.lastGesture || 'none'}</div>
        <div>fps: {debugInfo.fps}</div>
      </div>
    </div>
  );
};

export default GestureDebugOverlay;
