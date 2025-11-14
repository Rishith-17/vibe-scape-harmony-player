import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Emotion {
  label: string;
  score: number;
}

interface Props {
  emotions: Emotion[];
}

const EmotionResult: React.FC<Props> = ({ emotions }) => {
  const { playTrack } = useMusicPlayer();
  const { toast } = useToast();
  const primaryEmotion = emotions[0]?.label?.toLowerCase();
  const [message, setMessage] = useState<string | null>(null);

  // Auto-play from matching emotion playlist when emotion is detected
  useEffect(() => {
    if (primaryEmotion) {
      const timer = setTimeout(async () => {
        await findAndPlayMatchingPlaylist(primaryEmotion);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [primaryEmotion]);

  const findAndPlayMatchingPlaylist = async (emotion: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Please log in to play emotion playlists');
        return;
      }

      // Find emotion playlist that matches the detected emotion
      const { data: emotionPlaylists, error: playlistError } = await supabase
        .from('emotion_playlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('emotion', emotion)
        .order('created_at', { ascending: false })
        .limit(1);

      if (playlistError) throw playlistError;

      if (!emotionPlaylists || emotionPlaylists.length === 0) {
        setMessage(`No '${emotion}' playlist found. Create one in your library to auto-play your mood next time.`);
        return;
      }

      const selectedPlaylist = emotionPlaylists[0];

      // Get songs from the emotion playlist
      const { data: songs, error: songsError } = await supabase
        .from('emotion_playlist_songs')
        .select('*')
        .eq('emotion_playlist_id', selectedPlaylist.id)
        .order('position', { ascending: true });

      if (songsError) throw songsError;
      
      if (!songs || songs.length === 0) {
        setMessage(`Your '${emotion}' playlist is empty. Add some songs to auto-play your mood next time.`);
        return;
      }

      // Convert to the format expected by playTrack
      const formattedSongs = songs.map(song => ({
        id: song.song_id,
        title: song.title,
        channelTitle: song.artist,
        thumbnail: song.thumbnail || '',
        url: song.url
      }));

      // Play the first song from the playlist
      playTrack(formattedSongs[0], formattedSongs, 0);
      
      toast({
        title: "Now Playing",
        description: `Playing from your '${emotion}' playlist`,
      });

      setMessage(null);
    } catch (error) {
      console.error('Error finding and playing matching playlist:', error);
      setMessage(`Error loading playlist for '${emotion}'. Please try again.`);
    }
  };

  const handlePlayEmotionPlaylist = async () => {
    if (primaryEmotion) {
      await findAndPlayMatchingPlaylist(primaryEmotion);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">✨ Detected Emotions</h2>
        {primaryEmotion && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-lg text-gray-200 mb-3">
              Primary emotion: <span className="text-yellow-400 font-semibold capitalize">{primaryEmotion}</span>
            </p>
            <Button
              onClick={handlePlayEmotionPlaylist}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-medium px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Play size={16} className="mr-2" />
              Play {primaryEmotion} Playlist
            </Button>
          </div>
        )}
      </div>
      
      {message && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-blue-200 text-center">{message}</p>
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">All Detected Emotions:</h3>
        <div className="space-y-2">
          {emotions.map((emotion, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20"
            >
              <span className="text-white capitalize font-medium">{emotion.label}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${emotion.score * 100}%` }}
                  />
                </div>
                <span className="text-yellow-400 font-semibold text-sm min-w-[45px]">
                  {(emotion.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionResult;
