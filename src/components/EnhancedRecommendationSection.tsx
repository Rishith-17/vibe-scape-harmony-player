import { Play, Pause, Volume2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isCurrentlyPlaying = (song: Song) => {
    return currentTrack?.id === song.id && isPlaying;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      {/* Section Header with Neon Border */}
      <motion.div 
        whileHover={{ 
          boxShadow: '0 0 30px hsl(180 100% 50% / 0.8), 0 0 60px hsl(180 100% 50% / 0.5), inset 0 0 20px hsl(180 100% 50% / 0.15)',
          scale: 1.01
        }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`mb-6 p-6 rounded-2xl bg-gradient-to-r ${gradient} backdrop-blur-lg`}
        style={{
          border: '2px solid hsl(180 100% 50%)',
          boxShadow: '0 0 20px hsl(180 100% 50% / 0.5), 0 0 40px hsl(180 100% 50% / 0.3), inset 0 0 15px hsl(180 100% 50% / 0.1)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h2 className="text-3xl font-bold text-cyan-300">{title}</h2>
        </div>
        <p className="text-gray-300 text-base">{subtitle}</p>
      </motion.div>
      
      {/* Music Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {songs.map((song, index) => (
          <motion.div
            key={`${song.id}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.5,
              scale: hoveredIndex === index ? 1.05 : hoveredIndex === null ? 1 : 0.95,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            onClick={() => onPlaySong(song)}
            className="group relative cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            {/* Card Container with Thick Neon Border */}
            <motion.div
              whileHover={{ 
                boxShadow: '0 0 40px hsl(180 100% 50% / 0.9), 0 0 80px hsl(180 100% 50% / 0.6), inset 0 0 30px hsl(180 100% 50% / 0.2)',
                y: -10
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative bg-slate-900/60 rounded-2xl p-4 backdrop-blur-lg"
              style={{
                border: '3px solid hsl(180 100% 50%)',
                boxShadow: '0 0 20px hsl(180 100% 50% / 0.6), 0 0 40px hsl(180 100% 50% / 0.4), inset 0 0 20px hsl(180 100% 50% / 0.1)'
              }}
            >
              {/* 3D Lift Shadow */}
              <div 
                className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ transform: 'translateY(20px)' }}
              />
              
              {/* Thumbnail Container */}
              <div className="relative mb-4 overflow-hidden rounded-xl">
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('hqdefault')) {
                      target.src = target.src.replace('hqdefault', 'maxresdefault');
                    } else if (target.src.includes('maxresdefault')) {
                      target.src = target.src.replace('maxresdefault', 'sddefault');
                    } else {
                      target.src = "https://via.placeholder.com/480x360/1a1a1a/ffffff?text=♪";
                    }
                  }}
                />
                
                {/* Audio Indicator */}
                <div className="absolute top-2 left-2 bg-black/80 rounded-full px-2 py-1 flex items-center gap-1">
                  <Volume2 size={12} className="text-cyan-400" />
                  <span className="text-xs text-white font-medium">Audio</span>
                </div>
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="rounded-full p-4"
                    style={{
                      background: 'hsl(180 100% 50%)',
                      boxShadow: '0 0 30px hsl(180 100% 50% / 0.8), 0 0 60px hsl(180 100% 50% / 0.5)'
                    }}
                  >
                    {isCurrentlyPlaying(song) ? (
                      <Pause size={24} className="text-slate-900" />
                    ) : (
                      <Play size={24} className="text-slate-900 ml-1" />
                    )}
                  </motion.div>
                </div>

                {/* Currently Playing Indicator */}
                {isCurrentlyPlaying(song) && (
                  <motion.div 
                    animate={{ 
                      boxShadow: [
                        '0 0 20px hsl(180 100% 50% / 0.8)',
                        '0 0 40px hsl(180 100% 50% / 1)',
                        '0 0 20px hsl(180 100% 50% / 0.8)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-2 right-2 bg-cyan-500 rounded-full p-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </motion.div>
                )}

                {/* Category Badge */}
                {song.category && (
                  <div 
                    className="absolute bottom-2 right-2 rounded-full px-2 py-1 backdrop-blur-lg"
                    style={{
                      background: 'hsl(270 100% 60% / 0.8)',
                      boxShadow: '0 0 15px hsl(270 100% 60% / 0.6)'
                    }}
                  >
                    <span className="text-xs text-white font-medium">{song.category}</span>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-cyan-300 transition-colors leading-tight">
                  {song.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-1 group-hover:text-gray-300 transition-colors">
                  {song.artist}
                </p>
                {song.language && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs rounded-full px-2 py-1"
                      style={{
                        background: 'hsl(180 100% 50% / 0.2)',
                        color: 'hsl(180 100% 80%)',
                        border: '1px solid hsl(180 100% 50% / 0.4)'
                      }}
                    >
                      {song.language}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default EnhancedRecommendationSection;
