import { MusicController, MoodType } from '@/voice/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

type MusicPlayerType = ReturnType<typeof useMusicPlayer>;

/**
 * Adapter that wraps existing MusicPlayerContext for voice control
 * No internal logic changes - pure delegation
 */
export class MusicControllerImpl implements MusicController {
  private playerContext: MusicPlayerType | null = null;
  private currentVolume: number;

  constructor(player?: MusicPlayerType) {
    // Load volume from localStorage or default to 70
    this.currentVolume = parseInt(localStorage.getItem('vibescape_volume') || '70');
    if (player) {
      this.playerContext = player;
    }
  }

  /**
   * Set the player context (called from React component)
   */
  setPlayerContext(player: MusicPlayerType) {
    this.playerContext = player;
  }

  private get player(): MusicPlayerType {
    if (!this.playerContext) {
      throw new Error('Player context not initialized');
    }
    return this.playerContext;
  }

  /**
   * Check if music is currently playing
   */
  isPlaying(): boolean {
    return this.playerContext?.isPlaying ?? false;
  }

  async play(): Promise<void> {
    console.log('[MusicController] ▶️ Play command');
    if (!this.player.isPlaying && this.player.currentTrack) {
      this.player.togglePlayPause();
    } else if (!this.player.currentTrack && this.player.playlist.length > 0) {
      // If no track is playing but playlist exists, play first track
      await this.player.playTrack(this.player.playlist[0], this.player.playlist, 0);
    }
  }

  async pause(): Promise<void> {
    console.log('[MusicController] ⏸️ Pause command');
    if (this.player.isPlaying) {
      this.player.togglePlayPause();
    }
  }

  async resume(): Promise<void> {
    console.log('[MusicController] ▶️ Resume command');
    await this.play();
  }

  async next(): Promise<void> {
    console.log('[MusicController] ⏭️ Next command');
    this.player.skipNext();
  }

  async previous(): Promise<void> {
    console.log('[MusicController] ⏮️ Previous command');
    this.player.skipPrevious();
  }

  async playQuery(query: string): Promise<void> {
    console.log('[MusicController] 🔍 Play query:', query);
    // Search in current playlist
    const track = this.player.playlist.find(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.channelTitle?.toLowerCase().includes(query.toLowerCase())
    );
    if (track) {
      await this.player.playTrack(track);
    } else {
      throw new Error(`No track found for "${query}"`);
    }
  }

  async playMood(mood: MoodType): Promise<void> {
    console.log('[MusicController] 😊 Play mood:', mood);
    // Map mood to emotion playlist
    const moodMap: Record<MoodType, string> = {
      happy: 'happy',
      sad: 'sad',
      calm: 'neutral',
      focus: 'neutral',
      chill: 'neutral',
      romantic: 'happy',
      energetic: 'happy',
    };
    
    const emotion = moodMap[mood] || 'neutral';
    
    // Try to play the emotion playlist
    try {
      await this.player.playEmotionPlaylist(emotion);
    } catch (error) {
      throw new Error(`No songs found for mood "${mood}"`);
    }
  }

  async playNthTrack(trackNumber: number): Promise<void> {
    console.log('[MusicController] 🎵 Play track number:', trackNumber);
    
    if (!this.player.playlist || this.player.playlist.length === 0) {
      throw new Error('No playlist loaded');
    }
    
    const index = trackNumber - 1; // Convert to 0-based index
    if (index < 0 || index >= this.player.playlist.length) {
      throw new Error(`Track ${trackNumber} not found. Playlist has ${this.player.playlist.length} songs.`);
    }
    
    const track = this.player.playlist[index];
    await this.player.playTrack(track, this.player.playlist, index);
  }

  async playLikedSongs(): Promise<void> {
    console.log('[MusicController] ❤️ Play liked songs');
    
    // Find the "Liked Songs" playlist
    const likedPlaylist = this.player.playlists.find(p => p.name === 'Liked Songs');
    if (!likedPlaylist) {
      throw new Error('No liked songs found');
    }
    
    try {
      const songs = await this.player.getPlaylistSongs(likedPlaylist.id);
      if (songs.length === 0) {
        throw new Error('Liked songs playlist is empty');
      }
      await this.player.playTrack(songs[0], songs, 0);
    } catch (error) {
      throw new Error('Could not play liked songs');
    }
  }

  async playPlaylist(playlistName: string): Promise<void> {
    console.log('[MusicController] 📋 Play playlist:', playlistName);
    
    // Find playlist by name (case insensitive, fuzzy match)
    const normalizedQuery = playlistName.toLowerCase().trim();
    const playlist = this.player.playlists.find(
      p => p.name.toLowerCase().includes(normalizedQuery) || 
           normalizedQuery.includes(p.name.toLowerCase())
    );
    
    if (!playlist) {
      throw new Error(`Playlist "${playlistName}" not found`);
    }
    
    try {
      const songs = await this.player.getPlaylistSongs(playlist.id);
      if (songs.length === 0) {
        throw new Error(`Playlist "${playlistName}" is empty`);
      }
      console.log(`[MusicController] 🎵 Playing "${playlist.name}" from track 1`);
      await this.player.playTrack(songs[0], songs, 0);
    } catch (error) {
      throw new Error(`Could not play playlist "${playlistName}"`);
    }
  }

  async searchAndPlay(query: string): Promise<void> {
    console.log('[MusicController] 🔍 Search and play:', query);
    
    try {
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Search using the YouTube edge function
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${query} music`, maxResults: 10 }
      });
      
      if (error) {
        console.error('[MusicController] Search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }
      
      if (!data?.videos || data.videos.length === 0) {
        throw new Error(`No results found for "${query}"`);
      }
      
      // Convert YouTube videos to Track format
      const tracks = data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnail: video.thumbnail,
        videoId: video.id,
      }));
      
      // Auto-play the first result
      const topResult = tracks[0];
      console.log('[MusicController] 🎵 Auto-playing top result:', topResult.title);
      await this.player.playTrack(topResult, tracks, 0);
    } catch (error) {
      console.error('[MusicController] ❌ Search and play failed:', error);
      throw new Error(`I couldn't find "${query}"`);
    }
  }

  setVolume(percent: number): void {
    const volume = Math.max(0, Math.min(100, percent));
    console.log('[MusicController] 🔊 Set volume to:', volume);
    this.currentVolume = volume;
    localStorage.setItem('vibescape_volume', volume.toString());
    this.player.setVolume(volume);
  }

  adjustVolume(delta: number): void {
    const newVolume = Math.max(0, Math.min(100, this.currentVolume + delta));
    console.log('[MusicController] 🔊 Adjust volume from', this.currentVolume, 'to', newVolume);
    this.setVolume(newVolume);
  }
}

// Singleton instance exported for global use
export const musicController = new MusicControllerImpl();
