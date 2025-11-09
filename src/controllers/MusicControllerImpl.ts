import { MusicController, MoodType } from '@/voice/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

type MusicPlayerType = ReturnType<typeof useMusicPlayer>;

/**
 * Adapter that wraps existing MusicPlayerContext for voice control
 * No internal logic changes - pure delegation
 */
export class MusicControllerImpl implements MusicController {
  constructor(private player: MusicPlayerType) {}

  play(): void {
    if (!this.player.isPlaying && this.player.currentTrack) {
      this.player.togglePlayPause();
    }
  }

  pause(): void {
    if (this.player.isPlaying) {
      this.player.togglePlayPause();
    }
  }

  resume(): void {
    this.play();
  }

  next(): void {
    this.player.skipNext();
  }

  previous(): void {
    this.player.skipPrevious();
  }

  async playQuery(query: string): Promise<void> {
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

  setVolume(percent: number): void {
    this.player.setVolume(Math.max(0, Math.min(100, percent)));
  }

  adjustVolume(delta: number): void {
    // Get current volume from player state - since volume isn't directly exposed,
    // we'll use setVolume with relative adjustment based on typical default (50)
    this.player.setVolume(Math.max(0, Math.min(100, 50 + delta)));
  }
}
