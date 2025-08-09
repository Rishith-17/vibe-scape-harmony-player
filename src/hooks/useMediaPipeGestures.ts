import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MediaPipeGestureOptions {
  enabled: boolean;
  detectionInterval: number;
  confidenceThreshold: number;
}

// Enhanced gesture detection functions for music control
const isOpenPalm = (landmarks: any[]): boolean => {
  try {
    // ✋ Open palm → Play/Pause - All five fingers extended
    const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
    const fingerMcps = [5, 9, 13, 17]; // MCP joints (base of fingers)
    
    // Count extended fingers
    const extendedFingers = fingerTips.filter((tip, i) => {
      const mcp = fingerMcps[i];
      return landmarks[tip].y < landmarks[mcp].y - 0.02;
    }).length;
    
    // Thumb check (different logic for thumb)
    const thumbExtended = landmarks[4].x > landmarks[3].x + 0.02;
    
    console.log(`✋ Open palm check: ${extendedFingers}/4 fingers extended, thumb: ${thumbExtended}`);
    return extendedFingers >= 4 && thumbExtended; // All fingers must be extended
  } catch (error) {
    console.error('Error in isOpenPalm:', error);
    return false;
  }
};

const isFist = (landmarks: any[]): boolean => {
  try {
    // ✊ Fist → Stop/Pause - All fingers curled down
    const fingerTips = [8, 12, 16, 20];
    const fingerMcps = [5, 9, 13, 17];
    
    const curledFingers = fingerTips.filter((tip, i) => {
      const mcp = fingerMcps[i];
      return landmarks[tip].y > landmarks[mcp].y + 0.02;
    }).length;
    
    // Thumb curled check
    const thumbCurled = landmarks[4].x < landmarks[3].x + 0.02;
    
    console.log(`✊ Fist check: ${curledFingers}/4 fingers curled, thumb curled: ${thumbCurled}`);
    return curledFingers >= 3 && thumbCurled;
  } catch (error) {
    console.error('Error in isFist:', error);
    return false;
  }
};

const isPointingGesture = (landmarks: any[]): boolean => {
  try {
    // 👉 Point → Next song - Only index finger extended
    const indexUp = landmarks[8].y < landmarks[5].y - 0.03;
    const middleDown = landmarks[12].y > landmarks[9].y + 0.02;
    const ringDown = landmarks[16].y > landmarks[13].y + 0.02;
    const pinkyDown = landmarks[20].y > landmarks[17].y + 0.02;
    const thumbDown = landmarks[4].x < landmarks[3].x + 0.02;
    
    console.log(`👉 Point check: index=${indexUp}, others down: middle=${middleDown}, ring=${ringDown}, pinky=${pinkyDown}, thumb=${thumbDown}`);
    return indexUp && middleDown && ringDown && pinkyDown;
  } catch (error) {
    console.error('Error in isPointingGesture:', error);
    return false;
  }
};

const isFiveFingers = (landmarks: any[]): boolean => {
  try {
    // 🖐️ Five fingers → Previous song - All fingers spread wide
    const fingerTips = [4, 8, 12, 16, 20]; // Include thumb
    const fingerMcps = [2, 5, 9, 13, 17]; // MCP joints
    
    const extendedFingers = fingerTips.filter((tip, i) => {
      const mcp = fingerMcps[i];
      if (i === 0) { // Thumb special case
        return landmarks[tip].x > landmarks[mcp].x + 0.03;
      }
      return landmarks[tip].y < landmarks[mcp].y - 0.02;
    }).length;
    
    console.log(`🖐️ Five fingers check: ${extendedFingers}/5 fingers extended`);
    return extendedFingers >= 4; // Allow some tolerance
  } catch (error) {
    console.error('Error in isFiveFingers:', error);
    return false;
  }
};

const isPeaceSign = (landmarks: any[]): boolean => {
  try {
    // ✌️ Peace sign → Volume up - Index and middle finger up, others down
    const indexUp = landmarks[8].y < landmarks[5].y - 0.03;
    const middleUp = landmarks[12].y < landmarks[9].y - 0.03;
    const ringDown = landmarks[16].y > landmarks[13].y + 0.02;
    const pinkyDown = landmarks[20].y > landmarks[17].y + 0.02;
    const thumbDown = landmarks[4].x < landmarks[3].x + 0.02;
    
    console.log(`✌️ Peace sign check: index=${indexUp}, middle=${middleUp}, ring=${!ringDown}, pinky=${!pinkyDown}, thumb=${!thumbDown}`);
    return indexUp && middleUp && ringDown && pinkyDown;
  } catch (error) {
    console.error('Error in isPeaceSign:', error);
    return false;
  }
};

const isRockSign = (landmarks: any[]): boolean => {
  try {
    // 🤟 Rock sign → Volume down - Index and pinky up, middle and ring down
    const indexUp = landmarks[8].y < landmarks[5].y - 0.03;
    const middleDown = landmarks[12].y > landmarks[9].y + 0.02;
    const ringDown = landmarks[16].y > landmarks[13].y + 0.02;
    const pinkyUp = landmarks[20].y < landmarks[17].y - 0.03;
    const thumbUp = landmarks[4].x > landmarks[3].x + 0.02;
    
    console.log(`🤟 Rock sign check: index=${indexUp}, pinky=${pinkyUp}, middle=${!middleDown}, ring=${!ringDown}, thumb=${thumbUp}`);
    return indexUp && pinkyUp && middleDown && ringDown;
  } catch (error) {
    console.error('Error in isRockSign:', error);
    return false;
  }
};

