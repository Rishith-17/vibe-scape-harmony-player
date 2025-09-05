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
      
      // Configure with lower thresholds for better detection
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.3, // Lower threshold
        minTrackingConfidence: 0.3,  // Lower threshold
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

  // Analyze gesture from hand landmarks with improved logic
  const analyzeGestureFromLandmarks = (landmarks: any[]): string | null => {
    if (!landmarks || landmarks.length < 21) {
      console.log('⚠️ Insufficient landmarks for gesture analysis');
      return null;
    }
    
    try {
      // Get key landmark positions
      const thumb_tip = landmarks[4];
      const thumb_ip = landmarks[3];
      const index_tip = landmarks[8];
      const index_pip = landmarks[6];
      const middle_tip = landmarks[12];
      const middle_pip = landmarks[10];
      const ring_tip = landmarks[16];
      const ring_pip = landmarks[14];
      const pinky_tip = landmarks[20];
      const pinky_pip = landmarks[18];
      const wrist = landmarks[0];
      
      // Calculate finger states with tolerance
      const tolerance = 0.02;
      const thumb_up = thumb_tip.y < thumb_ip.y - tolerance;
      const index_up = index_tip.y < index_pip.y - tolerance;
      const middle_up = middle_tip.y < middle_pip.y - tolerance;
      const ring_up = ring_tip.y < ring_pip.y - tolerance;
      const pinky_up = pinky_tip.y < pinky_pip.y - tolerance;
      
      console.log('👆 Finger states:', {
        thumb: thumb_up,
        index: index_up,
        middle: middle_up,
        ring: ring_up,
        pinky: pinky_up
      });
      
      // Gesture recognition with improved logic
      // Fist - all fingers down
      if (!thumb_up && !index_up && !middle_up && !ring_up && !pinky_up) {
        console.log('✊ Detected: FIST');
        return 'fist';
      }
      
      // Open hand - all fingers up
      if (thumb_up && index_up && middle_up && ring_up && pinky_up) {
        console.log('🖐️ Detected: OPEN HAND');
        return 'open_hand';
      }
      
      // Peace sign - index and middle up, others down
      if (!thumb_up && index_up && middle_up && !ring_up && !pinky_up) {
        console.log('✌️ Detected: PEACE');
        return 'peace';
      }
      
      // Rock/horns - index and pinky up, others down
      if (!thumb_up && index_up && !middle_up && !ring_up && pinky_up) {
        console.log('🤟 Detected: ROCK');
        return 'rock';
      }
      
      // Call me - thumb and pinky up, others down
      if (thumb_up && !index_up && !middle_up && !ring_up && pinky_up) {
        console.log('🤙 Detected: CALL ME');
        return 'call_me';
      }
      
      console.log('❓ No gesture pattern matched');
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
