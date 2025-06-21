import React from 'react';

interface Emotion {
  label: string;
  score: number;
}

interface Props {
  emotions: Emotion[];
}

const EmotionResult: React.FC<Props> = ({ emotions }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Detected Emotions:</h2>
      <ul className="space-y-2">
        {emotions.map((emotion, index) => (
          <li key={index} className="flex justify-between border-b pb-2">
            <span>{emotion.label}</span>
            <span>{(emotion.score * 100).toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmotionResult;
