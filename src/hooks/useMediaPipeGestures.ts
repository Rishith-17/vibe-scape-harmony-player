import { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MediaPipeGestureOptions {
  enabled: boolean;
  detectionInterval: number;
  confidenceThreshold: number;
}

// Simplified gesture detection functions for better reliability
const detectGesture = (landmarks: any[]): string | null => {
  try {
    // Extract finger tip and joint positions for gesture recognition
    const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky tips
    const fingerPIPs = [3, 6, 10, 14, 18]; // finger joints for comparison
    
    // Check which fingers are extended (up)
    const fingersUp = [];
    
    // Thumb (horizontal check)
    fingersUp.push(landmarks[4].x > landmarks[3].x ? 1 : 0);
    
    // Other fingers (vertical check)
    for (let i = 1; i < 5; i++) {
      fingersUp.push(landmarks[fingerTips[i]].y < landmarks[fingerPIPs[i]].y ? 1 : 0);
    }
    
    const totalFingers = fingersUp.reduce((a, b) => a + b, 0);
    
    console.log(`🤚 Finger states: [${fingersUp.join(', ')}], Total up: ${totalFingers}`);
    
    // Gesture classification based on finger patterns
    if (totalFingers === 0) {
      console.log('✊ Detected: Fist (Play/Pause)');
      return 'fist';
    } else if (totalFingers === 5) {
      console.log('🖐️ Detected: Five fingers (Previous Song)');
      return 'five_fingers';
    } else if (totalFingers === 2 && fingersUp[1] === 1 && fingersUp[2] === 1) {
      console.log('✌️ Detected: Peace sign (Volume Up)');
      return 'peace_sign';  
    } else if (totalFingers === 2 && fingersUp[0] === 1 && fingersUp[4] === 1) {
      console.log('🤙 Detected: Call me (Next Song)');
      return 'call_me';
    } else if (totalFingers === 2 && fingersUp[1] === 1 && fingersUp[4] === 1) {
      console.log('🤟 Detected: Rock sign (Volume Down)');
      return 'rock_sign';
    }
    
    return null;
  } catch (error) {
    console.error('Error in gesture detection:', error);
    return null;
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
      return; // No hands detected - this is normal, don't spam logs
    }
    
    // Use the first detected hand
    const landmarks = results.multiHandLandmarks[0];
    
    if (!landmarks || landmarks.length < 21) {
      console.log('❌ Invalid hand landmarks received');
      return;
    }
    
    // Detect gesture using simplified approach
    const detectedGesture = detectGesture(landmarks);

    if (detectedGesture) {
      console.log(`🎯 Gesture detected: ${detectedGesture}`);
      executeGestureAction(detectedGesture);
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
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
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
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 15000);
        
        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          videoRef.current!.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current!.removeEventListener('error', onError);
          
          videoRef.current!.play()
            .then(() => {
              console.log('📹 Video ready for MediaPipe processing');
              resolve();
            })
            .catch(reject);
        };
        
        const onError = () => {
          clearTimeout(timeout);
          videoRef.current!.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current!.removeEventListener('error', onError);
          reject(new Error('Video loading failed'));
        };
        
        videoRef.current!.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current!.addEventListener('error', onError);
        
        // If already loaded
        if (videoRef.current!.readyState >= 2) {
          onLoadedMetadata();
        }
      });

      console.log('📹 Camera stream ready, initializing MediaPipe Hands...');

      // Use the already installed MediaPipe package
      const { Hands } = await import('@mediapipe/hands');
      
      handsRef.current = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Fastest model
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      handsRef.current.onResults(onResults);

      console.log('✅ MediaPipe Hands initialized successfully');
      setIsInitialized(true);

      // Start detection loop with proper frame processing
      const detectGestures = async () => {
        if (handsRef.current && videoRef.current && streamRef.current && videoRef.current.readyState >= 2) {
          try {
            setIsDetecting(true);
            await handsRef.current.send({ image: videoRef.current });
            setTimeout(() => setIsDetecting(false), 200);
          } catch (error) {
            console.error('🔴 Detection frame error:', error);
          }
        }

        // Continue detection loop if stream is active
        if (streamRef.current) {
          animationFrameRef.current = window.setTimeout(detectGestures, options.detectionInterval);
        }
      };

      // Start the detection loop
      detectGestures();

      console.log('🎯 Gesture detection loop started');
      
      toast({
        title: "🤚 Gesture Control Active",
        description: "Camera ready - Show hand gestures to control music!",
      });

    } catch (error) {
      console.error('❌ Gesture detection initialization failed:', error);
      
      let errorMessage = "Failed to start gesture detection";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission required for gesture control";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported on this device";
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