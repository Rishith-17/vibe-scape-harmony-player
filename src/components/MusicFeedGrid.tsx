
import { Play } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  genre: string;
}

interface MusicFeedGridProps {
  title: string;
  songs: Song[];
  onPlaySong: (song: Song, index: number) => void;
}

const MusicFeedGrid = ({ title, songs, onPlaySong }: MusicFeedGridProps) => {
  const getGradientColor = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-purple-600 to-blue-600',
      'bg-gradient-to-br from-green-600 to-teal-600',
      'bg-gradient-to-br from-orange-600 to-red-600',
      'bg-gradient-to-br from-pink-600 to-purple-600',
      'bg-gradient-to-br from-blue-600 to-cyan-600',
      'bg-gradient-to-br from-yellow-600 to-orange-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {songs.slice(0, 6).map((song, index) => (
          <div
            key={`${song.title}-${song.artist}-${index}`}
            className={`${getGradientColor(index)} rounded-lg p-3 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 group`}
            onClick={() => onPlaySong(song, index)}
          >
            <div className="relative z-10">
              <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                {song.title}
              </h3>
              <p className="text-white/80 text-xs line-clamp-1">{song.artist}</p>
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-green-500 rounded-full p-2 shadow-lg">
                <Play size={12} className="text-white" />
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicFeedGrid;
