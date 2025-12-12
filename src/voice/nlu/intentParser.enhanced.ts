import { VoiceIntent, VoiceAction, MoodType, NavigationTarget } from '../types';

/**
 * Enhanced Intent Parser - Comprehensive NLU for full app voice control
 * Supports: playback, indexing, search, navigation, scrolling, selection, volume, system commands
 */

// Ordinal and number word mappings
const NUMBER_WORDS: Record<string, number> = {
  'first': 1, '1st': 1, 'one': 1,
  'second': 2, '2nd': 2, 'two': 2,
  'third': 3, '3rd': 3, 'three': 3,
  'fourth': 4, '4th': 4, 'four': 4,
  'fifth': 5, '5th': 5, 'five': 5,
  'sixth': 6, '6th': 6, 'six': 6,
  'seventh': 7, '7th': 7, 'seven': 7,
  'eighth': 8, '8th': 8, 'eight': 8,
  'ninth': 9, '9th': 9, 'nine': 9,
  'tenth': 10, '10th': 10, 'ten': 10,
};

// Section name mappings
const SECTION_NAMES: Record<string, string> = {
  'global': 'global-top',
  'global top': 'global-top',
  'global top music': 'global-top',
  'global top music videos': 'global-top',
  'trending': 'global-top',
  'new': 'new-releases',
  'new releases': 'new-releases',
  'country': 'top-by-country',
  'country top': 'top-by-country',
  'top by country': 'top-by-country',
  'language': 'top-by-state',
  'language top': 'top-by-state',
  'top by language': 'top-by-state',
  'emotions': 'emotions',
  'emotion': 'emotions',
  'library': 'library',
  'home': 'home',
};

/**
 * Parse natural language transcript into structured intent
 */
