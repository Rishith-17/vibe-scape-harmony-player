/**
 * Emotion Analysis Service
 * Handles the voice-triggered emotion detection and playlist playback flow
 */

import { supabase } from '@/integrations/supabase/client';

interface EmotionResult {
  label: string;
  score: number;
}

interface PlaylistSong {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

type PlayTrackFn = (track: PlaylistSong, queue: PlaylistSong[], index: number) => void;
type ToastFn = (opts: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
type NavigateFn = (path: string) => void;

class EmotionAnalysisService {
  private playTrack: PlayTrackFn | null = null;
  private showToast: ToastFn | null = null;
  private navigate: NavigateFn | null = null;
  private onCaptureRequest: (() => void) | null = null;
  private onAnalysisComplete: ((emotion: string) => void) | null = null;

  /**
   * Register dependencies from React context
   */
  initialize(deps: {
    playTrack: PlayTrackFn;
    showToast: ToastFn;
    navigate: NavigateFn;
  }) {
    this.playTrack = deps.playTrack;
    this.showToast = deps.showToast;
    this.navigate = deps.navigate;
    console.log('[EmotionAnalysisService] Initialized with dependencies');
  }

  /**
   * Set callback for when webcam capture is requested
   */
  setOnCaptureRequest(callback: () => void) {
    this.onCaptureRequest = callback;
  }

  /**
   * Set callback for when analysis completes
   */
  setOnAnalysisComplete(callback: (emotion: string) => void) {
    this.onAnalysisComplete = callback;
  }

  /**
   * Main entry point - triggered by voice command "analyse my emotion"
   */
  async startAnalysis(): Promise<void> {
    console.log('[EmotionAnalysisService] Starting emotion analysis flow...');

    if (!this.navigate || !this.showToast) {
      console.error('[EmotionAnalysisService] Dependencies not initialized');
      return;
    }

    // Navigate to emotions page
    this.navigate('/emotions');

    // Wait a bit for the page to load, then trigger webcam
    setTimeout(() => {
      if (this.onCaptureRequest) {
        this.onCaptureRequest();
      }
    }, 500);
  }

  /**
   * Called when image is captured - run emotion detection
   */
  async analyzeImage(imageData: string): Promise<EmotionResult[] | null> {
    console.log('[EmotionAnalysisService] Analyzing captured image...');

    try {
      const response = await fetch(
        'https://zchhecueiqpqhvrnnmsm.supabase.co/functions/v1/emotion-detection',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.emotions || result.emotions.length === 0) {
        throw new Error('No emotions detected');
      }

      const primaryEmotion = result.emotions[0]?.label?.toLowerCase();
      console.log('[EmotionAnalysisService] Detected emotion:', primaryEmotion);

      if (this.onAnalysisComplete && primaryEmotion) {
        this.onAnalysisComplete(primaryEmotion);
      }

      // Auto-play matching playlist
      if (primaryEmotion) {
        await this.playEmotionPlaylist(primaryEmotion);
      }

      return result.emotions;
    } catch (error) {
      console.error('[EmotionAnalysisService] Analysis error:', error);
      this.showToast?.({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not detect emotion',
        variant: 'destructive',
      });
      return null;
    }
  }

  /**
   * Find and play matching emotion playlist
   */
  async playEmotionPlaylist(emotion: string): Promise<boolean> {
    if (!this.playTrack || !this.showToast) {
      console.error('[EmotionAnalysisService] Dependencies not initialized');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.showToast({
          title: 'Not Logged In',
          description: 'Please log in to play emotion playlists',
          variant: 'destructive',
        });
        return false;
      }

      const normalizedEmotion = emotion.toLowerCase();
      console.log('[EmotionAnalysisService] Looking for playlist:', normalizedEmotion);

      // 1) Try emotion-specific playlists first
      const { data: emotionPlaylists } = await supabase
        .from('emotion_playlists')
        .select('*')
        .eq('user_id', user.id)
        .ilike('emotion', normalizedEmotion)
        .order('created_at', { ascending: false })
        .limit(1);

      if (emotionPlaylists && emotionPlaylists.length > 0) {
        const playlist = emotionPlaylists[0];
        const { data: songs } = await supabase
          .from('emotion_playlist_songs')
          .select('*')
          .eq('emotion_playlist_id', playlist.id)
          .order('position', { ascending: true });

        if (songs && songs.length > 0) {
          const formattedSongs = songs.map(s => ({
            id: s.song_id,
            title: s.title,
            channelTitle: s.artist,
            thumbnail: s.thumbnail || '',
            url: s.url,
          }));

          this.playTrack(formattedSongs[0], formattedSongs, 0);
          this.showToast({
            title: 'Now Playing',
            description: `Playing from your '${emotion}' playlist`,
          });
          return true;
        }
      }

      // 2) Fallback: regular playlists matching emotion name
      const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', normalizedEmotion)
        .order('created_at', { ascending: false })
        .limit(1);

      if (playlists && playlists.length > 0) {
        const playlist = playlists[0];
        const { data: songs } = await supabase
          .from('playlist_songs')
          .select('*')
          .eq('playlist_id', playlist.id)
          .order('position', { ascending: true });

        if (songs && songs.length > 0) {
          const formattedSongs = songs.map(s => ({
            id: s.song_id,
            title: s.title,
            channelTitle: s.artist,
            thumbnail: s.thumbnail || '',
            url: s.url,
          }));

          this.playTrack(formattedSongs[0], formattedSongs, 0);
          this.showToast({
            title: 'Now Playing',
            description: `Playing from your '${emotion}' playlist`,
          });
          return true;
        }
      }

      // No matching playlist found
      this.showToast({
        title: 'No Playlist Found',
        description: `No playlist found for emotion: ${emotion}`,
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      console.error('[EmotionAnalysisService] Playlist error:', error);
      this.showToast({
        title: 'Error',
        description: 'Could not load emotion playlist',
        variant: 'destructive',
      });
      return false;
    }
  }
}

// Singleton instance
export const emotionAnalysisService = new EmotionAnalysisService();