export const useMediaPipeGestures = (options: MediaPipeGestureOptions) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastGestureRef = useRef<string | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(70);
  
  const { togglePlayPause, skipNext, skipPrevious, setVolume } = useMusicPlayer();
  const { user } = useAuth();
  const { toast } = useToast();

  const executeGestureAction = useCallback((gesture: string) => {
    const now = Date.now();
    const timeSinceLastGesture = now - lastGestureTimeRef.current;
    
    // Debounce gestures to prevent rapid firing
    if (lastGestureRef.current === gesture && timeSinceLastGesture < 2000) {
      return;
    }

    lastGestureRef.current = gesture;
    lastGestureTimeRef.current = now;
    setLastGesture(gesture);

    console.log(`🤚 Executing gesture: ${gesture}`);

    switch (gesture) {
      case 'open_palm':
        togglePlayPause();
        toast({
          title: "🎵 Gesture Control",
          description: "✋ Play/Pause toggled",
        });
        break;
        
      case 'fist':
        togglePlayPause(); // Same as open palm for now
        toast({
          title: "🎵 Gesture Control", 
          description: "✊ Stop/Pause",
        });
        break;
        
      case 'pointing':
        skipNext();
        toast({
          title: "🎵 Gesture Control",
          description: "👉 Next song",
        });
        break;
        
      case 'five_fingers':
        skipPrevious();
        toast({
          title: "🎵 Gesture Control",
          description: "🖐️ Previous song",
        });
        break;
        
      case 'peace_sign':
        const newVolumeUp = Math.min(100, currentVolume + 10);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        toast({
          title: "🎵 Gesture Control",
          description: `✌️ Volume up: ${newVolumeUp}%`,
        });
        break;
        
      case 'rock_sign':
        const newVolumeDown = Math.max(0, currentVolume - 10);
        setCurrentVolume(newVolumeDown);
        setVolume(newVolumeDown);
        toast({
          title: "🎵 Gesture Control",
          description: `🤟 Volume down: ${newVolumeDown}%`,
        });
        break;
        
      default:
        console.log(`Unknown gesture: ${gesture}`);
    }
  }, [togglePlayPause, skipNext, skipPrevious, setVolume, currentVolume, toast]);

  const onResults = useCallback((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      console.log('👀 No hands detected in frame');
      return;
    }

    console.log(`🤚 Hand detected! Processing ${results.multiHandLandmarks.length} hand(s)`);
    
    // Use the first detected hand
    const landmarks = results.multiHandLandmarks[0];
    
    if (!landmarks || landmarks.length < 21) {
      console.log('❌ Invalid hand landmarks');
      return;
    }
    
    console.log('🔍 Analyzing hand landmarks for gestures...');
    
    // Detect gestures with priority order (most specific first)
    let detectedGesture = null;
    
    if (isRockSign(landmarks)) {
      detectedGesture = 'rock_sign';
    } else if (isPeaceSign(landmarks)) {
      detectedGesture = 'peace_sign';
    } else if (isPointingGesture(landmarks)) {
      detectedGesture = 'pointing';
    } else if (isFist(landmarks)) {
      detectedGesture = 'fist';
    } else if (isFiveFingers(landmarks)) {
      detectedGesture = 'five_fingers';
    } else if (isOpenPalm(landmarks)) {
      detectedGesture = 'open_palm';
    }

    if (detectedGesture) {
      console.log(`🎯 Gesture detected: ${detectedGesture}`);
      executeGestureAction(detectedGesture);
    } else {
      console.log('🤷 No recognized gesture found');
    }
  }, [executeGestureAction]);

  const initializeMediaPipe = useCallback(async () => {
    try {
      console.log('🤚 Initializing MediaPipe hands...');
      console.log('🔧 Detection will run every', options.detectionInterval, 'ms');
      
      // Request camera permission first
      console.log('📹 Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Create hidden video element
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.style.display = 'none';
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        document.body.appendChild(videoRef.current);
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play();
            resolve(void 0);
          };
        });
      }

      console.log('📹 Camera permission granted, initializing MediaPipe...');

      // Initialize MediaPipe Hands
      handsRef.current = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1, // Better accuracy
        minDetectionConfidence: 0.3, // Lower threshold for better detection
        minTrackingConfidence: 0.2, // Very low for continuous tracking
      });

      handsRef.current.onResults(onResults);

      // Initialize camera with throttled detection
      let lastProcessTime = 0;
      
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          const now = Date.now();
          if (handsRef.current && videoRef.current && (now - lastProcessTime) >= options.detectionInterval) {
            lastProcessTime = now;
            setIsDetecting(true);
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user'
      });

      await cameraRef.current.start();
      setIsInitialized(true);
      
      console.log('✅ MediaPipe hands initialized successfully');
      console.log('🎯 Gesture detection is now running every', options.detectionInterval, 'ms');
      
      toast({
        title: "Gesture Detection Active",
        description: "Camera initialized successfully",
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      
      let errorMessage = "Failed to initialize gesture detection";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported on this device.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsInitialized(false);
      setIsDetecting(false);
    }
  }, [options.confidenceThreshold, options.detectionInterval, onResults, toast]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up MediaPipe resources...');
    
    setIsDetecting(false);
    
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    
    if (videoRef.current) {
      document.body.removeChild(videoRef.current);
      videoRef.current = null;
    }
    
    setIsInitialized(false);
  }, []);

  // Initialize when enabled (allow even without user for testing)
  useEffect(() => {
    if (options.enabled && !isInitialized) {
      console.log('🚀 Starting gesture detection...');
      initializeMediaPipe();
    } else if (!options.enabled && isInitialized) {
      console.log('🛑 Stopping gesture detection...');
      cleanup();
    }
  }, [options.enabled, isInitialized, initializeMediaPipe, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isInitialized,
    isDetecting,
    lastGesture,
    cleanup
  };
};