import { Play, Pause } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface RecommendationSectionProps {
  title: string;
  subtitle: string;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

// Neon colors for thumbnail borders - cycling through different colors
const thumbnailBorderColors = [
  'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]',    // neon blue/cyan
  'border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.6)]', // neon purple
  'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]',  // neon yellow
  'border-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]',    // neon teal
  'border-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.6)]',  // neon orange
  'border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]',   // neon green
];

const RecommendationSection = ({ 
  title, 
  subtitle, 
  songs, 
  onPlaySong, 
  currentTrack, 
  isPlaying 
}: RecommendationSectionProps) => {
  const isCurrentlyPlaying = (song: Song) => {
    return currentTrack?.id === song.id && isPlaying;
  };

  return (
    <div className="mb-8 sm:mb-12 animate-fade-in w-full overflow-hidden">
      <div className="mb-4 sm:mb-6 px-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 truncate">{title}</h2>
        <p className="text-gray-400 text-sm md:text-base line-clamp-2">{subtitle}</p>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide w-full">
        <div className="flex space-x-3 sm:space-x-4 pb-4 min-w-max px-2">
          {songs.map((song, index) => {
            const thumbnailColor = thumbnailBorderColors[index % thumbnailBorderColors.length];
            
            return (
              <div
                key={`${song.id}-${index}`}
                className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg border-2 border-pink-500/60 hover:border-pink-400 w-40 sm:w-48 flex-shrink-0"
                style={{
                  boxShadow: '0 0 20px rgba(236, 72, 153, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
                onClick={() => onPlaySong(song)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.5), 0 12px 40px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4)';
                }}
              >
                {/* Thumbnail Container with colorful neon border */}
                <div className={`relative mb-3 sm:mb-4 overflow-hidden rounded-xl border-2 ${thumbnailColor}`}>
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-28 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/480x360/1a1a1a/ffffff?text=♪";
                    }}
                  />
                  
                  {/* Play/Pause Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-pink-500 rounded-full p-2 sm:p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200"
                      style={{ boxShadow: '0 0 15px rgba(236, 72, 153, 0.6)' }}>
                      {isCurrentlyPlaying(song) ? (
                        <Pause size={16} className="sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <Play size={16} className="sm:w-5 sm:h-5 text-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Currently Playing Indicator */}
                  {isCurrentlyPlaying(song) && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-pink-500 rounded-full p-1" style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="space-y-1 sm:space-y-2 min-w-0">
                  <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-pink-400 transition-colors leading-tight min-w-0">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-1 group-hover:text-gray-300 transition-colors min-w-0">
                    {song.artist}
                  </p>
                </div>

                {/* 3D Effect Shadow - Neon Pink */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl transform translate-y-2"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecommendationSection;