export function parseIntent(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase().trim();
  
  // 1. System commands
  if (/^(stop listening|cancel|exit|quit)$/i.test(lower)) {
    return { action: 'stop_listening', slots: {}, raw: transcript, confidence: 0.95 };
  }
  
  if (/^(help|what can (i|you) (say|do)|commands|show commands)$/i.test(lower)) {
    return { action: 'help', slots: {}, raw: transcript, confidence: 0.95 };
  }
  
  // 2. Basic playback controls
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
  
  // 3. Volume controls
  if (/volume (up|badhao|badha|increase|high)/i.test(lower)) {
    return { action: 'volume_up', slots: {}, raw: transcript, confidence: 0.85 };
  }
  
  if (/volume (down|kam kar|ghata|decrease|low)/i.test(lower)) {
    return { action: 'volume_down', slots: {}, raw: transcript, confidence: 0.85 };
  }
  
  const volumeMatch = lower.match(/volume (ko |to )?(\d+)/i);
  if (volumeMatch) {
    const volume = parseInt(volumeMatch[2], 10);
    return { action: 'volume_set', slots: { volume }, raw: transcript, confidence: 0.85 };
  }
  
  if (/^(mute|silence)$/i.test(lower)) {
    return { action: 'volume_set', slots: { volume: 0 }, raw: transcript, confidence: 0.85 };
  }
  
  if (/^(unmute)$/i.test(lower)) {
    return { action: 'volume_set', slots: { volume: 70 }, raw: transcript, confidence: 0.85 };
  }
  
  // 4. Scrolling commands
  if (/scroll\s+(down|neeche)/i.test(lower)) {
    const amount = extractScrollAmount(lower);
    return { action: 'scroll_down', slots: { amount }, raw: transcript, confidence: 0.88 };
  }
  
  if (/scroll\s+(up|upar)/i.test(lower)) {
    const amount = extractScrollAmount(lower);
    return { action: 'scroll_up', slots: { amount }, raw: transcript, confidence: 0.88 };
  }
  
  if (/(scroll to|go to|show me|open)\s+(.+?)\s+(section|page)?/i.test(lower)) {
    const match = lower.match(/(scroll to|go to|show me|open)\s+(.+?)(\s+(section|page))?$/i);
    if (match && match[2]) {
      const sectionName = match[2].trim();
      const sectionId = SECTION_NAMES[sectionName] || sectionName;
      return { action: 'scroll_to_section', slots: { sectionId }, raw: transcript, confidence: 0.85 };
    }
  }
  
  if (/(go to|scroll to)\s+(bottom|top|end|start)/i.test(lower)) {
    const match = lower.match(/(bottom|top|end|start)/i);
    if (match) {
      const position = match[1];
      return { 
        action: position === 'bottom' || position === 'end' ? 'scroll_to_bottom' : 'scroll_to_top',
        slots: {},
        raw: transcript,
        confidence: 0.88
      };
    }
  }
  
  // 5. Play by index/position in section
  // Pattern: "play the second song in global top music videos"
  const indexInSectionMatch = lower.match(/(play|open|select)\s+(?:the\s+)?(\w+)\s+(song|track|item|video)\s+(?:in|from)\s+(.+)/i);
  if (indexInSectionMatch) {
    const numberWord = indexInSectionMatch[2];
    const sectionPhrase = indexInSectionMatch[4];
    const trackNumber = NUMBER_WORDS[numberWord] || parseInt(numberWord, 10);
    const sectionId = SECTION_NAMES[sectionPhrase.trim()] || sectionPhrase.trim();
    
    if (trackNumber && sectionId) {
      return {
        action: 'play_item_in_section',
        slots: { trackNumber, sectionId },
        raw: transcript,
        confidence: 0.92,
      };
    }
  }
  
  // Pattern: "play item 3 in global top"
  const itemNumInSectionMatch = lower.match(/(play|open|select)\s+(?:item|number|song|track)\s+(\d+)\s+(?:in|from)\s+(.+)/i);
  if (itemNumInSectionMatch) {
    const trackNumber = parseInt(itemNumInSectionMatch[2], 10);
    const sectionPhrase = itemNumInSectionMatch[3].trim();
    const sectionId = SECTION_NAMES[sectionPhrase] || sectionPhrase;
    
    return {
      action: 'play_item_in_section',
      slots: { trackNumber, sectionId },
      raw: transcript,
      confidence: 0.92,
    };
  }
  
  // 6. Open section and play item
  // Pattern: "open global top music videos and play item three"
  const openAndPlayMatch = lower.match(/(open|show)\s+(.+?)\s+and\s+play\s+(?:item|song|track|number)?\s*(\w+)/i);
  if (openAndPlayMatch) {
    const sectionPhrase = openAndPlayMatch[2].trim();
    const numberWord = openAndPlayMatch[3];
    const sectionId = SECTION_NAMES[sectionPhrase] || sectionPhrase;
    const trackNumber = NUMBER_WORDS[numberWord] || parseInt(numberWord, 10);
    
    if (sectionId && trackNumber) {
      return {
        action: 'open_and_play',
        slots: { sectionId, trackNumber },
        raw: transcript,
        confidence: 0.90,
      };
    }
  }
  
  // 7. Play playlist from Library
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
  
  // 8. Play liked songs
  if (/^(play|chalao)\s+(my\s+)?(liked|favorite|favourite)\s+(songs|playlist|music)/i.test(lower) ||
      /^(liked|favorite|favourite)\s+(songs|playlist)/i.test(lower)) {
    return {
      action: 'play_liked_songs',
      slots: {},
      raw: transcript,
      confidence: 0.90,
    };
  }
  
  // 9. Search and play
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
  
  // Hinglish: "X search karo", "X chalao"
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
  
  // 10. Play by mood
  const playMatch = lower.match(/^play\s+(.+)/i);
  if (playMatch) {
    const query = playMatch[1];
    
    // Check for nth track in current list
    const nthMatch = query.match(/(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\d+)\s+(song|track)/i) ||
                     query.match(/song\s+(number|num)\s+(\d+)/i) ||
                     query.match(/track\s+(number|num)\s+(\d+)/i);
    if (nthMatch) {
      let trackNumber: number;
      if (nthMatch[2] && !isNaN(parseInt(nthMatch[2]))) {
        trackNumber = parseInt(nthMatch[2]);
      } else {
        trackNumber = NUMBER_WORDS[nthMatch[1].toLowerCase()] || parseInt(nthMatch[1]) || 1;
      }
      
      return {
        action: 'play_nth_track',
        slots: { trackNumber },
        raw: transcript,
        confidence: 0.88,
      };
    }
    
    // Check for mood
    const moodMatch = query.match(/(happy|calm|focus|chill|romantic|energetic|sad)\s+(music|songs|gaane)/i);
    if (moodMatch) {
      return {
        action: 'play_mood',
        slots: { mood: moodMatch[1].toLowerCase() as MoodType },
        raw: transcript,
        confidence: 0.88,
      };
    }
    
    // Default: play query (search in current context)
    return {
      action: 'play_query',
      slots: { query },
      raw: transcript,
      confidence: 0.75,
    };
  }
  
  // 11. Navigation commands
  if (/^(open\s+|go\s+to\s+)?search$/i.test(lower)) {
    return {
      action: 'navigate',
      slots: { navigation: 'search' },
      raw: transcript,
      confidence: 0.90,
    };
  }
  
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
  
  if (/^(back|go back)$/i.test(lower)) {
    return {
      action: 'navigate_back',
      slots: {},
      raw: transcript,
      confidence: 0.90,
    };
  }
  
  // 12. Unknown
  return { action: 'unknown', slots: {}, raw: transcript, confidence: 0.0 };
}

/**
 * Extract scroll amount from command
 */
function extractScrollAmount(lower: string): 'small' | 'medium' | 'large' | 'page' {
  if (/(a little|slightly|bit)/i.test(lower)) return 'small';
  if (/(a lot|much|way)/i.test(lower)) return 'large';
  if (/(page|screen)/i.test(lower)) return 'page';
  return 'medium';
}

/**
 * Help text for voice commands
 */
export const ENHANCED_HELP_TEXT = `
🎵 Voice Commands:

📍 Playback:
- "play", "pause", "resume", "next", "previous"
- "play the second song in global top music videos"
- "play playlist Focus"
- "play liked songs"

📂 Playlists:
- "create a playlist called Road Trip"
- "open playlist Road Trip"
- "play my Focus playlist"

🎭 Emotion:
- "detect my emotion" - Capture & play matching playlist
- "scan my face and play music"

🔍 Search:
- "search for lo-fi beats" (auto-plays first result)

🧭 Navigation:
- "go home", "open library", "open emotions"
- "go back"

🔊 Volume:
- "volume up/down", "volume to 50"

💡 System:
- "help" - Show this list
- "stop listening" - End voice session

🌐 Hinglish:
- "Arijit Singh chalao"
- "volume ko 50 kar"
`;
