import { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MediaPipeGestureOptions {
  enabled: boolean;
  detectionInterval: number;
  confidenceThreshold: number;
}

// Enhanced gesture detection functions for music control
const isCallMeGesture = (landmarks: any[]): boolean => {
  try {
    // 🤙 Call me gesture → Next song - Thumb and pinky extended, others curled
    const thumbExtended = landmarks[4].x > landmarks[3].x + 0.03;
    const indexCurled = landmarks[8].y > landmarks[5].y + 0.02;
    const middleCurled = landmarks[12].y > landmarks[9].y + 0.02;
    const ringCurled = landmarks[16].y > landmarks[13].y + 0.02;
    const pinkyExtended = landmarks[20].y < landmarks[17].y - 0.03;
    
    console.log(`🤙 Call me gesture check: thumb=${thumbExtended}, pinky=${pinkyExtended}, others curled: index=${indexCurled}, middle=${middleCurled}, ring=${ringCurled}`);
    return thumbExtended && pinkyExtended && indexCurled && middleCurled && ringCurled;
  } catch (error) {
    console.error('Error in isCallMeGesture:', error);
    return false;
  }
};

const isFist = (landmarks: any[]): boolean => {
  try {
    // ✊ Fist → Play/Pause - All fingers curled down
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

// Removed pointing gesture - replaced with call me gesture

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
  const handsRef = useRef<any | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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
      case 'fist':
        togglePlayPause();
        toast({
          title: "🎵 Gesture Control", 
          description: "✊ Play/Pause",
        });
        break;
        
      case 'call_me':
        skipNext();
        toast({
          title: "🎵 Gesture Control",
          description: "🤙 Next song",
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

  const onResults = useCallback((results: any) => {
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
    } else if (isCallMeGesture(landmarks)) {
      detectedGesture = 'call_me';
    } else if (isFist(landmarks)) {
      detectedGesture = 'fist';
    } else if (isFiveFingers(landmarks)) {
      detectedGesture = 'five_fingers';
    }

    if (detectedGesture) {
      console.log(`🎯 Gesture detected: ${detectedGesture}`);
      executeGestureAction(detectedGesture);
    } else {
      console.log('🤷 No recognized gesture found');
    }
  }, [executeGestureAction]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up gesture detection...');
    
    setIsDetecting(false);
    setIsInitialized(false);
    
    // Stop detection loop
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Close MediaPipe hands
    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (error) {
        console.error('Error closing MediaPipe:', error);
      }
      handsRef.current = null;
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Remove video element
    if (videoRef.current) {
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      videoRef.current = null;
    }
  }, []);

  const startGestureDetection = useCallback(async () => {
    if (!options.enabled) {
      console.log('🚫 Gesture detection disabled');
      return;
    }

    try {
      console.log('🤚 Starting gesture detection for music control...');
      
      // Clean up existing resources
      cleanup();

      // Request camera permission
      console.log('📹 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 }
        }
      });

      streamRef.current = stream;

      // Create invisible video element for processing
      videoRef.current = document.createElement('video');
      videoRef.current.style.cssText = 'position:fixed;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      videoRef.current.srcObject = stream;
      document.body.appendChild(videoRef.current);

      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
        
        videoRef.current!.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoRef.current!.play().then(resolve).catch(reject);
        };
      });

      console.log('📹 Camera stream ready, loading MediaPipe...');

      // Load MediaPipe Hands model
      try {
        // Use CDN version with proper loading
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load MediaPipe script'));
        });

        // @ts-ignore - MediaPipe global
        const { Hands } = window;
        
        if (!Hands) {
          throw new Error('MediaPipe Hands not available');
        }

        handsRef.current = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
          }
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        handsRef.current.onResults(onResults);

        console.log('✅ MediaPipe Hands loaded successfully');
        setIsInitialized(true);

        // Start detection loop
        const detectGestures = async () => {
          if (handsRef.current && videoRef.current && streamRef.current) {
            try {
              setIsDetecting(true);
              await handsRef.current.send({ image: videoRef.current });
              setTimeout(() => setIsDetecting(false), 300);
            } catch (error) {
              console.error('Detection error:', error);
            }
          }

          if (streamRef.current) {
            animationFrameRef.current = window.setTimeout(detectGestures, options.detectionInterval);
          }
        };

        detectGestures();

        toast({
          title: "🤚 Gesture Control Active",
          description: "Show hand gestures to control music!",
        });

      } catch (scriptError) {
        console.error('MediaPipe loading error:', scriptError);
        throw new Error('Failed to load MediaPipe library');
      }

    } catch (error) {
      console.error('❌ Gesture detection initialization failed:', error);
      
      let errorMessage = "Failed to start gesture detection";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission required for gesture control";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });

      cleanup();
    }
  }, [options, onResults, toast, cleanup]);

  // Initialize when enabled
  useEffect(() => {
    if (options.enabled && !isInitialized) {
      startGestureDetection();
    } else if (!options.enabled && isInitialized) {
      cleanup();
    }
  }, [options.enabled, isInitialized, startGestureDetection, cleanup]);

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