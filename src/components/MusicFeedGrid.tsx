
import { Play } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  genre: string;
  albumArt?: string;
}

interface MusicFeedGridProps {
  title: string;
  songs: Song[];
  onPlaySong: (song: Song, index: number) => void;
}

const MusicFeedGrid = ({ title, songs, onPlaySong }: MusicFeedGridProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {songs.slice(0, 6).map((song, index) => (
          <div
            key={`${song.title}-${song.artist}-${index}`}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 group hover:bg-gradient-to-br hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-700/30 hover:border-gray-600/50 shadow-lg"
            onClick={() => onPlaySong(song, index)}
          >
            <div className="flex items-center space-x-3">
              {/* Album Art */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden shadow-md ring-1 ring-white/10">
                  <img
                    src={song.albumArt || "https://via.placeholder.com/56x56/1a1a1a/ffffff?text=♪"}
                    alt={`${song.title} album cover`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/56x56/1a1a1a/ffffff?text=♪";
                    }}
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1 group-hover:text-green-400 transition-colors">
                  {song.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-1">{song.artist}</p>
              </div>
            </div>
            
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-90">
              <div className="bg-green-500 rounded-full p-2 shadow-lg hover:shadow-green-500/25 hover:bg-green-600 transition-all">
                <Play size={12} className="text-white ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicFeedGrid;
