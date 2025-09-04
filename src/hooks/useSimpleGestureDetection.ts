import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';
import { pipeline } from '@huggingface/transformers';

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

  // AI-powered gesture detection using Hugging Face
  const startSimpleDetection = async () => {
    try {
      setStatus('Requesting camera access...');
      console.log('📱 Starting AI gesture detection...');
      
      // Request camera with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480, 
          facingMode: 'user' 
        }
      });
      
      console.log('✅ Camera access granted');
      setStatus('Loading AI vision model...');
      
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
      
      setStatus('Initializing AI model...');
      
      // Load Hugging Face image classification model
      const classifier = await pipeline(
        'image-classification',
        'microsoft/resnet-50',
        { device: 'webgpu' }
      );
      
      console.log('🤖 AI model loaded successfully');
      setStatus('Starting gesture recognition...');
      
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 640;
      canvas.height = 480;
      
      // Process frames for gesture detection
      const processFrame = async () => {
        if (video.readyState >= 2) {
          try {
            // Capture frame from video
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to image data
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Classify the image
            const results = await classifier(imageData);
            
            // Map classification results to gestures
            const gesture = mapClassificationToGesture(results);
            if (gesture) {
              handleGesture(gesture);
            }
          } catch (err) {
            console.warn('Frame processing error:', err);
          }
        }
      };
      
      const interval = setInterval(processFrame, 500); // 2 FPS for stability
      
      // Set up cleanup
      cleanupRef.current = () => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        canvas.remove();
      };
      
      setStatus('🟢 Active - Show gestures!');
      setIsActive(true);
      
      toast({
        title: "🤚 AI Gesture Control Ready!",
        description: "Show hand gestures to control music",
      });
      
    } catch (error) {
      console.error('❌ Gesture detection failed:', error);
      
      // Fallback to test mode
      setStatus('🎮 Test Mode - Use keyboard 1-5');
      setIsActive(true);
      
      toast({
        title: "Using Test Mode",
        description: "Press 1-5 keys to test gestures",
        variant: "default",
      });
      
      // Enable keyboard fallback
      enableKeyboardFallback();
    }
  };

  // Map AI classification results to gesture commands
  const mapClassificationToGesture = (results: any[]): string | null => {
    if (!results || results.length === 0) return null;
    
    const topResult = results[0];
    const confidence = topResult.score;
    
    // Only process high confidence results
    if (confidence < 0.3) return null;
    
    // Map common object labels to gestures (simplified mapping)
    const label = topResult.label.toLowerCase();
    
    if (label.includes('fist') || label.includes('punch')) return 'fist';
    if (label.includes('hand') || label.includes('palm')) return 'open_hand';
    if (label.includes('peace') || label.includes('victory')) return 'peace';
    if (label.includes('phone') || label.includes('call')) return 'call_me';
    if (label.includes('rock') || label.includes('horn')) return 'rock';
    
    return null;
  };

  // Keyboard fallback for testing
  const enableKeyboardFallback = () => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch(event.key) {
        case '1': handleGesture('fist'); break;
        case '2': handleGesture('call_me'); break;
        case '3': handleGesture('open_hand'); break;
        case '4': handleGesture('peace'); break;
        case '5': handleGesture('rock'); break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // Add to cleanup
    const originalCleanup = cleanupRef.current;
    cleanupRef.current = () => {
      document.removeEventListener('keydown', handleKeyPress);
      originalCleanup?.();
    };
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
