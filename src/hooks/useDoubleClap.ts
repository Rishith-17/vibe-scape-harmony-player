import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DoubleClapOptions {
  enabled: boolean;
  onDoubleClap: () => void;
  threshold?: number;
  timeWindow?: number;
}

export const useDoubleClap = ({ 
  enabled, 
  onDoubleClap, 
  threshold = 0.5,  // Lower threshold for easier clap detection
  timeWindow = 800  // Slightly longer window for double clap
}: DoubleClapOptions) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const lastClapTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const detectClap = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate amplitude
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);

    // Check if amplitude exceeds threshold (clap detected)
    if (rms > threshold) {
      const now = Date.now();
      const timeSinceLastClap = now - lastClapTimeRef.current;

      console.log('👏 Clap detected! RMS:', rms.toFixed(3), 'Time since last:', timeSinceLastClap);

      if (timeSinceLastClap > 100 && timeSinceLastClap <= timeWindow) {
        // Double clap detected!
        console.log('👏👏 DOUBLE CLAP DETECTED!');
        lastClapTimeRef.current = 0; // Reset to avoid triple claps
        onDoubleClap();
        
        toast({
          title: "👏 Voice Control Activated",
          description: "Listening for your command...",
        });
      } else if (timeSinceLastClap > timeWindow) {
        // First clap or timeout
        lastClapTimeRef.current = now;
      }
    }

    // Continue monitoring
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(detectClap);
    }
  };

  const startListening = async () => {
    try {
      console.log('🎤 Starting double-clap detection...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });
      
      console.log('✅ Microphone access granted for clap detection');
      micStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2; // Less smoothing for better clap detection
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      console.log('✅ Double-clap detection active - listening for claps');
      
      // Start detection loop
      detectClap();

    } catch (error) {
      console.error('❌ Failed to start clap detection:', error);
      setIsListening(false);
      toast({
        title: "Microphone Access Needed",
        description: "Please allow microphone access for double-clap detection",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    lastClapTimeRef.current = 0;
    setIsListening(false);
    console.log('🛑 Double-clap detection stopped');
  };

  useEffect(() => {
    if (enabled && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled]);

  return { isListening };
};
