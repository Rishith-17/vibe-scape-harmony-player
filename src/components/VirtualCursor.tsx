/**
 * Virtual Cursor Component
 * Displays cursor position for gesture click-to-play
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorPosition } from '@/gestures/clickGestureUtils';

interface VirtualCursorProps {
  position: CursorPosition | null;
  isVisible: boolean;
  isPinching: boolean;
  hoverProgress: number;
  hoveredElement: Element | null;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({
  position,
  isVisible,
  isPinching,
  hoverProgress,
  hoveredElement,
}) => {
  if (!isVisible || !position) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="virtual-cursor"
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: isPinching ? 0.8 : 1,
        }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.1 }}
      >
        {/* Main cursor dot */}
        <div 
          className={`
            w-6 h-6 rounded-full border-2 
            ${isPinching 
              ? 'bg-green-500/50 border-green-400' 
              : hoveredElement 
                ? 'bg-cyan-500/30 border-cyan-400' 
                : 'bg-white/20 border-white/50'
            }
            transition-colors duration-150
          `}
        />
        
        {/* Hover progress ring */}
        {hoveredElement && hoverProgress > 0 && (
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10"
            viewBox="0 0 36 36"
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-cyan-500/30"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${hoverProgress * 100} 100`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              className="text-cyan-400"
            />
          </svg>
        )}
        
        {/* Click indicator */}
        {isPinching && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-400/30"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VirtualCursor;
