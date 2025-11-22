import React from 'react';
import { motion } from 'framer-motion';
import { X, Info } from 'lucide-react';

interface SongInfoCardProps {
  info: string;
  onClose: () => void;
}

/**
 * SongInfoCard - Displays Gemini's song information response
 * Appears below mini-player with cyberpunk aesthetic
 */
export const SongInfoCard: React.FC<SongInfoCardProps> = ({ info, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
    >
      <div className="relative bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 p-4">
        {/* Neon glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl -z-10" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Song Information</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-foreground/90 leading-relaxed">
          {info}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-b-2xl" />
      </div>
    </motion.div>
  );
};
