import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { HandDetector } from '@/gestures/hand/handDetector';
import { GesturesController } from '@/gestures/gesturesController';

interface SimpleGestureOptions {
  enabled: boolean;
  onGesture: (gesture: string, confidence: number) => void;
}

/**
 * Optimized gesture detection hook using HandDetector + GesturesController
 * Fast detection for open_hand (voice) and fist (play/pause)
 */
export const useSimpleGestureDetection = (options: SimpleGestureOptions) => {
  const [status, setStatus] = useState('Ready');
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  
  const handDetectorRef = useRef<HandDetector | null>(null);
  const gesturesControllerRef = useRef<GesturesController | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  const { toast } = useToast();

  console.log('🤚 [useSimpleGestureDetection] Hook initialized with enabled:', options.enabled);

  /**
   * Handle gesture events from GesturesController
   */
  const handleGesture = (gestureType: string, confidence: number) => {
    console.log(`✅ [useSimpleGestureDetection] Gesture fired: ${gestureType} confidence=${confidence.toFixed(2)}`);
    
    setLastGesture(gestureType);
    
    // Pass to parent handler
    options.onGesture(gestureType, confidence);
  };

  /**
   * Start optimized gesture detection
   */
  const startSimpleDetection = async () => {
    try {
      console.log('🚀 [useSimpleGestureDetection] Starting optimized gesture detection...');

      // Initialize GesturesController with optimized settings
      gesturesControllerRef.current = new GesturesController({
        confidenceThreshold: 0.75, // More lenient for reliable detection
        debounceMs: 300,
        stabilityFrames: {
          thumbs_up: 1, // Legacy - not used
          open_hand: 1, // Instant for voice
          fist: 2, // 2 frames for stability
          rock: 2, // 2 frames for volume
          peace: 2, // 2 frames for volume
        },
      });

      gesturesControllerRef.current.onGesture(handleGesture);

      // Initialize HandDetector
      handDetectorRef.current = new HandDetector({
        maxNumHands: 1,
        modelComplexity: 0, // Fastest
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65,
        targetFps: 30, // 30 FPS for responsive detection
        enableROI: true,
      });

      handDetectorRef.current.onStatus((status) => {
        console.log('👁️ [HandDetector] Status:', status);
        setStatus(status);
      });

      handDetectorRef.current.onResults((landmarks) => {
        // Process landmarks through controller
        if (gesturesControllerRef.current) {
          gesturesControllerRef.current.processLandmarks(landmarks);
        }
      });

      // Start detection
      await handDetectorRef.current.start();
      
      // Create canvas for processing
      setIsActive(true);
      
      // Set up cleanup
      cleanupRef.current = async () => {
        console.log('🧹 [useSimpleGestureDetection] Cleaning up...');
        if (handDetectorRef.current) {
          await handDetectorRef.current.stop();
          handDetectorRef.current = null;
        }
        gesturesControllerRef.current = null;
      };

      console.log('✅ [useSimpleGestureDetection] Optimized detection started at 30 FPS');
      
      toast({
        title: "🤚 Gesture Control Ready!",
        description: "🖐️ Open Hand = Voice | ✊ Fist = Play/Pause | 🤘 Rock = Vol- | ✌️ Peace = Vol+",
        duration: 5000,
      });
      
    } catch (error) {
      console.error('❌ [useSimpleGestureDetection] Failed to start:', error);
      setStatus('📷 Camera Permission Needed');
      setIsActive(false);
      
      toast({
        title: "🎥 Camera Access Required",
        description: "Allow camera to use hand gestures. Check browser settings if blocked.",
        variant: "destructive",
        duration: 8000,
      });
    }
  };




  /**
   * Initialize when enabled - only track enabled state, not whole options object
   */
  const enabledRef = useRef(options.enabled);
  const onGestureRef = useRef(options.onGesture);
  
  // Update refs when props change
  useEffect(() => {
    enabledRef.current = options.enabled;
    onGestureRef.current = options.onGesture;
  }, [options.enabled, options.onGesture]);
  
  useEffect(() => {
    if (options.enabled && !isActive && !handDetectorRef.current) {
      console.log('🚀 [useSimpleGestureDetection] Enabled - starting detection...');
      startSimpleDetection();
    }
    
    return () => {
      if (cleanupRef.current) {
        console.log('🧹 [useSimpleGestureDetection] Cleaning up...');
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setIsActive(false);
      setStatus('Stopped');
    };
  }, [options.enabled]);

  return {
    status,
    isActive,
    lastGesture,
  };
};
