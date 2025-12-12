import { supabase } from '@/integrations/supabase/client';

/**
 * Playlist Adapter - Handles voice commands for playlist operations
 */
export class PlaylistAdapter {
  private navigate: ((path: string) => void) | null = null;
  private playPlaylist: ((playlistId: string) => Promise<void>) | null = null;

  /**
   * Register navigation function from React context
   */
  setNavigate(navigate: (path: string) => void): void {
    this.navigate = navigate;
  }

  /**
   * Register playlist play function
   */
  setPlayPlaylist(fn: (playlistId: string) => Promise<void>): void {
    this.playPlaylist = fn;
  }

  /**
   * Create a new playlist with the given name
   * Returns success message or error message
   */
  async createPlaylist(playlistName: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'Please log in to create playlists.' };
      }

      // Check for duplicate (case-insensitive)
      const { data: existing } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', playlistName)
        .limit(1);

      if (existing && existing.length > 0) {
        return { 
          success: false, 
          message: `Playlist '${playlistName}' already exists.` 
        };
      }

      // Create the playlist
      const { error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: playlistName,
          description: `Created via voice command`
        });

      if (error) {
        console.error('[PlaylistAdapter] Create error:', error);
        return { success: false, message: 'Failed to create playlist.' };
      }

      return { 
        success: true, 
        message: `Playlist '${playlistName}' created.` 
      };
    } catch (error) {
      console.error('[PlaylistAdapter] Create playlist error:', error);
      return { success: false, message: 'Something went wrong creating the playlist.' };
    }
  }

  /**
   * Find and open a playlist by name (case-insensitive)
   * Returns the playlist ID and navigates to it, or error message
   */
  async openPlaylist(playlistName: string): Promise<{ success: boolean; message: string; playlistId?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'Please log in to access playlists.' };
      }

      // First, try regular playlists
      const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', `%${playlistName}%`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (playlists && playlists.length > 0) {
        const playlist = playlists[0];
        
        // Navigate to playlist page
        if (this.navigate) {
          this.navigate(`/playlist/${playlist.id}`);
        }

        // Play the playlist
        if (this.playPlaylist) {
          await this.playPlaylist(playlist.id);
        }

        return { 
          success: true, 
          message: `Opening playlist ${playlist.name}.`,
          playlistId: playlist.id
        };
      }

      // Try emotion playlists as fallback
      const { data: emotionPlaylists } = await supabase
        .from('emotion_playlists')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', `%${playlistName}%`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (emotionPlaylists && emotionPlaylists.length > 0) {
        const playlist = emotionPlaylists[0];
        
        if (this.navigate) {
          this.navigate(`/playlist/${playlist.id}`);
        }

        if (this.playPlaylist) {
          await this.playPlaylist(playlist.id);
        }

        return { 
          success: true, 
          message: `Opening playlist ${playlist.name}.`,
          playlistId: playlist.id
        };
      }

      return { 
        success: false, 
        message: `I couldn't find a playlist named ${playlistName}.` 
      };
    } catch (error) {
      console.error('[PlaylistAdapter] Open playlist error:', error);
      return { success: false, message: 'Something went wrong opening the playlist.' };
    }
  }

  /**
   * Create a playlist for an emotion (used by emotion detection flow)
   */
  async createEmotionPlaylist(emotion: string): Promise<{ success: boolean; playlistId?: string; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'Please log in to create playlists.' };
      }

      // Check if emotion playlist already exists
      const { data: existing } = await supabase
        .from('emotion_playlists')
        .select('id')
        .eq('user_id', user.id)
        .ilike('emotion', emotion)
        .limit(1);

      if (existing && existing.length > 0) {
        return { 
          success: true, 
          playlistId: existing[0].id,
          message: `Playlist for ${emotion} already exists.`
        };
      }

      // Create new emotion playlist
      const { data, error } = await supabase
        .from('emotion_playlists')
        .insert({
          user_id: user.id,
          emotion: emotion.toLowerCase(),
          name: emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase(),
          description: `Music for ${emotion} mood`
        })
        .select('id')
        .single();

      if (error) {
        console.error('[PlaylistAdapter] Create emotion playlist error:', error);
        return { success: false, message: 'Failed to create emotion playlist.' };
      }

      return { 
        success: true, 
        playlistId: data.id,
        message: `Created playlist for ${emotion}.`
      };
    } catch (error) {
      console.error('[PlaylistAdapter] Create emotion playlist error:', error);
      return { success: false, message: 'Something went wrong.' };
    }
  }
}

// Singleton instance
export const playlistAdapter = new PlaylistAdapter();
