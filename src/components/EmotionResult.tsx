import React, { useEffect } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface Emotion {
  label: string;
  score: number;
}

interface Props {
  emotions: Emotion[];
}

const EmotionResult: React.FC<Props> = ({ emotions }) => {
  const { playEmotionPlaylist } = useMusicPlayer();
  const primaryEmotion = emotions[0]?.label?.toLowerCase();

  // Auto-play emotion playlist when emotion is detected
  useEffect(() => {
    if (primaryEmotion) {
      // Small delay to allow user to see the result first
      const timer = setTimeout(() => {
        playEmotionPlaylist(primaryEmotion);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [primaryEmotion, playEmotionPlaylist]);

  const handlePlayEmotionPlaylist = () => {
    if (primaryEmotion) {
      playEmotionPlaylist(primaryEmotion);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">✨ Detected Emotions</h2>
        {primaryEmotion && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-lg text-gray-200 mb-3">
              Primary emotion: <span className="text-yellow-400 font-semibold capitalize">{primaryEmotion}</span>
            </p>
            <Button
              onClick={handlePlayEmotionPlaylist}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-medium px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Play size={16} className="mr-2" />
              Play {primaryEmotion} Playlist
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">All Detected Emotions:</h3>
        <div className="space-y-2">
          {emotions.map((emotion, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20"
            >
              <span className="text-white capitalize font-medium">{emotion.label}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${emotion.score * 100}%` }}
                  />
                </div>
                <span className="text-yellow-400 font-semibold text-sm min-w-[45px]">
                  {(emotion.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionResult;
