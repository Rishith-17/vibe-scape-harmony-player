import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AIResponsePanelProps {
  isVisible: boolean;
  response: string;
  isLoading: boolean;
  onClose: () => void;
  mode?: 'analysis' | 'lyrics';
  onModeChange?: (mode: 'analysis' | 'lyrics') => void;
}

/**
 * Animated Text Display - Shows words one by one with smooth animation
 */
function AnimatedText({ text }: { text: string }) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  
  // Split text into words and whitespace, preserving structure
  const words = useMemo(() => {
    return text.split(/(\s+)/).filter(word => word.length > 0);
  }, [text]);

  useEffect(() => {
    setDisplayedWords([]);
    
    if (words.length === 0) return;

    // Animate words in sequence
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedWords(prev => [...prev, words[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Faster animation

    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className="leading-relaxed">
      {displayedWords.map((word, index) => {
        // Check if this is whitespace
        const isWhitespace = /^\s+$/.test(word);
        
        if (isWhitespace) {
          // Render whitespace as actual space
          return <span key={index}>{word}</span>;
        }
        
        return (
          <motion.span
            key={`${word}-${index}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="inline"
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

/**
 * AI Response Panel - Shows Flamingo's audio analysis
 * Neon-themed panel with word-by-word animation and scrolling
 */
export function AIResponsePanel({
  isVisible,
  response,
  isLoading,
  onClose,
  mode = 'analysis',
  onModeChange,
}: AIResponsePanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 right-4 bottom-28 w-[90vw] max-w-[500px] z-50"
        >
          <div
            className="h-full bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col"
            style={{
              border: '2px solid hsl(180 100% 50%)',
              boxShadow: '0 0 30px hsl(180 100% 50% / 0.4), inset 0 0 20px hsl(180 100% 50% / 0.1)',
            }}
          >
            {/* Header */}
            <div className="flex flex-col border-b border-cyan-400/30">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  <h3 className="font-semibold text-cyan-400">
                    {mode === 'lyrics' ? 'Song Lyrics' : 'AI Song Analysis'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Close AI panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mode Toggle */}
              {onModeChange && (
                <div className="flex gap-2 px-4 pb-3">
                  <button
                    onClick={() => onModeChange('analysis')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === 'analysis'
                        ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-gray-300'
                    }`}
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => onModeChange('lyrics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === 'lyrics'
                        ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-gray-300'
                    }`}
                  >
                    Lyrics
                  </button>
                </div>
              )}
            </div>

            {/* Content with ScrollArea */}
            <ScrollArea className="flex-1 p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-cyan-400 mb-4"
                  >
                    <Sparkles className="w-12 h-12" />
                  </motion.div>
                  <motion.p
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-gray-300 text-center"
                  >
                    AI analyzing song...
                  </motion.p>
                </div>
              ) : (
                <div className="text-gray-200 text-base whitespace-pre-wrap">
                  <AnimatedText text={response} />
                </div>
              )}
            </ScrollArea>

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
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(180 100% 50%), transparent)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
