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
  
  const { togglePlayPause, skipNext, skipPrevious, setVolume } = useMusicPlayer();
  const { toast } = useToast();

  // Simple gesture handler
  const handleGesture = (gestureType: string) => {
    const now = Date.now();
    
    // Debounce gestures (1.5 second cooldown)
    if (now - lastGestureTimeRef.current < 1500) {
      return;
    }
    
    lastGestureTimeRef.current = now;
    setLastGesture(gestureType);
    
    console.log('🎯 Gesture executed:', gestureType);
    
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
  };

  // Simple gesture detection using MediaPipe
  const startSimpleDetection = async () => {
    try {
      setStatus('Requesting camera access...');
      console.log('📱 Starting simple gesture detection...');
      
      // Request camera with minimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Minimal constraints for maximum compatibility
      });
      
      console.log('✅ Camera access granted');
      setStatus('Camera ready - Loading AI model...');
      
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
      
      setStatus('Loading hand detection model...');
      
      // Load MediaPipe scripts sequentially with timeout
      await Promise.race([
        loadMediaPipeWithTimeout(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Script loading timeout')), 10000))
      ]);
      
      console.log('🤖 MediaPipe loaded successfully');
      setStatus('Initializing hand tracking...');
      
      // Initialize MediaPipe Hands
      const hands = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Fastest model
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      
      // Set up results handler
      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const gesture = detectSimpleGesture(landmarks);
          if (gesture) {
            handleGesture(gesture);
          }
        }
      });
      
      // Start processing loop
      const processFrame = async () => {
        if (video.readyState >= 2) {
          try {
            await hands.send({ image: video });
          } catch (err) {
            console.warn('Frame processing error:', err);
          }
        }
      };
      
      const interval = setInterval(processFrame, 200); // 5 FPS for stability
      
      // Set up cleanup
      cleanupRef.current = () => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      };
      
      setStatus('🟢 Active - Show gestures!');
      setIsActive(true);
      
      toast({
        title: "🤚 Gesture Control Ready!",
        description: "Show hand gestures to control music",
      });
      
    } catch (error) {
      console.error('❌ Gesture detection failed:', error);
      
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
        if (error.name === 'NotAllowedError') {
          message = 'Camera permission denied';
        } else if (error.name === 'NotFoundError') {
          message = 'No camera found';
        }
      }
      
      setStatus(`Error: ${message}`);
      setIsActive(false);
      
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Load MediaPipe scripts with proper error handling
  const loadMediaPipeWithTimeout = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Hands) {
        resolve();
        return;
      }
      
      console.log('📥 Loading MediaPipe scripts...');
      
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      script1.crossOrigin = 'anonymous';
      
      script1.onload = () => {
        console.log('✅ Camera utils loaded');
        
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script2.crossOrigin = 'anonymous';
        
        script2.onload = () => {
          console.log('✅ MediaPipe hands loaded');
          resolve();
        };
        
        script2.onerror = () => {
          console.error('❌ Failed to load MediaPipe hands');
          reject(new Error('MediaPipe hands script failed to load'));
        };
        
        document.head.appendChild(script2);
      };
      
      script1.onerror = () => {
        console.error('❌ Failed to load MediaPipe camera utils');
        reject(new Error('MediaPipe camera utils script failed to load'));
      };
      
      document.head.appendChild(script1);
    });
  };

  // Simple and reliable gesture detection
  const detectSimpleGesture = (landmarks: any[]): string | null => {
    try {
      const tips = [4, 8, 12, 16, 20]; // finger tips
      const bases = [2, 5, 9, 13, 17]; // finger bases
      
      // Check which fingers are up
      const fingersUp = [];
      
      // Thumb (horizontal check)
      fingersUp[0] = landmarks[4].x > landmarks[3].x ? 1 : 0;
      
      // Other fingers (vertical check)
      for (let i = 1; i < 5; i++) {
        fingersUp[i] = landmarks[tips[i]].y < landmarks[bases[i]].y ? 1 : 0;
      }
      
      const count = fingersUp.reduce((a, b) => a + b, 0);
      
      // Simple gesture patterns
      if (count === 0) return 'fist';
      if (count === 5) return 'open_hand';
      if (count === 2 && fingersUp[1] && fingersUp[2]) return 'peace';
      if (count === 2 && fingersUp[0] && fingersUp[4]) return 'call_me';
      if (count === 2 && fingersUp[1] && fingersUp[4]) return 'rock';
      
      return null;
    } catch (error) {
      console.warn('Gesture detection error:', error);
      return null;
    }
  };

  // Initialize when enabled
  useEffect(() => {
    if (options.enabled && !isActive) {
      console.log('🚀 Starting gesture detection...');
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

  return {
    status,
    isActive,
    lastGesture,
  };
};
