
interface PlaylistCardProps {
  title: string;
  description: string;
  gradient: string;
  textColor?: string;
}

const PlaylistCard = ({ title, description, gradient, textColor = 'text-gray-800' }: PlaylistCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div
        className={`${gradient} rounded-2xl p-6 h-48 mb-4 transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 relative overflow-hidden`}
        style={{
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/30 animate-pulse" />
          <div className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-white/20 animate-pulse delay-500" />
          <div className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-white/25 animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 h-full flex items-end">
          <div>
            <h3 className={`text-2xl font-bold ${textColor} mb-2`}>{title}</h3>
          </div>
        </div>
      </div>
      
      <div className="px-2">
        <h4 className="text-white font-semibold text-lg mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;
