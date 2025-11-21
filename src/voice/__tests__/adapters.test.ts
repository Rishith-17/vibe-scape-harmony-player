import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicAdapter } from '../adapters/MusicAdapter';
import { ScrollAdapter } from '../adapters/ScrollAdapter';
import { NavigationAdapter } from '../adapters/NavigationAdapter';

describe('MusicAdapter', () => {
  let mockMusicController: any;
  let adapter: MusicAdapter;

  beforeEach(() => {
    mockMusicController = {
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      previous: vi.fn(),
      playNthTrack: vi.fn(),
      playPlaylist: vi.fn(),
      playLikedSongs: vi.fn(),
      setVolume: vi.fn(),
      adjustVolume: vi.fn(),
      isPlaying: vi.fn(() => false),
    };
    adapter = new MusicAdapter(mockMusicController);
  });

  it('should call play on controller', async () => {
    await adapter.play();
    expect(mockMusicController.play).toHaveBeenCalled();
  });

  it('should call playAtIndex with correct index', async () => {
    await adapter.playAtIndex(3);
    expect(mockMusicController.playNthTrack).toHaveBeenCalledWith(3);
  });

  it('should adjust volume by delta', () => {
    adapter.adjustVolume(10);
    expect(mockMusicController.adjustVolume).toHaveBeenCalledWith(10);
  });

  it('should set volume to specific value', () => {
    adapter.setVolume(75);
    expect(mockMusicController.setVolume).toHaveBeenCalledWith(75);
  });
});

describe('ScrollAdapter', () => {
  let adapter: ScrollAdapter;

  beforeEach(() => {
    adapter = new ScrollAdapter();
    // Mock window.scrollBy
    global.window.scrollBy = vi.fn();
    global.window.scrollTo = vi.fn();
  });

  it('should scroll down by medium amount', () => {
    adapter.scrollDown('medium');
    expect(window.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    );
  });

  it('should scroll to top', () => {
    adapter.scrollToTop();
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        behavior: 'smooth',
      })
    );
  });

  it('should scroll to section by data-section attribute', () => {
    // Mock DOM
    const mockElement = {
      scrollIntoView: vi.fn(),
    };
    document.querySelector = vi.fn(() => mockElement as any);

    const success = adapter.scrollToSection('global-top');
    expect(success).toBe(true);
    expect(document.querySelector).toHaveBeenCalledWith('[data-section="global-top"]');
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
  });

  it('should return false if section not found', () => {
    document.querySelector = vi.fn(() => null);
    const success = adapter.scrollToSection('nonexistent');
    expect(success).toBe(false);
  });
});

describe('NavigationAdapter', () => {
  let mockNavController: any;
  let adapter: NavigationAdapter;

  beforeEach(() => {
    mockNavController = {
      openHome: vi.fn(),
      openLibrary: vi.fn(),
      openEmotionDetection: vi.fn(),
      openSettings: vi.fn(),
      openSearch: vi.fn(),
    };
    adapter = new NavigationAdapter(mockNavController);
  });

  it('should open home', () => {
    adapter.openHome();
    expect(mockNavController.openHome).toHaveBeenCalled();
  });

  it('should open library', () => {
    adapter.openLibrary();
    expect(mockNavController.openLibrary).toHaveBeenCalled();
  });

  it('should open emotions', () => {
    adapter.openEmotions();
    expect(mockNavController.openEmotionDetection).toHaveBeenCalled();
  });
});
