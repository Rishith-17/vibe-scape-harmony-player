import { describe, it, expect } from 'vitest';
import { parseIntent } from '../nlu/intentParser.enhanced';

describe('IntentParser - Comprehensive Voice Control', () => {
  describe('Basic playback controls', () => {
    it('should parse play command', () => {
      const intent = parseIntent('play');
      expect(intent.action).toBe('play');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should parse pause command', () => {
      const intent = parseIntent('pause');
      expect(intent.action).toBe('pause');
    });

    it('should parse next/previous', () => {
      expect(parseIntent('next').action).toBe('next');
      expect(parseIntent('previous').action).toBe('previous');
    });
  });

  describe('Volume controls', () => {
    it('should parse volume up/down', () => {
      expect(parseIntent('volume up').action).toBe('volume_up');
      expect(parseIntent('volume down').action).toBe('volume_down');
    });

    it('should parse volume set', () => {
      const intent = parseIntent('volume to 50');
      expect(intent.action).toBe('volume_set');
      expect(intent.slots.volume).toBe(50);
    });

    it('should parse mute/unmute', () => {
      expect(parseIntent('mute').action).toBe('volume_set');
      expect(parseIntent('unmute').action).toBe('volume_set');
    });
  });

  describe('Play by index in section', () => {
    it('should parse "play the second song in global top"', () => {
      const intent = parseIntent('play the second song in global top music videos');
      expect(intent.action).toBe('play_item_in_section');
      expect(intent.slots.trackNumber).toBe(2);
      expect(intent.slots.sectionId).toBe('global-top');
    });

    it('should parse "play item 3 in new releases"', () => {
      const intent = parseIntent('play item 3 in new releases');
      expect(intent.action).toBe('play_item_in_section');
      expect(intent.slots.trackNumber).toBe(3);
      expect(intent.slots.sectionId).toBe('new-releases');
    });

    it('should parse ordinal words', () => {
      const tests = [
        { input: 'play the first song in global top', expected: 1 },
        { input: 'play the third track in new releases', expected: 3 },
        { input: 'play the fifth item in country top', expected: 5 },
      ];

      tests.forEach(({ input, expected }) => {
        const intent = parseIntent(input);
        expect(intent.action).toBe('play_item_in_section');
        expect(intent.slots.trackNumber).toBe(expected);
      });
    });
  });

  describe('Open and play', () => {
    it('should parse "open global top and play item 3"', () => {
      const intent = parseIntent('open global top music videos and play item three');
      expect(intent.action).toBe('open_and_play');
      expect(intent.slots.sectionId).toBe('global-top');
      expect(intent.slots.trackNumber).toBe(3);
    });
  });

  describe('Scrolling commands', () => {
    it('should parse scroll down/up', () => {
      expect(parseIntent('scroll down').action).toBe('scroll_down');
      expect(parseIntent('scroll up').action).toBe('scroll_up');
    });

    it('should parse scroll amounts', () => {
      const intent = parseIntent('scroll down a little');
      expect(intent.action).toBe('scroll_down');
      expect(intent.slots.amount).toBe('small');
    });

    it('should parse scroll to section', () => {
      const intent = parseIntent('scroll to global top music videos');
      expect(intent.action).toBe('scroll_to_section');
      expect(intent.slots.sectionId).toBe('global-top');
    });

    it('should parse scroll to top/bottom', () => {
      expect(parseIntent('go to bottom').action).toBe('scroll_to_bottom');
      expect(parseIntent('go to top').action).toBe('scroll_to_top');
    });
  });

  describe('Navigation', () => {
    it('should parse navigation commands', () => {
      const tests = [
        { input: 'go home', nav: 'home' },
        { input: 'open library', nav: 'library' },
        { input: 'open emotions', nav: 'emotions' },
        { input: 'open settings', nav: 'settings' },
      ];

      tests.forEach(({ input, nav }) => {
        const intent = parseIntent(input);
        expect(intent.action).toBe('navigate');
        expect(intent.slots.navigation).toBe(nav);
      });
    });

    it('should parse back command', () => {
      const intent = parseIntent('go back');
      expect(intent.action).toBe('navigate_back');
    });
  });

  describe('Playlist and mood', () => {
    it('should parse play playlist', () => {
      const intent = parseIntent('play playlist Focus');
      expect(intent.action).toBe('play_playlist');
      expect(intent.slots.playlistName).toBe('focus');
    });

    it('should parse play liked songs', () => {
      const intent = parseIntent('play my liked songs');
      expect(intent.action).toBe('play_liked_songs');
    });

    it('should parse play mood', () => {
      const intent = parseIntent('play happy music');
      expect(intent.action).toBe('play_mood');
      expect(intent.slots.mood).toBe('happy');
    });
  });

  describe('Search', () => {
    it('should parse search commands', () => {
      const intent = parseIntent('search for lo-fi beats');
      expect(intent.action).toBe('search_and_play');
      expect(intent.slots.query).toBe('lo-fi beats');
    });

    it('should parse Hinglish search', () => {
      const intent = parseIntent('Arijit Singh chalao');
      expect(intent.action).toBe('search_and_play');
      expect(intent.slots.query).toBe('arijit singh');
    });
  });

  describe('System commands', () => {
    it('should parse help', () => {
      expect(parseIntent('help').action).toBe('help');
    });

    it('should parse stop listening', () => {
      expect(parseIntent('stop listening').action).toBe('stop_listening');
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown commands', () => {
      const intent = parseIntent('do something random');
      expect(intent.action).toBe('unknown');
      expect(intent.confidence).toBe(0);
    });

    it('should handle ambiguous commands with low confidence', () => {
      const intent = parseIntent('play something');
      expect(intent.confidence).toBeLessThan(0.8);
    });
  });
});
