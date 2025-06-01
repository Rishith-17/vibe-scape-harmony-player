
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          {songs.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl p-3 sm:p-4 hover:from-gray-700/50 hover:to-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg border border-gray-700/30 hover:border-gray-600/50 w-40 sm:w-48 flex-shrink-0"
              onClick={() => onPlaySong(song)}
            >
              {/* Thumbnail Container */}
              <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-xl shadow-lg">
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
                  <div className="bg-green-500 rounded-full p-2 sm:p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200">
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
                    <div className="bg-green-500 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="space-y-1 sm:space-y-2 min-w-0">
                <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-green-400 transition-colors leading-tight min-w-0">
                  {song.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-1 group-hover:text-gray-300 transition-colors min-w-0">
                  {song.artist}
                </p>
              </div>

              {/* 3D Effect Shadow */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl transform translate-y-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationSection;
