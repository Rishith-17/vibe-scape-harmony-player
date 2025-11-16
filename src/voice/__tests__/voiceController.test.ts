/**
 * Unit tests for VoiceController singleton pattern
 * Verifies single shared ASR/mic instance across all activation paths
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock MediaStream
class MockMediaStream {
  id = `stream-${Date.now()}`;
  getTracks = vi.fn(() => []);
}

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  
  start = vi.fn();
  stop = vi.fn();
}

// Setup global mocks
(global as any).SpeechRecognition = MockSpeechRecognition;
(global as any).webkitSpeechRecognition = MockSpeechRecognition;

describe('VoiceController - Singleton Pattern', () => {
  let voiceController: any;
  let mockMusicController: any;
  let mockNavController: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock getUserMedia to return fake MediaStream
    mockGetUserMedia.mockResolvedValue(new MockMediaStream());

    // Create mock controllers
    mockMusicController = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      next: vi.fn().mockResolvedValue(undefined),
      previous: vi.fn().mockResolvedValue(undefined),
      playQuery: vi.fn().mockResolvedValue(undefined),
      playMood: vi.fn().mockResolvedValue(undefined),
      playNthTrack: vi.fn().mockResolvedValue(undefined),
      playLikedSongs: vi.fn().mockResolvedValue(undefined),
      playPlaylist: vi.fn().mockResolvedValue(undefined),
      searchAndPlay: vi.fn().mockResolvedValue(undefined),
      setVolume: vi.fn(),
      adjustVolume: vi.fn(),
    };

    mockNavController = {
      openEmotionDetection: vi.fn(),
      openLibrary: vi.fn(),
      openSettings: vi.fn(),
      openHome: vi.fn(),
      openSearch: vi.fn(),
    };

    // Import VoiceController
    const { VoiceController } = await import('../voiceController');
    
    voiceController = new VoiceController(
      mockMusicController,
      mockNavController,
      {
        language: 'en-US',
        wakeSensitivity: 0.5,
        ttsEnabled: false,
        wakeEnabled: false, // Disable wake word for tests
      }
    );

    await voiceController.initialize();
  });

  describe('armMic()', () => {
    it('should request microphone permission and create shared ASR instance', async () => {
      // Verify mic not armed initially
      expect(voiceController.isMicArmed()).toBe(false);
      expect(voiceController.getAsrInstanceId()).toBeNull();

      // Arm the mic
      await voiceController.armMic();

      // Verify getUserMedia was called ONCE
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Verify mic is armed
      expect(voiceController.isMicArmed()).toBe(true);
      
      // Verify instance ID is set
      const instanceId = voiceController.getAsrInstanceId();
      expect(instanceId).toBeTruthy();
      expect(instanceId).toMatch(/^ASR-\d+-[a-z0-9]+$/);
    });

    it('should reuse shared instance on subsequent armMic() calls', async () => {
      // Arm once
      await voiceController.armMic();
      const firstInstanceId = voiceController.getAsrInstanceId();
      
      // Arm again
      await voiceController.armMic();
      const secondInstanceId = voiceController.getAsrInstanceId();

      // Verify getUserMedia was only called ONCE
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

      // Verify same instance ID
      expect(secondInstanceId).toBe(firstInstanceId);
    });
  });

  describe('startListeningFromArmedMic()', () => {
    it('should start shared ASR instance when mic is armed', async () => {
      // Arm the mic first
      await voiceController.armMic();
      const instanceId = voiceController.getAsrInstanceId();

      // Start listening
      await voiceController.startListeningFromArmedMic();

      // Verify no new getUserMedia call (reusing shared instance)
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

      // Verify same instance ID
      expect(voiceController.getAsrInstanceId()).toBe(instanceId);
    });

    it('should reject when mic is not armed', async () => {
      // Try to start listening without arming
      await voiceController.startListeningFromArmedMic();

      // Should not call getUserMedia
      expect(mockGetUserMedia).not.toHaveBeenCalled();

      // Should not be armed
      expect(voiceController.isMicArmed()).toBe(false);
    });

    it('should suppress duplicate calls within 300ms', async () => {
      // Arm the mic
      await voiceController.armMic();

      // Start listening twice in quick succession
      const promise1 = voiceController.startListeningFromArmedMic();
      const promise2 = voiceController.startListeningFromArmedMic();

      await Promise.all([promise1, promise2]);

      // Verify getUserMedia was only called once (for arming)
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe('manualTrigger() - Tap-Mic flow', () => {
    it('should arm mic on first tap and start listening', async () => {
      // First tap - should arm
      await voiceController.manualTrigger();

      // Verify getUserMedia was called
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

      // Verify mic is armed
      expect(voiceController.isMicArmed()).toBe(true);
      
      const instanceId = voiceController.getAsrInstanceId();
      expect(instanceId).toBeTruthy();

      console.log('[Test] Tap-Mic ASR_ID:', instanceId);
    });

    it('should reuse shared instance on subsequent taps', async () => {
      // First tap
      await voiceController.manualTrigger();
      const firstInstanceId = voiceController.getAsrInstanceId();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 400));

      // Second tap
      await voiceController.manualTrigger();
      const secondInstanceId = voiceController.getAsrInstanceId();

      // Verify getUserMedia was only called once
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

      // Verify same instance ID
      expect(secondInstanceId).toBe(firstInstanceId);

      console.log('[Test] Reused ASR_ID:', secondInstanceId);
    });
  });

  describe('Instance ID verification', () => {
    it('should return null before arming', () => {
      expect(voiceController.getAsrInstanceId()).toBeNull();
    });

    it('should return consistent ID after arming', async () => {
      await voiceController.armMic();
      
      const id1 = voiceController.getAsrInstanceId();
      const id2 = voiceController.getAsrInstanceId();
      const id3 = voiceController.getAsrInstanceId();

      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
      expect(id1).toBeTruthy();
    });
  });
});
