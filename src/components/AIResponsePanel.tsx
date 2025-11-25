import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface AIResponsePanelProps {
  isVisible: boolean;
  response: string;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * AI Response Panel - Shows Flamingo's audio analysis
 * Neon-themed panel matching the main UI design
 */
export const AIResponsePanel: React.FC<AIResponsePanelProps> = ({
  isVisible,
  response,
  isLoading,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-50"
        >
          <div
            className="bg-slate-900/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl"
            style={{
              border: '2px solid hsl(180 100% 50%)',
              boxShadow: '0 0 30px hsl(180 100% 50% / 0.4), inset 0 0 20px hsl(180 100% 50% / 0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-cyan-400">AI Audio Analysis</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close AI panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="min-h-[80px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-cyan-400"
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  <p className="ml-3 text-gray-300">AI analyzing audio...</p>
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-200 leading-relaxed"
                >
                  {response}
                </motion.p>
              )}
            </div>

            {/* Glowing bottom accent */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(180 100% 50%), transparent)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
