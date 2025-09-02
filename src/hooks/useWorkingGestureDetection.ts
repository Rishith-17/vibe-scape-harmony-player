import { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

interface WorkingGestureOptions {
  enabled: boolean;
  detectionInterval?: number;
}

export const useWorkingGestureDetection = (options: WorkingGestureOptions) => {
  const [status, setStatus] = useState('Starting...');
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(70);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastGestureRef = useRef<{ type: string | null; time: number }>({ type: null, time: 0 });
  
  const { togglePlayPause, skipNext, skipPrevious, setVolume } = useMusicPlayer();
  const { toast } = useToast();

  const detectGesturePattern = useCallback((landmarks: any[]) => {
    try {
      // Simplified but accurate gesture detection
      const fingerTips = [4, 8, 12, 16, 20];
      const fingerBases = [2, 5, 9, 13, 17];
      
      // Check finger states
      const fingersExtended = [];
      
      // Thumb (x-axis check)
      fingersExtended[0] = landmarks[4].x > landmarks[3].x;
      
      // Other fingers (y-axis check)
      for (let i = 1; i < 5; i++) {
        fingersExtended[i] = landmarks[fingerTips[i]].y < landmarks[fingerBases[i]].y;
      }
      
      const extendedCount = fingersExtended.filter(Boolean).length;
      
      // Gesture patterns
      if (extendedCount === 0) {
        return 'fist'; // ✊ Play/Pause
      }
      
      if (extendedCount === 5) {
        return 'open_hand'; // 🖐️ Previous Song
      }
      
      // Peace: index + middle
      if (extendedCount === 2 && fingersExtended[1] && fingersExtended[2]) {
        return 'peace'; // ✌️ Volume Up
      }
      
      // Call me: thumb + pinky
      if (extendedCount === 2 && fingersExtended[0] && fingersExtended[4]) {
        return 'call_me'; // 🤙 Next Song
      }
      
      // Rock: index + pinky
      if (extendedCount === 2 && fingersExtended[1] && fingersExtended[4]) {
        return 'rock'; // 🤟 Volume Down
      }
      
      return null;
    } catch (error) {
      console.error('Gesture detection error:', error);
      return null;
    }
  }, []);

  const handleGesture = useCallback((gestureType: string) => {
    const now = Date.now();
    const lastGesture = lastGestureRef.current;
    
    // Prevent gesture spam (1.5 second cooldown)
    if (gestureType !== lastGesture.type || now - lastGesture.time > 1500) {
      lastGestureRef.current = { type: gestureType, time: now };
      setLastGesture(gestureType);
      
      console.log('🎯 Gesture detected:', gestureType);
      
      switch (gestureType) {
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
          
        case 'open_hand':
          skipPrevious();
          toast({
            title: "🎵 Gesture Control",
            description: "🖐️ Previous song",
          });
          break;
          
        case 'peace':
          const newVolumeUp = Math.min(100, currentVolume + 10);
          setCurrentVolume(newVolumeUp);
          setVolume(newVolumeUp);
          toast({
            title: "🎵 Gesture Control",
            description: `✌️ Volume up: ${newVolumeUp}%`,
          });
          break;
          
        case 'rock':
          const newVolumeDown = Math.max(0, currentVolume - 10);
          setCurrentVolume(newVolumeDown);
          setVolume(newVolumeDown);
          toast({
            title: "🎵 Gesture Control",
            description: `🤟 Volume down: ${newVolumeDown}%`,
          });
          break;
      }
    }
  }, [togglePlayPause, skipNext, skipPrevious, setVolume, currentVolume, toast]);

  const handleResults = useCallback((results: any) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const gesture = detectGesturePattern(landmarks);
    
    if (gesture) {
      handleGesture(gesture);
    }
  }, [detectGesturePattern, handleGesture]);

  const loadMediaPipeScripts = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if ((window as any).Hands) {
        resolve();
        return;
      }

      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script2.onload = () => resolve();
        script2.onerror = () => reject(new Error('Failed to load MediaPipe hands'));
        document.head.appendChild(script2);
      };
      script1.onerror = () => reject(new Error('Failed to load MediaPipe camera utils'));
      document.head.appendChild(script1);
    });
  }, []);

  const initializeHandTracking = useCallback(async () => {
    try {
      // Load MediaPipe via script injection (works better than imports)
      await loadMediaPipeScripts();
      
      setStatus('Initializing hand detection...');
      
      // Initialize hands with global MediaPipe
      const hands = new (window as any).Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Use lighter model
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(handleResults);

      setStatus('Starting detection loop...');

      // Manual processing loop (avoids Camera constructor)
      const processVideo = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await hands.send({ image: videoRef.current });
          } catch (err) {
            console.log('Processing frame failed:', err);
          }
        }
      };

      // Start processing loop
      intervalRef.current = setInterval(processVideo, options.detectionInterval || 100); // 10 FPS
      
      setStatus('🟢 Active - Show your gestures!');
      setIsActive(true);

      toast({
        title: "🤚 Gesture Control Active",
        description: "Camera ready - Show hand gestures to control music!",
      });

    } catch (error) {
      console.error('MediaPipe initialization failed:', error);
      setStatus('Hand tracking failed to load');
      toast({
        title: "Gesture Error",
        description: "Failed to initialize hand tracking",
        variant: "destructive",
      });
    }
  }, [handleResults, options.detectionInterval, toast, loadMediaPipeScripts]);

  const startGestureDetection = useCallback(async () => {
    if (!options.enabled) {
      console.log('🚫 Gesture detection disabled');
      return;
    }

    try {
      setStatus('Requesting camera permission...');
      
      // Simple camera setup without MediaPipe
      const constraints = {
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
          frameRate: { ideal: 15 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create hidden video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'position:fixed;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(video);
      videoRef.current = video;

      // Wait for video to load
      video.onloadedmetadata = () => {
        video.play().then(() => {
          setStatus('Camera ready - Starting gesture detection...');
          initializeHandTracking();
        }).catch(err => {
          setStatus('Video play failed: ' + err.message);
        });
      };

    } catch (error) {
      console.error('Camera setup failed:', error);
      let errorMessage = "Failed to access camera";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission required for gesture control";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera not supported on this device";
        }
      }
      
      setStatus(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [options.enabled, initializeHandTracking, toast]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up gesture detection...');
    
    setIsActive(false);
    setStatus('Stopped');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      videoRef.current = null;
    }
  }, []);

  // Initialize when enabled
  useEffect(() => {
    if (options.enabled && !isActive) {
      startGestureDetection();
    } else if (!options.enabled && isActive) {
      cleanup();
    }
  }, [options.enabled, isActive, startGestureDetection, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    isActive,
    lastGesture,
    cleanup
  };
};
