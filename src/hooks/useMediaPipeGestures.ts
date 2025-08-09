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

// Gesture detection functions
const isOpenPalm = (landmarks: any[]): boolean => {
  // Check if all fingers are extended
  const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
  const fingerPips = [6, 10, 14, 18]; // PIP joints
  
  return fingerTips.every((tip, i) => {
    const pip = fingerPips[i];
    return landmarks[tip].y < landmarks[pip].y; // Tip above PIP = extended
  }) && landmarks[4].x > landmarks[3].x; // Thumb extended
};

const isPeaceSign = (landmarks: any[]): boolean => {
  // Index and middle finger up, others down
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringDown = landmarks[16].y > landmarks[14].y;
  const pinkyDown = landmarks[20].y > landmarks[18].y;
  
  return indexUp && middleUp && ringDown && pinkyDown;
};

const isFist = (landmarks: any[]): boolean => {
  // All fingers curled down
  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [6, 10, 14, 18];
  
  return fingerTips.every((tip, i) => {
    const pip = fingerPips[i];
    return landmarks[tip].y > landmarks[pip].y; // Tip below PIP = curled
  });
};

const isThumbsUp = (landmarks: any[]): boolean => {
  // Thumb up, other fingers down
  const thumbUp = landmarks[4].y < landmarks[3].y;
  const fingersDown = [8, 12, 16, 20].every((tip, i) => {
    const pip = [6, 10, 14, 18][i];
    return landmarks[tip].y > landmarks[pip].y;
  });
  
  return thumbUp && fingersDown;
};

const isThumbsDown = (landmarks: any[]): boolean => {
  // Thumb down, other fingers curled
  const thumbDown = landmarks[4].y > landmarks[3].y;
  const fingersDown = [8, 12, 16, 20].every((tip, i) => {
    const pip = [6, 10, 14, 18][i];
    return landmarks[tip].y > landmarks[pip].y;
  });
  
  return thumbDown && fingersDown;
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
          title: "Gesture Control",
          description: "Play/Pause toggled",
        });
        break;
        
      case 'peace_sign':
        skipNext();
        toast({
          title: "Gesture Control",
          description: "Next song",
        });
        break;
        
      case 'fist':
        skipPrevious();
        toast({
          title: "Gesture Control",
          description: "Previous song",
        });
        break;
        
      case 'thumbs_up':
        const newVolumeUp = Math.min(100, currentVolume + 10);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        toast({
          title: "Gesture Control",
          description: `Volume: ${newVolumeUp}%`,
        });
        break;
        
      case 'thumbs_down':
        const newVolumeDown = Math.max(0, currentVolume - 10);
        setCurrentVolume(newVolumeDown);
        setVolume(newVolumeDown);
        toast({
          title: "Gesture Control",
          description: `Volume: ${newVolumeDown}%`,
        });
        break;
        
      default:
        console.log(`Unknown gesture: ${gesture}`);
    }
  }, [togglePlayPause, skipNext, skipPrevious, setVolume, currentVolume, toast]);

  const onResults = useCallback((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    // Use the first detected hand
    const landmarks = results.multiHandLandmarks[0];
    
    // Detect gestures
    let detectedGesture = null;
    
    if (isOpenPalm(landmarks)) {
      detectedGesture = 'open_palm';
    } else if (isPeaceSign(landmarks)) {
      detectedGesture = 'peace_sign';
    } else if (isFist(landmarks)) {
      detectedGesture = 'fist';
    } else if (isThumbsUp(landmarks)) {
      detectedGesture = 'thumbs_up';
    } else if (isThumbsDown(landmarks)) {
      detectedGesture = 'thumbs_down';
    }

    if (detectedGesture) {
      executeGestureAction(detectedGesture);
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
        modelComplexity: 0, // Faster detection
        minDetectionConfidence: options.confidenceThreshold,
        minTrackingConfidence: 0.3, // Lower for better tracking
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