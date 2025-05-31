
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
      
      <div className="space-y-3">
        {songs.map((song, index) => (
          <div
            key={`${song.title}-${song.artist}-${index}`}
            className={`bg-gray-800/50 rounded-xl p-4 hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-between group border border-gray-700/30 hover:border-gray-600/50 ${
              isCurrentlyPlaying(song) ? 'ring-2 ring-green-400/50 bg-gray-700/70' : ''
            }`}
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Track Number */}
              <div className="w-6 h-6 bg-gray-600/60 rounded-md flex items-center justify-center text-xs text-gray-300 flex-shrink-0 font-medium">
                {index + 1}
              </div>

              {/* Album Art */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10">
                  <img
                    src={song.albumArt || "https://via.placeholder.com/64x64/1a1a1a/ffffff?text=♪"}
                    alt={`${song.title} album cover`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/64x64/1a1a1a/ffffff?text=♪";
                    }}
                  />
                </div>
                {isCurrentlyPlaying(song) && isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-white font-semibold text-base line-clamp-1 group-hover:text-green-400 transition-colors">
                  {song.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-sm">{song.artist}</p>
                  <span className="text-gray-600">•</span>
                  <p className="text-gray-500 text-sm">{song.genre}</p>
                </div>
                {showMatchReason && song.match_reason && (
                  <p className="text-green-400 text-xs mt-1 font-medium">{song.match_reason}</p>
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
              className="bg-green-500 hover:bg-green-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 w-10 h-10 p-0 flex-shrink-0 rounded-full shadow-lg hover:shadow-green-500/25"
            >
              {isCurrentlyPlaying(song) && isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicFeedSection;
