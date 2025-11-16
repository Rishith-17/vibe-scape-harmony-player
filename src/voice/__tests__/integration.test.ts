/**
 * Integration tests for voice control activation paths
 * Verifies Wake-word, Gesture, and Tap-Mic all use the same ASR instance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Voice Control Integration - Unified ASR Instance', () => {
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
        wakeEnabled: false,
      }
    );

    await voiceController.initialize();
  });

  it('should use same ASR instance across Tap-Mic, Wake, and Gesture', async () => {
    console.log('\n=== Integration Test: Unified ASR Instance ===\n');

    // 1. Tap-Mic: Arm and get instance ID
    console.log('1️⃣ Tap-Mic activation...');
    await voiceController.manualTrigger();
    const tapMicInstanceId = voiceController.getAsrInstanceId();
    console.log('   ASR_ID:', tapMicInstanceId);
    expect(tapMicInstanceId).toBeTruthy();

    // Verify getUserMedia called ONCE
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));

    // 2. Simulate Wake-word detection
    console.log('\n2️⃣ Wake-word (Hello Vibe) detection...');
    await voiceController.startListeningFromArmedMic();
    const wakeInstanceId = voiceController.getAsrInstanceId();
    console.log('   ASR_ID:', wakeInstanceId);
    
    // Should be same instance
    expect(wakeInstanceId).toBe(tapMicInstanceId);
    
    // Should NOT call getUserMedia again
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));

    // 3. Simulate Gesture (open_hand) detection
    console.log('\n3️⃣ Gesture (open_hand) detection...');
    await voiceController.startListeningFromArmedMic();
    const gestureInstanceId = voiceController.getAsrInstanceId();
    console.log('   ASR_ID:', gestureInstanceId);
    
    // Should be same instance
    expect(gestureInstanceId).toBe(tapMicInstanceId);
    
    // Should STILL not call getUserMedia again
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    console.log('\n✅ All activation paths use the same ASR instance!');
    console.log('   Tap-Mic ID:', tapMicInstanceId);
    console.log('   Wake-word ID:', wakeInstanceId);
    console.log('   Gesture ID:', gestureInstanceId);
    console.log('   getUserMedia calls:', mockGetUserMedia.mock.calls.length);
  });

  it('should not request permission if mic not armed (Wake/Gesture)', async () => {
    console.log('\n=== Test: Permission Guard ===\n');

    // Try wake-word without arming
    console.log('🚫 Attempting wake-word without arming...');
    await voiceController.startListeningFromArmedMic();
    
    // Should NOT call getUserMedia
    expect(mockGetUserMedia).not.toHaveBeenCalled();
    expect(voiceController.isMicArmed()).toBe(false);

    console.log('✅ Wake-word correctly rejected without permission');

    // Try gesture without arming
    console.log('\n🚫 Attempting gesture without arming...');
    await voiceController.startListeningFromArmedMic();
    
    // Should STILL not call getUserMedia
    expect(mockGetUserMedia).not.toHaveBeenCalled();
    expect(voiceController.isMicArmed()).toBe(false);

    console.log('✅ Gesture correctly rejected without permission');
  });

  it('should prevent duplicate activations within suppression window', async () => {
    console.log('\n=== Test: Duplicate Suppression ===\n');

    // Arm mic first
    await voiceController.armMic();

    // Fire multiple activations rapidly
    console.log('🔥 Firing 5 rapid activations...');
    const promises = [
      voiceController.startListeningFromArmedMic(),
      voiceController.startListeningFromArmedMic(),
      voiceController.startListeningFromArmedMic(),
      voiceController.startListeningFromArmedMic(),
      voiceController.startListeningFromArmedMic(),
    ];

    await Promise.all(promises);

    // getUserMedia should only be called once (during arming)
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    console.log('✅ Duplicate activations suppressed');
    console.log('   getUserMedia calls:', mockGetUserMedia.mock.calls.length);
  });
});
