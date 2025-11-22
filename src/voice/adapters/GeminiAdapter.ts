import { supabase } from '@/integrations/supabase/client';

/**
 * Gemini Adapter - Handles song information queries via secure server endpoint
 * No API keys exposed to client
 */
export class GeminiAdapter {
  /**
   * Ask Gemini about a song
   * @param transcript User's question
   * @param context Current track info or song title
   */
  async askAboutSong(transcript: string, context: { title?: string; artist?: string }): Promise<string> {
    console.log('[GeminiAdapter] Asking Gemini:', transcript, 'Context:', context);

    try {
      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('gemini-query', {
        body: {
          transcript,
          context,
        },
      });

      if (error) {
        console.error('[GeminiAdapter] Error calling Gemini:', error);
        
        // Handle specific errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          return 'Sorry, too many requests. Please try again in a moment.';
        }
        if (error.message?.includes('402') || error.message?.includes('payment')) {
          return 'Sorry, the service is temporarily unavailable.';
        }
        
        return 'Sorry, I could not get information about this song right now.';
      }

      if (!data || !data.text) {
        console.error('[GeminiAdapter] No response from Gemini');
        return 'Sorry, I did not receive a response.';
      }

      console.log('[GeminiAdapter] ✅ Gemini response received:', data.text);
      return data.text;

    } catch (error) {
      console.error('[GeminiAdapter] Exception calling Gemini:', error);
      return 'Sorry, something went wrong while getting song information.';
    }
  }
}
