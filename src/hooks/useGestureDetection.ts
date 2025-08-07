import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GestureDetectionOptions {
  enabled: boolean;
  detectionInterval: number; // milliseconds between captures
  confidenceThreshold: number; // minimum confidence for gesture recognition
}

interface GestureResult {
  gesture: string | null;
  confidence: number;
  timestamp: number;
}

export const useGestureDetection = (options: GestureDetectionOptions) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastGestureRef = useRef<string | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  
  const { togglePlayPause, skipNext, skipPrevious, setVolume } = useMusicPlayer();
  const { user } = useAuth();
  const { toast } = useToast();

  // Current volume state for incremental changes
  const [currentVolume, setCurrentVolume] = useState(70);

  const initializeCamera = useCallback(async () => {
    try {
      console.log('Initializing camera for gesture detection...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // Create hidden video element
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.style.display = 'none';
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        document.body.appendChild(videoRef.current);
      }

      // Create hidden canvas for image capture
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        document.body.appendChild(canvasRef.current);
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });

      setIsInitialized(true);
      console.log('Camera initialized successfully');
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera for gesture detection",
        variant: "destructive",
      });
    }
  }, [toast]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) {
      return null;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) return null;

    // Draw current video frame to canvas
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    
    // Convert to base64 image data
    return canvasRef.current.toDataURL('image/jpeg', 0.8);
  }, [isInitialized]);

  const processGesture = useCallback(async (imageData: string): Promise<GestureResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('gesture-detection', {
        body: { imageData }
      });

      if (error) {
        console.error('Gesture detection error:', error);
        return null;
      }

      return data as GestureResult;
    } catch (error) {
      console.error('Failed to process gesture:', error);
      return null;
    }
  }, []);

  const executeGestureAction = useCallback((gesture: string) => {
    const now = Date.now();
    const timeSinceLastGesture = now - lastGestureTimeRef.current;
    
    // Prevent rapid repeated actions (debounce)
    if (lastGestureRef.current === gesture && timeSinceLastGesture < 2000) {
      return;
    }

    lastGestureRef.current = gesture;
    lastGestureTimeRef.current = now;
    setLastGesture(gesture);

    console.log(`Executing gesture action: ${gesture}`);

    switch (gesture) {
      case 'open_palm':
        togglePlayPause();
        toast({
          title: "Gesture Control",
          description: "Play/Pause toggled",
        });
        break;
        
      case 'fist':
        // Stop playback (pause)
        togglePlayPause();
        toast({
          title: "Gesture Control", 
          description: "Playback stopped",
        });
        break;
        
      case 'point':
        skipNext();
        toast({
          title: "Gesture Control",
          description: "Next song",
        });
        break;
        
      case 'five_fingers':
        skipPrevious();
        toast({
          title: "Gesture Control",
          description: "Previous song",
        });
        break;
        
      case 'peace_sign':
        const newVolumeUp = Math.min(100, currentVolume + 10);
        setCurrentVolume(newVolumeUp);
        setVolume(newVolumeUp);
        toast({
          title: "Gesture Control",
          description: `Volume: ${newVolumeUp}%`,
        });
        break;
        
      case 'rock_sign':
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

  const startDetection = useCallback(async () => {
    if (!isInitialized || isDetecting) return;

    console.log('Starting gesture detection...');
    setIsDetecting(true);

    intervalRef.current = setInterval(async () => {
      const imageData = captureFrame();
      if (!imageData) return;

      const result = await processGesture(imageData);
      if (result && result.gesture && result.confidence >= options.confidenceThreshold) {
        executeGestureAction(result.gesture);
      }
    }, options.detectionInterval);
  }, [isInitialized, isDetecting, captureFrame, processGesture, executeGestureAction, options]);

  const stopDetection = useCallback(() => {
    console.log('Stopping gesture detection...');
    setIsDetecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopDetection();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      document.body.removeChild(videoRef.current);
      videoRef.current = null;
    }
    
    if (canvasRef.current) {
      document.body.removeChild(canvasRef.current);
      canvasRef.current = null;
    }
    
    setIsInitialized(false);
  }, [stopDetection]);

  // Initialize camera when enabled
  useEffect(() => {
    if (options.enabled && user && !isInitialized) {
      initializeCamera();
    } else if (!options.enabled && isInitialized) {
      cleanup();
    }
  }, [options.enabled, user, isInitialized, initializeCamera, cleanup]);

  // Start/stop detection based on enabled state
  useEffect(() => {
    if (options.enabled && isInitialized && !isDetecting) {
      startDetection();
    } else if (!options.enabled && isDetecting) {
      stopDetection();
    }
  }, [options.enabled, isInitialized, isDetecting, startDetection, stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isInitialized,
    isDetecting,
    lastGesture,
    startDetection,
    stopDetection,
    cleanup
  };
};