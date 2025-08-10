import { useEffect, useRef, useState, useCallback } from 'react';
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

  const initializeMediaPipe = useCallback(async () => {
    if (!options.enabled) {
      console.log('🚫 Gesture detection disabled');
      return;
    }

    try {
      console.log('🤚 Initializing MediaPipe hands...');
      console.log('🔧 Detection will run every', options.detectionInterval, 'ms');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Clean up existing resources
      cleanup();

      // Request camera permission with progressive fallback
      console.log('📹 Requesting camera permission...');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 15, max: 30 }
          } 
        });
      } catch (error) {
        console.log('📹 Fallback to basic video...');
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      // Create hidden video element
      videoRef.current = document.createElement('video');
      videoRef.current.style.position = 'absolute';
      videoRef.current.style.top = '-9999px';
      videoRef.current.style.width = '1px';
      videoRef.current.style.height = '1px';
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      videoRef.current.srcObject = stream;
      document.body.appendChild(videoRef.current);
      
      // Wait for video to be ready with proper error handling
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video initialization timeout'));
        }, 15000);
        
        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          videoRef.current!.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current!.removeEventListener('error', onError);
          
          videoRef.current!.play()
            .then(() => {
              console.log('📹 Video element ready for MediaPipe');
              resolve();
            })
            .catch((playError) => {
              console.error('Video play failed:', playError);
              reject(playError);
            });
        };
        
        const onError = (error: Event) => {
          clearTimeout(timeout);
          videoRef.current!.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current!.removeEventListener('error', onError);
          reject(new Error('Video element error'));
        };
        
        videoRef.current!.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current!.addEventListener('error', onError);
        
        // If already loaded
        if (videoRef.current!.readyState >= 2) {
          onLoadedMetadata();
        }
      });

      console.log('📹 Camera ready, initializing MediaPipe Hands...');

      // Initialize MediaPipe Hands with optimized settings
      const { Hands } = await import('@mediapipe/hands');
      handsRef.current = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Fastest model for real-time
        minDetectionConfidence: 0.7, // Higher confidence for better accuracy
        minTrackingConfidence: 0.5, // Balanced tracking
      });

      handsRef.current.onResults(onResults);

      // Initialize camera with optimized frame processing
      let lastProcessTime = 0;
      let isProcessing = false;
      
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          const now = Date.now();
          if (handsRef.current && 
              videoRef.current && 
              !isProcessing &&
              (now - lastProcessTime) >= options.detectionInterval) {
            
            lastProcessTime = now;
            isProcessing = true;
            setIsDetecting(true);
            
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.error('MediaPipe processing error:', error);
            } finally {
              isProcessing = false;
              setTimeout(() => setIsDetecting(false), 500);
            }
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user'
      });

      await cameraRef.current.start();
      setIsInitialized(true);
      
      console.log('✅ MediaPipe hands initialized successfully');
      console.log('🎯 Gesture detection is now active every', options.detectionInterval, 'ms');
      
      toast({
        title: "🤚 Gesture Detection Active",
        description: "Camera ready - Show gestures to control music!",
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize gesture detection:', error);
      
      let errorMessage = "Failed to initialize gesture detection";
      let errorTitle = "Camera Error";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
          errorTitle = "Camera Permission Required";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
          errorTitle = "No Camera Found";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported on this device.";
          errorTitle = "Camera Not Supported";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Camera initialization timeout. Please refresh and try again.";
          errorTitle = "Initialization Timeout";
        } else {
          errorMessage = `Initialization failed: ${error.message}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up on error
      setIsInitialized(false);
      setIsDetecting(false);
      
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
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
    
    if (videoRef.current && videoRef.current.parentNode) {
      if (videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      videoRef.current.parentNode.removeChild(videoRef.current);
      videoRef.current = null;
    }
    
    setIsInitialized(false);
  }, []);

  // Initialize when enabled and music is playing
  useEffect(() => {
    if (options.enabled && !isInitialized) {
      console.log('🚀 Starting gesture detection for music control...');
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