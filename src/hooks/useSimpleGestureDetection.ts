import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleGestureOptions {
  enabled: boolean;
  onGesture: (gesture: string, confidence: number) => void;
}

export const useSimpleGestureDetection = (options: SimpleGestureOptions) => {
  const [status, setStatus] = useState('Ready');
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(70);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastGestureTimeRef = useRef(0);
  const playerManagerRef = useRef<any>(null);
  const gestureStabilityRef = useRef<{
    gesture: string | null;
    count: number;
    firstSeen: number;
  }>({ gesture: null, count: 0, firstSeen: 0 });
  
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

  // Gesture stabilization tracking (declared at the top with other refs)

  // Fast, responsive gesture handler with minimal latency
  const handleGesture = (gestureType: string, confidence = 1.0) => {
    const now = Date.now();
    
    // Higher confidence threshold to reduce false positives in crowds (>=0.85)
    if (confidence < 0.85) {
      console.log('🚫 Gesture confidence too low:', gestureType, confidence);
      gestureStabilityRef.current = { gesture: null, count: 0, firstSeen: 0 };
      return;
    }
    
    // Minimal debounce - just prevent rapid duplicates within 250ms
    if (now - lastGestureTimeRef.current < 250) {
      console.log('🚫 Gesture debounced:', gestureType);
      return;
    }
    
    // Fire immediately - no stability wait needed
    lastGestureTimeRef.current = now;
    setLastGesture(gestureType);
    
    console.log('✅ Gesture detected and fired:', gestureType, 'Confidence:', confidence);
    
    // Fire gesture event immediately
    options.onGesture(gestureType, confidence);
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
      
      // Initialize MediaPipe Hands optimized for speed
      const hands = new (window as any).Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      // Configure for fast, responsive detection
      hands.setOptions({
        maxNumHands: 1, // Focus on single hand
        modelComplexity: 0, // Fastest model for minimal latency
        minDetectionConfidence: 0.65, // Lower for faster detection
        minTrackingConfidence: 0.65,  // Lower for faster tracking
      });
      
      console.log('🤖 MediaPipe Hands initialized for fast detection (low latency mode)');
      
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
      
      // Process frames at 20 FPS for fast, responsive detection
      const processFrame = async () => {
        if (video.readyState >= 2 && !isProcessing) {
          isProcessing = true;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          await hands.send({ image: canvas });
        }
      };
      
      const interval = setInterval(processFrame, 50); // 20 FPS for instant response
      
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
      setStatus('📷 Camera Permission Needed');
      setIsActive(false);
      
      toast({
        title: "🎥 Camera Access Required",
        description: "Allow camera to use hand gestures (👍✊🤘✌️). Check browser settings if blocked.",
        variant: "destructive",
        duration: 8000,
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
      
      // ULTRA-STRICT finger state detection - eliminate false positives
      const fingerTolerance = 0.06; // Much stricter threshold
      const thumbTolerance = 0.07; // Much stricter for thumb
      
      // Helper: Calculate distance between two points
      const getDistance = (p1: any, p2: any) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      };
      
      // For thumb, check if tip is SIGNIFICANTLY higher than both IP and MCP joints
      const thumb_up = thumb_tip.y < (thumb_ip.y - thumbTolerance) && 
                       thumb_tip.y < (thumb_mcp.y - thumbTolerance) &&
                       thumb_tip.y < wrist.y; // Thumb must be above wrist
      
      // For other fingers, check tip vs PIP and MCP with ultra-strict thresholds
      const index_up = index_tip.y < (index_pip.y - fingerTolerance) && 
                       index_tip.y < (index_mcp.y - fingerTolerance);
      const middle_up = middle_tip.y < (middle_pip.y - fingerTolerance) && 
                        middle_tip.y < (middle_mcp.y - fingerTolerance);
      const ring_up = ring_tip.y < (ring_pip.y - fingerTolerance) && 
                      ring_tip.y < (ring_mcp.y - fingerTolerance);
      const pinky_up = pinky_tip.y < (pinky_pip.y - fingerTolerance) && 
                       pinky_tip.y < (pinky_mcp.y - fingerTolerance);
      
      // Additional checks for gesture stability
      const fingersUp = [thumb_up, index_up, middle_up, ring_up, pinky_up].filter(Boolean).length;
      const fingersDown = [thumb_up, index_up, middle_up, ring_up, pinky_up].filter(f => !f).length;
      
      // CRITICAL: Detect open hand explicitly to reject it
      // Open hand = all fingers extended and far from palm
      const allFingersExtended = index_up && middle_up && ring_up && pinky_up;
      const fingersFarFromPalm = 
        getDistance(index_tip, wrist) > 0.25 &&
        getDistance(middle_tip, wrist) > 0.25 &&
        getDistance(ring_tip, wrist) > 0.25 &&
        getDistance(pinky_tip, wrist) > 0.20;
      
      const isOpenHand = allFingersExtended && fingersFarFromPalm;
      
      console.log('👆 Enhanced finger states:', {
        thumb: thumb_up,
        index: index_up,
        middle: middle_up,
        ring: ring_up,
        pinky: pinky_up,
        fingersUp,
        fingersDown,
        isOpenHand
      });
      
      // REJECT open hand immediately
      if (isOpenHand) {
        console.log('✋ REJECTED: Open hand detected - no gesture');
        return null;
      }
      
      // ONLY 4 gestures with STRICT detection to avoid confusion
      
      // ✊ Fist - ALL fingers clearly CURLED into palm (PLAY/PAUSE)
      // This is the HARDEST gesture to detect accurately - be ULTRA strict
      if (!thumb_up && !index_up && !middle_up && !ring_up && !pinky_up) {
        // CRITICAL: Verify fingers are actually CURLED into palm, not just down
        // Check 1: All fingertips must be below their MCP joints (curled down)
        const allFingersCurledDown = 
          index_tip.y > index_mcp.y && 
          middle_tip.y > middle_mcp.y &&
          ring_tip.y > ring_mcp.y &&
          pinky_tip.y > pinky_mcp.y;
        
        // Check 2: Fingertips must be CLOSE to wrist (curled into palm)
        const fingersCloseToWrist = 
          getDistance(index_tip, wrist) < 0.15 &&
          getDistance(middle_tip, wrist) < 0.15 &&
          getDistance(ring_tip, wrist) < 0.15;
        
        // Check 3: Thumb should be tucked in (close to hand)
        const thumbTucked = getDistance(thumb_tip, index_mcp) < 0.12;
        
        if (allFingersCurledDown && fingersCloseToWrist && thumbTucked) {
          console.log('✊ CONFIRMED: FIST (fingers curled into palm, verified) - Play/Pause');
          return 'fist';
        } else {
          console.log('❌ REJECTED: Not a proper fist - fingers not curled enough');
        }
      }
      
      // 👍 Thumbs Up - ONLY thumb up, ALL others clearly down (VOICE CONTROL)
      // Most distinct gesture - thumb must be clearly extended alone
      if (thumb_up && !index_up && !middle_up && !ring_up && !pinky_up) {
        // Extra verification: thumb tip must be significantly higher than all other fingertips
        const thumbHigherThanOthers = thumb_tip.y < index_tip.y - 0.08 && 
                                       thumb_tip.y < middle_tip.y - 0.08 &&
                                       thumb_tip.y < ring_tip.y - 0.08 &&
                                       thumb_tip.x > wrist.x - 0.1; // Thumb should be to the side
        if (thumbHigherThanOthers) {
          console.log('👍 CONFIRMED: THUMBS UP (thumb only, verified distinct) - Voice Control ONLY');
          return 'thumbs_up';
        }
      }
      
      // 🤘 Rock Hand - ONLY index and pinky up, rest down (VOLUME DOWN)
      if (!thumb_up && index_up && !middle_up && !ring_up && pinky_up && fingersUp === 2) {
        console.log('🤘 CONFIRMED: ROCK (index + pinky only) - Volume Down');
        return 'rock';
      }
      
      // ✌️ Peace Hand - ONLY index and middle up, rest down (VOLUME UP)
      if (!thumb_up && index_up && middle_up && !ring_up && !pinky_up && fingersUp === 2) {
        console.log('✌️ CONFIRMED: PEACE (index + middle only) - Volume Up');
        return 'peace';
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
