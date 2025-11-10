import { MusicController, MoodType } from '@/voice/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

type MusicPlayerType = ReturnType<typeof useMusicPlayer>;

/**
 * Adapter that wraps existing MusicPlayerContext for voice control
 * No internal logic changes - pure delegation
 */
export class MusicControllerImpl implements MusicController {
  private currentVolume: number;

  constructor(private player: MusicPlayerType) {
    // Load volume from localStorage or default to 70
    this.currentVolume = parseInt(localStorage.getItem('vibescape_volume') || '70');
  }

  play(): void {
    console.log('[MusicController] ▶️ Play command');
    if (!this.player.isPlaying && this.player.currentTrack) {
      this.player.togglePlayPause();
    } else if (!this.player.currentTrack && this.player.playlist.length > 0) {
      // If no track is playing but playlist exists, play first track
      this.player.playTrack(this.player.playlist[0], this.player.playlist, 0);
    }
  }

  pause(): void {
    console.log('[MusicController] ⏸️ Pause command');
    if (this.player.isPlaying) {
      this.player.togglePlayPause();
    }
  }

  resume(): void {
    console.log('[MusicController] ▶️ Resume command');
    this.play();
  }

  next(): void {
    console.log('[MusicController] ⏭️ Next command');
    this.player.skipNext();
  }

  previous(): void {
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
    
    // Find playlist by name (case insensitive)
    const playlist = this.player.playlists.find(
      p => p.name.toLowerCase() === playlistName.toLowerCase()
    );
    
    if (!playlist) {
      throw new Error(`Playlist "${playlistName}" not found`);
    }
    
    try {
      const songs = await this.player.getPlaylistSongs(playlist.id);
      if (songs.length === 0) {
        throw new Error(`Playlist "${playlistName}" is empty`);
      }
      await this.player.playTrack(songs[0], songs, 0);
    } catch (error) {
      throw new Error(`Could not play playlist "${playlistName}"`);
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
