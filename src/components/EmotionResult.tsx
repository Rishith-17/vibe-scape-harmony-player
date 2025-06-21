import React from 'react';

interface Emotion {
  label: string;
  score: number;
}

interface EmotionResultProps {
  emotions: Emotion[];
}

const EmotionResult: React.FC<EmotionResultProps> = ({ emotions }) => {
  return (
    <div className="space-y-4">
      {emotions.map((emotion, index) => (
        <div
          key={index}
          className="flex justify-between items-center bg-white/10 text-white p-3 rounded-lg shadow-md"
        >
          <span className="capitalize font-semibold">{emotion.label}</span>
          <span className="text-sm">{(emotion.score * 100).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export default EmotionResult;