import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

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

      const normalizedEmotion = emotion.toLowerCase();
      console.log('[EmotionResult] Looking for emotion playlist:', normalizedEmotion, 'for user:', user.id);

      // 1) Try emotion-specific playlists first
      const { data: emotionPlaylists, error: emotionPlaylistError } = await supabase
        .from('emotion_playlists')
        .select('*')
        .eq('user_id', user.id)
        .ilike('emotion', normalizedEmotion)
        .order('created_at', { ascending: false })
        .limit(1);

      if (emotionPlaylistError) {
        console.error('[EmotionResult] Emotion playlist query error:', emotionPlaylistError);
        throw emotionPlaylistError;
      }

      if (emotionPlaylists && emotionPlaylists.length > 0) {
        const selectedEmotionPlaylist = emotionPlaylists[0];
        console.log('[EmotionResult] Using emotion playlist:', selectedEmotionPlaylist);

        const { data: emotionSongs, error: emotionSongsError } = await supabase
          .from('emotion_playlist_songs')
          .select('*')
          .eq('emotion_playlist_id', selectedEmotionPlaylist.id)
          .order('position', { ascending: true });

        if (emotionSongsError) {
          console.error('[EmotionResult] Emotion playlist songs query error:', emotionSongsError);
          throw emotionSongsError;
        }

        console.log('[EmotionResult] Emotion playlist songs found:', emotionSongs?.length || 0);

        if (emotionSongs && emotionSongs.length > 0) {
          const formattedSongs = emotionSongs.map(song => ({
            id: song.song_id,
            title: song.title,
            channelTitle: song.artist,
            thumbnail: song.thumbnail || '',
            url: song.url,
          }));

          console.log('[EmotionResult] Formatted songs from emotion playlist:', formattedSongs);

          playTrack(formattedSongs[0], formattedSongs, 0);
          console.log('[EmotionResult] Started playing from emotion playlist:', formattedSongs[0].title);

          toast({
            title: 'Now Playing',
            description: `Playing from your '${emotion}' playlist`,
          });

          setMessage(null);
          return;
        }

        console.log('[EmotionResult] Emotion playlist exists but has no songs, falling back to regular playlists');
      } else {
        console.log('[EmotionResult] No emotion playlist found, falling back to regular playlists');
      }

      // 2) Fallback: look for a regular playlist whose NAME matches the emotion (case-insensitive)
      const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', normalizedEmotion)
        .order('created_at', { ascending: false })
        .limit(1);

      if (playlistsError) {
        console.error('[EmotionResult] Regular playlist query error:', playlistsError);
        throw playlistsError;
      }

      console.log('[EmotionResult] Matching regular playlists for emotion:', normalizedEmotion, playlists);

      if (!playlists || playlists.length === 0) {
        setMessage(`No '${emotion}' playlist found. Create one in your library with that exact name to auto-play your mood next time.`);
        return;
      }

      const selectedPlaylist = playlists[0];
      console.log('[EmotionResult] Selected regular playlist:', selectedPlaylist);

      const { data: songs, error: songsError } = await supabase
        .from('playlist_songs')
        .select('*')
        .eq('playlist_id', selectedPlaylist.id)
        .order('position', { ascending: true });

      if (songsError) {
        console.error('[EmotionResult] Regular playlist songs query error:', songsError);
        throw songsError;
      }

      console.log('[EmotionResult] Regular playlist songs found:', songs?.length || 0);

      if (!songs || songs.length === 0) {
        setMessage(`Your '${emotion}' playlist is empty. Add some songs in your library to enable auto-play.`);
        return;
      }

      const formattedSongs = songs.map(song => ({
        id: song.song_id,
        title: song.title,
        channelTitle: song.artist,
        thumbnail: song.thumbnail || '',
        url: song.url,
      }));

      console.log('[EmotionResult] Formatted songs from regular playlist:', formattedSongs);

      playTrack(formattedSongs[0], formattedSongs, 0);
      console.log('[EmotionResult] Started playing from regular playlist:', formattedSongs[0].title);

      toast({
        title: 'Now Playing',
        description: `Playing from your '${emotion}' playlist`,
      });

      setMessage(null);
    } catch (error) {
      console.error('[EmotionResult] Error finding and playing matching playlist:', error);
      setMessage(`Error loading playlist for '${emotion}'. Please try again.`);
    }
  };

  const handlePlayEmotionPlaylist = async () => {
    if (primaryEmotion) {
      await findAndPlayMatchingPlaylist(primaryEmotion);
    }
  };

  const emotionColors: { [key: string]: string } = {
    happy: '#00ffaa',
    sad: '#0088ff',
    angry: '#ff0044',
    neutral: '#888888',
    surprised: '#ffaa00',
    fear: '#aa00ff',
    disgust: '#88ff00',
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {primaryEmotion && (
        <motion.div 
          className="bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-2xl p-5 border border-cyan-500/30 backdrop-blur-sm"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg text-cyan-200 mb-3">
            Primary emotion: <span className="text-green-400 font-bold text-xl capitalize">{primaryEmotion}</span>
          </p>
          <Button
            onClick={handlePlayEmotionPlaylist}
            className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
          >
            <Play size={18} className="mr-2" />
            Play {primaryEmotion} Playlist
          </Button>
        </motion.div>
      )}
      
      {message && (
        <motion.div 
          className="bg-cyan-500/10 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-cyan-300 text-center">{message}</p>
        </motion.div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-cyan-300">Neural Analysis Results</h3>
        <div className="space-y-3">
          {emotions.map((emotion, index) => {
            const color = emotionColors[emotion.label.toLowerCase()] || '#00ffaa';
            
            return (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* 3D Bar Container */}
                <div className="relative p-4 rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, rgba(10, 10, 26, 0.6), rgba(15, 15, 40, 0.8))',
                    border: '1px solid rgba(0, 255, 170, 0.2)',
                    transform: 'perspective(800px) rotateX(5deg)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white capitalize font-semibold text-lg">{emotion.label}</span>
                    <motion.span 
                      className="font-bold text-xl"
                      style={{ color }}
                      animate={{
                        textShadow: [
                          `0 0 10px ${color}`,
                          `0 0 20px ${color}`,
                          `0 0 10px ${color}`,
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      {(emotion.score * 100).toFixed(1)}%
                    </motion.span>
                  </div>

                  {/* 3D Animated Bar */}
                  <div className="relative h-8 rounded-lg overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 40, 0.6))',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <motion.div
                      className="h-full rounded-lg relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                        boxShadow: `0 0 20px ${color}80, inset 0 2px 10px ${color}40`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${emotion.score * 100}%` }}
                      transition={{
                        duration: 1,
                        delay: index * 0.15,
                        ease: "easeOut"
                      }}
                    >
                      {/* Glowing overlay */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
                        }}
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.2,
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Floating particles around high-confidence emotions */}
                {emotion.score > 0.5 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                          background: color,
                          boxShadow: `0 0 6px ${color}`,
                          left: `${30 + i * 20}%`,
                          top: '50%',
                        }}
                        animate={{
                          y: [-10, -30, -10],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default EmotionResult;
