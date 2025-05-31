
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
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {songs.slice(0, 6).map((song, index) => (
          <div
            key={`${song.title}-${song.artist}-${index}`}
            className="bg-gray-800/40 rounded-lg p-3 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 group hover:bg-gray-700/60"
            onClick={() => onPlaySong(song, index)}
          >
            <div className="flex items-center space-x-3">
              {/* Album Art */}
              <div className="w-12 h-12 flex-shrink-0">
                <img
                  src={song.albumArt || "https://via.placeholder.com/48x48/1a1a1a/ffffff?text=♪"}
                  alt={`${song.title} album cover`}
                  className="w-12 h-12 rounded-lg object-cover bg-gray-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/48x48/1a1a1a/ffffff?text=♪";
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                  {song.title}
                </h3>
                <p className="text-white/80 text-xs line-clamp-1">{song.artist}</p>
              </div>
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-green-500 rounded-full p-2 shadow-lg">
                <Play size={12} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicFeedGrid;
