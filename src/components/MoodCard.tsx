
import { ReactNode } from 'react';

interface MoodCardProps {
  emoji: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}

const MoodCard = ({ emoji, label, icon, onClick, isSelected }: MoodCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 group ${
        isSelected
          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50'
          : 'bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700'
      } backdrop-blur-sm`}
      style={{
        boxShadow: isSelected
          ? '0 20px 40px rgba(255, 193, 7, 0.3)'
          : '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="text-center">
        <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
          {icon || emoji}
        </div>
        <h3 className="text-white font-semibold text-lg">{label}</h3>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse" />
        <div className="absolute top-4 right-2 w-1 h-1 bg-blue-400/40 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse delay-700" />
      </div>
    </div>
  );
};

export default MoodCard;
