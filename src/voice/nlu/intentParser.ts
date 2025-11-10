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
  
  // Play playlist from Library (high priority)
  if (/^(play|chalao|start|lagao)\s+(playlist\s+|from\s+library\s+)?(.+)/i.test(lower) &&
      (/playlist|from\s+library/i.test(lower))) {
    const match = lower.match(/^(play|chalao|start|lagao)\s+(?:playlist\s+|from\s+library\s+)?(.+)/i);
    if (match && match[2]) {
      const playlistName = match[2].trim();
      return {
        action: 'play_playlist',
        slots: { playlistName },
        raw: transcript,
        confidence: 0.92,
      };
    }
  }
  
  // Play liked songs
  if (/^(play|chalao)\s+(my\s+)?(liked|favorite|favourite)\s+(songs|playlist|music)/i.test(lower) ||
      /^(liked|favorite|favourite)\s+(songs|playlist)/i.test(lower)) {
    return {
      action: 'play_liked_songs',
      slots: {},
      raw: transcript,
      confidence: 0.90,
    };
  }
  
  // Search and Play (auto-play first result)
  if (/^(search|find|dhundho|khojo)\s+(.+)/i.test(lower)) {
    const match = lower.match(/^(search|find|dhundho|khojo)\s+(.+)/i);
    if (match && match[2]) {
      const query = match[2].trim();
      return {
        action: 'search_and_play',
        slots: { query },
        raw: transcript,
        confidence: 0.88,
      };
    }
  }
  
  // Hinglish search patterns: "X search karo", "X chalao"
  if (/(.+)\s+(search\s+karo|chalao|dhundho)/i.test(lower)) {
    const match = lower.match(/(.+)\s+(search\s+karo|chalao|dhundho)/i);
    if (match && match[1]) {
      const query = match[1].trim();
      return {
        action: 'search_and_play',
        slots: { query },
        raw: transcript,
        confidence: 0.85,
      };
    }
  }
  
  // Play specific content (general pattern)
  const playMatch = lower.match(/^play\s+(.+)/i);
  if (playMatch) {
    const query = playMatch[1];
    
    // Check if it's nth track request
    const nthMatch = query.match(/(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\d+)\s+(song|track)/i) ||
                     query.match(/song\s+(number|num)\s+(\d+)/i) ||
                     query.match(/track\s+(number|num)\s+(\d+)/i);
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
        confidence: 0.88,
      };
    }
    
    // Check if it's a mood request
    const moodMatch = query.match(/(happy|calm|focus|chill|romantic|energetic|sad)\s+(music|songs|gaane)/i);
    if (moodMatch) {
      return {
        action: 'play_mood',
        slots: { mood: moodMatch[1].toLowerCase() as MoodType },
        raw: transcript,
        confidence: 0.88,
      };
    }
    
    // Default to play query (search in current playlist)
    return {
      action: 'play_query',
      slots: { query },
      raw: transcript,
      confidence: 0.75,
    };
  }
  
  // Navigate to search (without auto-play)
  if (/^(open\s+|go\s+to\s+)?search$/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'search' },
      raw: transcript,
      confidence: 0.90,
    };
  }
  
  // Navigation - flexible patterns
  if (/(open|go\s+to|show|jaao|kholo)?\s*(emotion|mood)(s|detection|page)?/i.test(lower) && 
      !/(playlist|song|music)/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'emotions' },
      raw: transcript,
      confidence: 0.88,
    };
  }
  
  if (/(open|go\s+to|show|jaao|kholo)?\s*library/i.test(lower) ||
      /^library$/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'library' },
      raw: transcript,
      confidence: 0.88,
    };
  }
  
  if (/(open|go\s+to|show|jaao|kholo)?\s*(settings|profile)/i.test(lower) ||
      /^settings$/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'settings' },
      raw: transcript,
      confidence: 0.88,
    };
  }
  
  if (/(go\s+)?home(\s+page)?/i.test(lower) || 
      /^home$/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'home' },
      raw: transcript,
      confidence: 0.90,
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
Voice Commands:

🎵 Playback:
- "play", "pause", "resume", "next", "previous"
- "play playlist [name]" - Play from Library
- "search [artist/song]" - Auto-play first result
- "play happy/calm/focus music" - Play mood
- "play first/second song" - Play nth track

🔊 Volume:
- "volume up/down"
- "volume to 50"

🧭 Navigation:
- "go home"
- "open library/emotions/settings"

💡 System:
- "help" or "what can I say?"

🌐 Hinglish:
- "playlist Focus chalao"
- "Arijit Singh search karo"
- "volume ko 50 kar"
- "agle gaane"
`;
