import { MusicController } from '@/voice/types';

/**
 * Music Adapter - Maps voice intents to MusicController actions
 * Delegates to singleton MusicController instance
 */
export class MusicAdapter {
  constructor(private musicController: MusicController) {}

  async play(): Promise<void> {
    await this.musicController.play();
  }

  async pause(): Promise<void> {
    await this.musicController.pause();
  }

  async resume(): Promise<void> {
    await this.musicController.resume();
  }

  async next(): Promise<void> {
    await this.musicController.next();
  }

  async previous(): Promise<void> {
    await this.musicController.previous();
  }

  async playAtIndex(index: number): Promise<void> {
    await this.musicController.playNthTrack(index);
  }

  async playPlaylist(playlistName: string): Promise<void> {
    await this.musicController.playPlaylist(playlistName);
  }

  async playLikedSongs(): Promise<void> {
    await this.musicController.playLikedSongs();
  }

  async playMood(mood: string): Promise<void> {
    await this.musicController.playMood(mood as any);
  }

  async searchAndPlay(query: string): Promise<void> {
    await this.musicController.searchAndPlay(query);
  }

  async playQuery(query: string): Promise<void> {
    await this.musicController.playQuery(query);
  }

  setVolume(percent: number): void {
    this.musicController.setVolume(percent);
  }

  adjustVolume(delta: number): void {
    this.musicController.adjustVolume(delta);
  }

  isPlaying(): boolean {
    return this.musicController.isPlaying();
  }
}
