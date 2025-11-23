import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, MoreHorizontal, Play, Trash2, Edit, ArrowLeft, Shuffle, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PlaylistSong {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  position: number;
}

const LibraryPage = () => {
  const navigate = useNavigate();
  const {
    playlists,
    emotionPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    getPlaylistSongs,
    getEmotionPlaylistSongs,
    playTrack,
    refreshPlaylists,
    refreshEmotionPlaylists,
    currentTrack,
    isPlaying,
    removeFromPlaylist,
    playEmotionPlaylist,
  } = useMusicPlayer();
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    refreshPlaylists();
    refreshEmotionPlaylists();
  }, [refreshPlaylists, refreshEmotionPlaylists]);


  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Playlist "${newPlaylistName.trim()}" created`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await deletePlaylist(playlistId);
      toast({
        title: "Deleted",
        description: `Playlist "${playlistName}" deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  const startEditPlaylist = (playlist: any) => {
    setEditingPlaylist(playlist.id);
    setEditName(playlist.name);
    setIsEditDialogOpen(true);
  };

  const saveEditPlaylist = async () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    if (!editingPlaylist) return;

    try {
      await renamePlaylist(editingPlaylist, editName.trim());
      setIsEditDialogOpen(false);
      setEditingPlaylist(null);
      setEditName('');
      
      toast({
        title: "Success",
        description: "Playlist renamed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const songs = await getPlaylistSongs(playlistId);
      if (songs.length > 0) {
        playTrack(songs[0], songs, 0);
        toast({
          title: "Now Playing",
          description: `Playing playlist`,
        });
      } else {
        toast({
          title: "Empty Playlist",
          description: "This playlist has no songs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlayEmotionPlaylist = async (emotion: string) => {
    try {
      await playEmotionPlaylist(emotion);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play emotion playlist",
        variant: "destructive",
      });
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
  };

  // Combine all playlists for circular arrangement
  const allPlaylists = [
    ...emotionPlaylists.map(p => ({ ...p, type: 'emotion' as const })),
    ...playlists.map(p => ({ ...p, type: 'regular' as const }))
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + allPlaylists.length) % allPlaylists.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % allPlaylists.length);
      } else if (e.key === 'Enter') {
        const centerPlaylist = allPlaylists[currentIndex];
        if (centerPlaylist) {
          navigate(`/playlist/${centerPlaylist.id}`);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allPlaylists, navigate]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % allPlaylists.length);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + allPlaylists.length) % allPlaylists.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCardPosition = (index: number) => {
    const total = allPlaylists.length;
    const diff = (index - currentIndex + total) % total;
    const normalizedDiff = diff > total / 2 ? diff - total : diff;
    return normalizedDiff;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white pb-32 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 200, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 200, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="pt-8 px-6 relative z-10">
        <div className="flex items-center justify-between mb-16">
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 200%' }}
          >
            Your Library
          </motion.h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white shadow-lg shadow-green-500/50">
                  <Plus size={20} className="mr-2" />
                  Create Playlist
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-cyan-400">Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-cyan-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlaylist}
                    className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {allPlaylists.length === 0 ? (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-gray-400 text-xl mb-4">Your library is empty</div>
              <p className="text-gray-500 mb-6">Create your first playlist to get started</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white"
              >
                <Plus size={20} className="mr-2" />
                Create Playlist
              </Button>
            </motion.div>
          </div>
        ) : (
          /* Circular 3D Playlist Arrangement */
          <div 
            className="relative w-full min-h-[600px] flex items-center justify-center perspective-[2000px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full max-w-4xl aspect-square" style={{ transformStyle: 'preserve-3d' }}>
              {allPlaylists.map((playlist, index) => {
                const position = getCardPosition(index);
                const isCenterCard = position === 0;
                const angle = (position / Math.max(allPlaylists.length, 5)) * 2 * Math.PI;
                const radius = 280;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const isEmotion = playlist.type === 'emotion';

                return (
                  <motion.div
                    key={`${playlist.type}-${playlist.id}`}
                    className="absolute top-1/2 left-1/2 cursor-pointer"
                    initial={false}
                    animate={{
                      x: x,
                      z: z,
                      scale: isCenterCard ? 1.3 : 0.7,
                      opacity: isCenterCard ? 1 : 0.5,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      mass: 1
                    }}
                    style={{
                      transform: `translate(-50%, -50%) rotateY(${-angle * (180 / Math.PI)}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={isCenterCard ? {
                      scale: 1.4,
                      z: 120,
                      rotateY: 15,
                      transition: { duration: 0.3 },
                    } : {
                      scale: 0.75,
                      opacity: 0.7,
                    }}
                    onClick={() => {
                      if (isCenterCard) {
                        navigate(`/playlist/${playlist.id}`);
                      } else {
                        setCurrentIndex(index);
                      }
                    }}
                  >
                    <motion.div
                      className="relative rounded-3xl overflow-hidden"
                      style={{
                        width: isCenterCard ? '200px' : '140px',
                        height: isCenterCard ? '260px' : '180px',
                        background: isEmotion 
                          ? `linear-gradient(135deg, ${
                              playlist.emotion === 'happy' ? '#fbbf24, #f59e0b' : 
                              playlist.emotion === 'sad' ? '#60a5fa, #3b82f6' :
                              playlist.emotion === 'angry' ? '#f87171, #dc2626' :
                              playlist.emotion === 'fear' ? '#a78bfa, #8b5cf6' :
                              playlist.emotion === 'surprise' ? '#f472b6, #ec4899' :
                              playlist.emotion === 'disgust' ? '#34d399, #10b981' :
                              '#9ca3af, #6b7280'
                            })`
                          : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        boxShadow: isCenterCard 
                          ? '0 0 50px rgba(0, 255, 200, 0.8), inset 0 0 30px rgba(0, 255, 200, 0.3)'
                          : '0 0 20px rgba(0, 255, 200, 0.4), inset 0 0 10px rgba(0, 255, 200, 0.1)',
                        border: isCenterCard ? '3px solid rgba(0, 255, 200, 0.8)' : '2px solid rgba(0, 255, 200, 0.3)',
                      }}
                      animate={isCenterCard ? {
                        boxShadow: [
                          '0 0 50px rgba(0, 255, 200, 0.8), inset 0 0 30px rgba(0, 255, 200, 0.3)',
                          '0 0 70px rgba(0, 255, 200, 1), inset 0 0 40px rgba(0, 255, 200, 0.4)',
                          '0 0 50px rgba(0, 255, 200, 0.8), inset 0 0 30px rgba(0, 255, 200, 0.3)',
                        ],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {/* Glowing Border Animation */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          border: '3px solid transparent',
                          background: 'linear-gradient(45deg, #00ffcc, #00ff88, #00ffcc) border-box',
                          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'destination-out',
                          maskComposite: 'exclude',
                        }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      {/* Card Content */}
                      <div className={`relative z-10 h-full flex flex-col items-center justify-between ${isCenterCard ? 'p-6' : 'p-4'}`}>
                        <div className="flex-1 flex items-center justify-center">
                          {isEmotion ? (
                            <div className={`${isCenterCard ? 'text-7xl' : 'text-5xl'} mb-2`}>{getEmotionEmoji(playlist.emotion)}</div>
                          ) : (
                            <Music size={isCenterCard ? 60 : 40} className="text-white/90" />
                          )}
                        </div>
                        
                        <div className="text-center space-y-2 w-full">
                          <h3 className={`text-white font-bold ${isCenterCard ? 'text-lg' : 'text-sm'} line-clamp-1 capitalize`}>
                            {isEmotion ? playlist.emotion : playlist.name}
                          </h3>
                          {isEmotion && playlist.description && isCenterCard && (
                            <p className="text-white/70 text-xs line-clamp-2">{playlist.description}</p>
                          )}
                        </div>

                        {/* Action Buttons (only on center card) */}
                        {isCenterCard && <div className="flex items-center space-x-2 mt-3">
                          <motion.button
                            className="p-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                            whileHover={{ scale: 1.2, boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEmotion) {
                                handlePlayEmotionPlaylist(playlist.emotion);
                              } else {
                                handlePlayPlaylist(playlist.id);
                              }
                            }}
                          >
                            <Play size={16} className="text-white fill-white" />
                          </motion.button>
                          
                          {!isEmotion && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.button
                                  className="p-2 bg-gray-700/80 rounded-full"
                                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(55, 65, 81, 1)' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal size={16} className="text-white" />
                                </motion.button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-900 border-cyan-500/30">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditPlaylist(playlist);
                                  }}
                                  className="text-white hover:bg-gray-800"
                                >
                                  <Edit size={16} className="mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlaylist(playlist.id, playlist.name);
                                  }}
                                  className="text-red-400 hover:bg-gray-800"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>}
                      </div>

                      {/* Data Stream Particles */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: '10%',
                          }}
                          animate={{
                            y: [0, 200],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'translateZ(-50px)' }}>
                {allPlaylists.map((_, index) => {
                  const nextIndex = (index + 1) % allPlaylists.length;
                  const angle1 = (index / allPlaylists.length) * 2 * Math.PI;
                  const angle2 = (nextIndex / allPlaylists.length) * 2 * Math.PI;
                  const radius = 280;
                  const centerX = 50;
                  const centerY = 50;
                  const x1 = centerX + (Math.cos(angle1) * radius) / 8;
                  const y1 = centerY + (Math.sin(angle1) * radius) / 8;
                  const x2 = centerX + (Math.cos(angle2) * radius) / 8;
                  const y2 = centerY + (Math.sin(angle2) * radius) / 8;

                  return (
                    <motion.line
                      key={`line-${index}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="rgba(0, 255, 200, 0.3)"
                      strokeWidth="2"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.1,
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400">Rename Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter new playlist name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-cyan-400"
              onKeyPress={(e) => e.key === 'Enter' && saveEditPlaylist()}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEditPlaylist}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes grid-flow {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        .perspective-\\[2000px\\] {
          perspective: 2000px;
        }
      `}</style>
    </div>
  );
};

export default LibraryPage;
