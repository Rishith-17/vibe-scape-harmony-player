
import { Play, Pause, Volume2 } from 'lucide-react';
import { ReactNode } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  language?: string;
  category?: string;
}

interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface EnhancedRecommendationSectionProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  gradient?: string;
}

const EnhancedRecommendationSection = ({ 
  title, 
  subtitle, 
  icon,
  songs, 
  onPlaySong, 
  currentTrack, 
  isPlaying,
  gradient = "from-gray-500/20 to-gray-600/20"
}: EnhancedRecommendationSectionProps) => {
  const isCurrentlyPlaying = (song: Song) => {
    return currentTrack?.id === song.id && isPlaying;
  };

  return (
    <div className="mb-12 animate-fade-in">
      <div className={`mb-6 p-6 rounded-2xl bg-gradient-to-r ${gradient} backdrop-blur-lg border border-white/10`}>
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-gray-300 text-base">{subtitle}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {songs.map((song, index) => (
          <div
            key={`${song.id}-${index}`}
            className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl p-4 hover:from-gray-700/50 hover:to-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg border border-gray-700/30 hover:border-gray-600/50"
            onClick={() => onPlaySong(song)}
          >
            {/* 3D Card Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl transform translate-y-2"></div>
            
            {/* Thumbnail Container with 3D Effect */}
            <div className="relative mb-4 overflow-hidden rounded-xl shadow-2xl">
              <img
                src={song.thumbnail}
                alt={song.title}
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/480x360/1a1a1a/ffffff?text=♪";
                }}
              />
              
              {/* Audio-Only Indicator */}
              <div className="absolute top-2 left-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                <Volume2 size={12} className="text-green-400" />
                <span className="text-xs text-white font-medium">Audio</span>
              </div>
              
              {/* Play/Pause Overlay with 3D Effect */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full p-4 shadow-2xl transform scale-90 group-hover:scale-100 transition-all duration-200 hover:shadow-green-500/50">
                  {isCurrentlyPlaying(song) ? (
                    <Pause size={24} className="text-white" />
                  ) : (
                    <Play size={24} className="text-white ml-1" />
                  )}
                </div>
              </div>

              {/* Currently Playing Indicator */}
              {isCurrentlyPlaying(song) && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 rounded-full p-2 shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Category Badge */}
              {song.category && (
                <div className="absolute bottom-2 right-2 bg-purple-600/90 rounded-full px-2 py-1">
                  <span className="text-xs text-white font-medium">{song.category}</span>
                </div>
              )}
            </div>

            {/* Song Info with Enhanced Typography */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-green-400 transition-colors leading-tight">
                {song.title}
              </h3>
              <p className="text-gray-400 text-xs line-clamp-1 group-hover:text-gray-300 transition-colors">
                {song.artist}
              </p>
              {song.language && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-700/50 rounded-full px-2 py-1">
                    {song.language}
                  </span>
                </div>
              )}
            </div>

            {/* 3D Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-20 blur-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedRecommendationSection;
