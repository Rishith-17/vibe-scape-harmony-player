import { VoiceIntent, VoiceAction, MoodType, NavigationTarget } from '../types';

/**
 * Intent parser - maps transcript to structured intent
 * Supports English and Hinglish variants
 */
export function parseIntent(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase().trim();
  
  // Playback controls
  if (/^(play|start|resume|chalu kar|chala|chalao)$/i.test(lower)) {
    return { action: 'play', slots: {}, raw: transcript, confidence: 0.9 };
  }
  
  if (/^(pause|stop|ruk ja|rok|band kar)$/i.test(lower)) {
    return { action: 'pause', slots: {}, raw: transcript, confidence: 0.9 };
  }
  
  if (/^(next|skip|agle|agla|next song|agle gaane)$/i.test(lower)) {
    return { action: 'next', slots: {}, raw: transcript, confidence: 0.9 };
  }
  
  if (/^(previous|back|pichla|pehle wala|last song)$/i.test(lower)) {
    return { action: 'previous', slots: {}, raw: transcript, confidence: 0.9 };
  }
  
  // Volume controls
  if (/volume (up|badhao|badha|increase|high)/i.test(lower)) {
    return { action: 'volume_up', slots: {}, raw: transcript, confidence: 0.85 };
  }
  
  if (/volume (down|kam kar|ghata|decrease|low)/i.test(lower)) {
    return { action: 'volume_down', slots: {}, raw: transcript, confidence: 0.85 };
  }
  
  const volumeMatch = lower.match(/volume (ko |to )?(\d+)/i);
  if (volumeMatch) {
    const volume = parseInt(volumeMatch[2], 10);
    return { 
      action: 'volume_set', 
      slots: { volume }, 
      raw: transcript, 
      confidence: 0.85 
    };
  }
  
  // Play specific content
  const playMatch = lower.match(/play (.+)/i);
  if (playMatch) {
    const query = playMatch[1];
    
    // Check if it's liked songs request
    if (/(liked|favorite|favourite) (songs|playlist|music)/i.test(query) || 
        /my (likes|favorites|favourites)/i.test(query)) {
      return {
        action: 'play_liked_songs',
        slots: {},
        raw: transcript,
        confidence: 0.9,
      };
    }
    
    // Check if it's a playlist request
    const playlistMatch = query.match(/from (.*) playlist/i) || query.match(/playlist (.*)/i);
    if (playlistMatch) {
      return {
        action: 'play_playlist',
        slots: { playlistName: playlistMatch[1].trim() },
        raw: transcript,
        confidence: 0.85,
      };
    }
    
    // Check if it's nth track request
    const nthMatch = query.match(/(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\d+) (song|track)/i) ||
                     query.match(/song (number|num) (\d+)/i) ||
                     query.match(/track (number|num) (\d+)/i);
    if (nthMatch) {
      const numberMap: Record<string, number> = {
        'first': 1, '1st': 1,
        'second': 2, '2nd': 2,
        'third': 3, '3rd': 3,
        'fourth': 4, '4th': 4,
        'fifth': 5, '5th': 5
      };
      
      let trackNumber: number;
      if (nthMatch[2] && !isNaN(parseInt(nthMatch[2]))) {
        trackNumber = parseInt(nthMatch[2]);
      } else {
        trackNumber = numberMap[nthMatch[1].toLowerCase()] || parseInt(nthMatch[1]) || 1;
      }
      
      return {
        action: 'play_nth_track',
        slots: { trackNumber },
        raw: transcript,
        confidence: 0.85,
      };
    }
    
    // Check if it's a mood request
    const moodMatch = query.match(/(happy|calm|focus|chill|romantic|energetic|sad) (music|songs|gaane)/i);
    if (moodMatch) {
      return {
        action: 'play_mood',
        slots: { mood: moodMatch[1].toLowerCase() as MoodType },
        raw: transcript,
        confidence: 0.85,
      };
    }
    
    return {
      action: 'play_query',
      slots: { query },
      raw: transcript,
      confidence: 0.75,
    };
  }
  
  // Search
  const searchMatch = lower.match(/search (for )?(.+)/i) || lower.match(/find (.+)/i);
  if (searchMatch) {
    const query = searchMatch[2] || searchMatch[1];
    return {
      action: 'search',
      slots: { query },
      raw: transcript,
      confidence: 0.8,
    };
  }
  
  // Navigation - more flexible patterns
  if (/(open |go to |show |)?(emotion|mood)(s| detection| page)/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'emotions' },
      raw: transcript,
      confidence: 0.85,
    };
  }
  
  if (/(open |go to |show |)?library|my library/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'library' },
      raw: transcript,
      confidence: 0.85,
    };
  }
  
  if (/(open |go to |show |)?(settings|profile)/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'settings' },
      raw: transcript,
      confidence: 0.85,
    };
  }
  
  if (/(open |go to |show |go )?home( page)?/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'home' },
      raw: transcript,
      confidence: 0.85,
    };
  }
  
  if (/(open |go to |show |)?search/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'search' },
      raw: transcript,
      confidence: 0.85,
    };
  }
  
  // Help
  if (/help|what can (i|you) (say|do)|commands/i.test(lower)) {
    return { action: 'help', slots: {}, raw: transcript, confidence: 0.9 };
  }
  
  // Unknown
  return { action: 'unknown', slots: {}, raw: transcript, confidence: 0.0 };
}

export const HELP_TEXT = `
You can say commands like:
- "Play", "Pause", "Next", "Previous"
- "Volume up", "Volume down", "Volume to 50"
- "Play happy music", "Play calm songs"
- "Play first song", "Play second track"
- "Play liked songs", "Play from playlist name"
- "Play [song or artist name]"
- "Search for [query]"
- "Emotions", "Library", "Home", "Settings"
`;
