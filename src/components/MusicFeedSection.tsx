
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Song {
  title: string;
  artist: string;
  genre: string;
  match_reason?: string;
  albumArt?: string;
}

interface MusicFeedSectionProps {
  title: string;
  subtitle?: string;
  songs: Song[];
  showMatchReason?: boolean;
}

const MusicFeedSection = ({ title, subtitle, songs, showMatchReason = false }: MusicFeedSectionProps) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useMusicPlayer();
  const { toast } = useToast();

  const handlePlaySong = async (song: Song, index: number) => {
    try {
      // Search for the song on YouTube
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${song.title} ${song.artist} official audio`, maxResults: 1 }
      });

      if (error) throw error;

      if (data.videos && data.videos.length > 0) {
        const video = data.videos[0];
        const track = {
          id: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnail: video.thumbnail,
          url: video.url,
        };

        playTrack(track, data.videos.map((v: any) => ({
          id: v.id,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnail: v.thumbnail,
          url: v.url,
        })), index);

        toast({
          title: "Now Playing",
          description: `${song.title} by ${song.artist}`,
        });
      } else {
        toast({
          title: "Song not found",
          description: "Couldn't find this song on YouTube",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error playing song:', error);
      toast({
        title: "Error",
        description: "Failed to play song",
        variant: "destructive",
      });
    }
  };

  const isCurrentlyPlaying = (song: Song) => {
    return currentTrack?.title.toLowerCase().includes(song.title.toLowerCase()) && 
           currentTrack?.channelTitle.toLowerCase().includes(song.artist.toLowerCase());
  };

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
      
      <div className="space-y-2">
        {songs.map((song, index) => (
          <div
            key={`${song.title}-${song.artist}-${index}`}
            className={`bg-gray-800/40 rounded-lg p-3 hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-between group ${
              isCurrentlyPlaying(song) ? 'ring-1 ring-green-400 bg-gray-700/60' : ''
            }`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Album Art */}
              <div className="w-15 h-15 flex-shrink-0">
                <img
                  src={song.albumArt || "https://via.placeholder.com/60x60/1a1a1a/ffffff?text=♪"}
                  alt={`${song.title} album cover`}
                  className="w-15 h-15 rounded-lg object-cover bg-gray-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/60x60/1a1a1a/ffffff?text=♪";
                  }}
                />
              </div>
              
              <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs text-gray-300 flex-shrink-0">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm line-clamp-1">
                  {song.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-xs">{song.artist}</p>
                  <span className="text-gray-500">•</span>
                  <p className="text-gray-500 text-xs">{song.genre}</p>
                </div>
                {showMatchReason && song.match_reason && (
                  <p className="text-green-400 text-xs mt-1">{song.match_reason}</p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                if (isCurrentlyPlaying(song)) {
                  togglePlayPause();
                } else {
                  handlePlaySong(song, index);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 p-0 flex-shrink-0"
            >
              {isCurrentlyPlaying(song) && isPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicFeedSection;
