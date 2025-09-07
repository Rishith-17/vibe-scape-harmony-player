import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleGestureOptions {
  enabled: boolean;
}

export const useSimpleGestureDetection = (options: SimpleGestureOptions) => {
  const [status, setStatus] = useState('Ready');
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(70);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastGestureTimeRef = useRef(0);
  const playerManagerRef = useRef<any>(null);
  
  const { togglePlayPause, skipNext, skipPrevious, setVolume, playlist, currentIndex } = useMusicPlayer();
  const { toast } = useToast();

  // Get YouTube player manager for direct volume access
  useEffect(() => {
    import('@/lib/youtubePlayerManager').then(module => {
      playerManagerRef.current = module.default.getInstance();
    });
  }, []);

  // Get current volume from YouTube player
  const getCurrentPlayerVolume = () => {
    if (playerManagerRef.current && playerManagerRef.current.player && playerManagerRef.current.playerReady) {
      try {
        return playerManagerRef.current.player.getVolume();
      } catch (error) {
        console.log('Could not get current volume:', error);
      }
    }
    return currentVolume;
  };

  // Simple gesture handler
  const handleGesture = (gestureType: string) => {
    const now = Date.now();
    
    // Debounce gestures (500ms for better responsiveness)
    if (now - lastGestureTimeRef.current < 500) {
      console.log('🚫 Gesture debounced:', gestureType);
      return;
    }
    
    lastGestureTimeRef.current = now;
    setLastGesture(gestureType);
    
    console.log('🎯 Gesture executed:', gestureType);
    console.log('📊 Current state - Volume:', currentVolume, 'Playlist length:', playlist?.length, 'Index:', currentIndex);
    
    switch (gestureType) {
      case 'fist':
        console.log('▶️ Executing play/pause...');
        togglePlayPause();
        toast({
          title: "🎵 Gesture Control",
          description: "✊ Play/Pause",
        });
        break;
        
      case 'call_me':
        console.log('⏭️ Executing skip next...');
        console.log('⏭️ Playlist info:', { 
          length: playlist?.length || 0, 
          currentIndex, 
          tracks: playlist?.map(t => t.title) || [] 
        });
        
        if (playlist && playlist.length > 0) {
          console.log('⏭️ Calling skipNext with looping...');
          skipNext();
          toast({
            title: "🎵 Gesture Control", 
            description: "🤙 Next song",
          });
        } else {
          console.log('❌ No playlist available');
          toast({
            title: "🎵 Gesture Control",
            description: "🤙 No playlist loaded",
          });
        }
        break;
        
      case 'open_hand':
        console.log('⏮️ Executing skip previous...');
        console.log('⏮️ Playlist info:', { 
          length: playlist?.length || 0, 
          currentIndex,
          currentTime: getCurrentPlayerVolume(),
          tracks: playlist?.map(t => t.title) || [] 
        });
        
        if (playlist && playlist.length > 0) {
          console.log('⏮️ Calling skipPrevious with smart restart...');
          skipPrevious();
          toast({
            title: "🎵 Gesture Control",
            description: "🖐️ Previous song",
          });
        } else {
          console.log('❌ No playlist available');
          toast({
            title: "🎵 Gesture Control", 
            description: "🖐️ No playlist loaded",
          });
        }
        break;
        
      case 'peace':
        // Get actual current volume from player
        const actualVolume = getCurrentPlayerVolume();
        const newVolumeUp = Math.min(100, actualVolume + 5);
        console.log('🔊 Executing volume up:', actualVolume, '→', newVolumeUp);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        // Force update to ensure volume is applied
        setTimeout(() => {
          if (playerManagerRef.current && playerManagerRef.current.player) {
            playerManagerRef.current.player.setVolume(newVolumeUp);
          }
        }, 100);
        toast({
          title: "🎵 Gesture Control",
          description: `✌️ Volume up: ${newVolumeUp}%`,
        });
        break;
        
      case 'rock':
        // Get actual current volume from player
        const actualVolumeDown = getCurrentPlayerVolume();
        const newVolumeDown = Math.max(0, actualVolumeDown - 5);
        console.log('🔉 Executing volume down:', actualVolumeDown, '→', newVolumeDown);
        setCurrentVolume(newVolumeDown);
        setVolume(newVolumeDown);
        // Force update to ensure volume is applied
        setTimeout(() => {
          if (playerManagerRef.current && playerManagerRef.current.player) {
            playerManagerRef.current.player.setVolume(newVolumeDown);
          }
        }, 100);
        toast({
          title: "🎵 Gesture Control",
          description: `🤟 Volume down: ${newVolumeDown}%`,
        });
        break;
        
      default:
        console.log('❓ Unknown gesture type:', gestureType);
    }
  };

  // MediaPipe Hands gesture detection
  const startSimpleDetection = async () => {
    try {
      setStatus('Requesting camera access...');
      console.log('📱 Starting MediaPipe hand gesture detection...');
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480, 
          facingMode: 'user'
        }
      });
      
      console.log('✅ Camera access granted');
      setStatus('Loading MediaPipe libraries...');
      
      // Load MediaPipe scripts
      await loadMediaPipeScripts();
      
      console.log('📚 MediaPipe scripts loaded');
      setStatus('Initializing hand detection...');
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log('📹 Video stream ready');
            resolve();
          });
        };
      });
      
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 640;
      canvas.height = 480;
      
      setStatus('Initializing hand tracker...');
      
      // Initialize MediaPipe Hands with lower confidence
      const hands = new (window as any).Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      // Configure with optimized thresholds for gesture accuracy
      hands.setOptions({
        maxNumHands: 1, // Focus on single hand for better accuracy
        modelComplexity: 1,
        minDetectionConfidence: 0.4, // Slightly higher for accuracy
        minTrackingConfidence: 0.4,  // Slightly higher for accuracy
      });
      
      console.log('🤖 MediaPipe Hands initialized with low confidence thresholds');
      
      let isProcessing = false;
      
      // Set up results handler
      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          console.log('🖐️ Hand detected with', landmarks.length, 'landmarks');
          
          // Analyze gesture from landmarks
          const gesture = analyzeGestureFromLandmarks(landmarks);
          if (gesture) {
            console.log('✨ Gesture detected:', gesture);
            handleGesture(gesture);
          }
        } else {
          // Log when no hands are detected
          console.log('👻 No hands detected in frame');
        }
        isProcessing = false;
      });
      
      // Process frames at 5 FPS
      const processFrame = async () => {
        if (video.readyState >= 2 && !isProcessing) {
          isProcessing = true;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          await hands.send({ image: canvas });
        }
      };
      
      const interval = setInterval(processFrame, 200); // 5 FPS
      
      // Set up cleanup
      cleanupRef.current = () => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        canvas.remove();
        hands.close();
      };
      
      setStatus('🟢 Active - Show hand gestures!');
      setIsActive(true);
      
      toast({
        title: "🤚 Hand Gesture Control Ready!",
        description: "Show clear hand gestures to control music",
      });
      
    } catch (error) {
      console.error('❌ Hand gesture detection failed:', error);
      setStatus('❌ Camera access denied or not supported');
      setIsActive(false);
      
      toast({
        title: "Gesture Control Unavailable",
        description: "Please allow camera access for hand gestures",
        variant: "destructive",
      });
    }
  };

  // Load MediaPipe scripts dynamically
  const loadMediaPipeScripts = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      ];
      
      let loadedCount = 0;
      const totalScripts = scripts.length;
      
      scripts.forEach((src) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          console.log(`📦 Loaded script ${loadedCount}/${totalScripts}: ${src}`);
          if (loadedCount === totalScripts) {
            setTimeout(resolve, 100); // Small delay to ensure all scripts are ready
          }
        };
        script.onerror = () => {
          console.error(`❌ Failed to load script: ${src}`);
          reject(new Error(`Failed to load MediaPipe script: ${src}`));
        };
        document.head.appendChild(script);
      });
    });
  };

  // Analyze gesture from hand landmarks with enhanced accuracy
  const analyzeGestureFromLandmarks = (landmarks: any[]): string | null => {
    if (!landmarks || landmarks.length < 21) {
      console.log('⚠️ Insufficient landmarks for gesture analysis');
      return null;
    }
    
    try {
      // Get key landmark positions
      const thumb_tip = landmarks[4];
      const thumb_ip = landmarks[3];
      const thumb_mcp = landmarks[2];
      const index_tip = landmarks[8];
      const index_pip = landmarks[6];
      const index_mcp = landmarks[5];
      const middle_tip = landmarks[12];
      const middle_pip = landmarks[10];
      const middle_mcp = landmarks[9];
      const ring_tip = landmarks[16];
      const ring_pip = landmarks[14];
      const ring_mcp = landmarks[13];
      const pinky_tip = landmarks[20];
      const pinky_pip = landmarks[18];
      const pinky_mcp = landmarks[17];
      const wrist = landmarks[0];
      
      // Enhanced finger state detection with multiple joint analysis
      const fingerTolerance = 0.015; // Reduced for better accuracy
      const thumbTolerance = 0.025; // Thumb needs different tolerance
      
      // For thumb, check if tip is higher than both IP and MCP joints
      const thumb_up = thumb_tip.y < (thumb_ip.y - thumbTolerance) && thumb_tip.y < (thumb_mcp.y - thumbTolerance);
      
      // For other fingers, check tip vs PIP and MCP
      const index_up = index_tip.y < (index_pip.y - fingerTolerance) && index_tip.y < (index_mcp.y - fingerTolerance);
      const middle_up = middle_tip.y < (middle_pip.y - fingerTolerance) && middle_tip.y < (middle_mcp.y - fingerTolerance);
      const ring_up = ring_tip.y < (ring_pip.y - fingerTolerance) && ring_tip.y < (ring_mcp.y - fingerTolerance);
      const pinky_up = pinky_tip.y < (pinky_pip.y - fingerTolerance) && pinky_tip.y < (pinky_mcp.y - fingerTolerance);
      
      // Additional checks for gesture stability
      const fingersUp = [thumb_up, index_up, middle_up, ring_up, pinky_up].filter(Boolean).length;
      const fingersDown = [thumb_up, index_up, middle_up, ring_up, pinky_up].filter(f => !f).length;
      
      console.log('👆 Enhanced finger states:', {
        thumb: thumb_up,
        index: index_up,
        middle: middle_up,
        ring: ring_up,
        pinky: pinky_up,
        fingersUp,
        fingersDown
      });
      
      // Enhanced gesture recognition with stricter patterns
      
      // Fist - all fingers down (strictest check)
      if (fingersDown === 5) {
        console.log('✊ CONFIRMED: FIST (all fingers down)');
        return 'fist';
      }
      
      // Open hand - all fingers up (strictest check)  
      if (fingersUp === 5) {
        console.log('🖐️ CONFIRMED: OPEN HAND (all fingers up)');
        return 'open_hand';
      }
      
      // Peace sign - only index and middle up, others down
      if (!thumb_up && index_up && middle_up && !ring_up && !pinky_up && fingersUp === 2) {
        console.log('✌️ CONFIRMED: PEACE (index + middle only)');
        return 'peace';
      }
      
      // Rock/horns - only index and pinky up, others down
      if (!thumb_up && index_up && !middle_up && !ring_up && pinky_up && fingersUp === 2) {
        console.log('🤟 CONFIRMED: ROCK (index + pinky only)');
        return 'rock';
      }
      
      // Call me - only thumb and pinky up, others down
      if (thumb_up && !index_up && !middle_up && !ring_up && pinky_up && fingersUp === 2) {
        console.log('🤙 CONFIRMED: CALL ME (thumb + pinky only)');
        return 'call_me';
      }
      
      // Log unmatched patterns for debugging
      console.log('❓ No gesture pattern matched - Fingers up:', fingersUp, 'Pattern:', {
        thumb: thumb_up ? '👍' : '👎',
        index: index_up ? '👍' : '👎', 
        middle: middle_up ? '👍' : '👎',
        ring: ring_up ? '👍' : '👎',
        pinky: pinky_up ? '👍' : '👎'
      });
      
      return null;
      
    } catch (error) {
      console.error('❌ Error analyzing landmarks:', error);
      return null;
    }
  };




  // Initialize when enabled
  useEffect(() => {
    if (options.enabled && !isActive) {
      console.log('🚀 Starting gesture detection...');
      // Initialize volume from localStorage or default
      if (typeof window !== 'undefined') {
        const savedVolume = localStorage.getItem('vibescape_volume');
        if (savedVolume) {
          const vol = parseInt(savedVolume, 10);
          if (!isNaN(vol)) {
            setCurrentVolume(vol);
          }
        }
      }
      startSimpleDetection();
    }
    
    return () => {
      if (cleanupRef.current) {
        console.log('🧹 Cleaning up gesture detection...');
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setIsActive(false);
      setStatus('Stopped');
    };
  }, [options.enabled]); // Only depend on enabled flag

  // Save volume to localStorage when it changes  
  useEffect(() => {
    localStorage.setItem('vibescape_volume', currentVolume.toString());
  }, [currentVolume]);

  return {
    status,
    isActive,
    lastGesture,
  };
};
