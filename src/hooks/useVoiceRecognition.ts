import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecognitionOptions {
  enabled: boolean;
  onCommand: (command: string, confidence: number) => void;
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: number;
}

export const useVoiceRecognition = (options: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [status, setStatus] = useState('Ready');
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (!options.enabled) return;

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported in this browser');
      setStatus('Not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    // Handle results
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim().toLowerCase();
          const confidence = result[0].confidence || 0.8;
          
          console.log('🎤 Voice detected:', transcript, 'Confidence:', confidence);
          
          // Only process if confidence is high enough
          if (confidence >= 0.80) {
            const command: VoiceCommand = {
              command: transcript,
              confidence,
              timestamp: Date.now()
            };
            
            setLastCommand(command);
            options.onCommand(transcript, confidence);
          } else {
            console.log('🚫 Voice confidence too low:', confidence);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setStatus('Microphone access denied');
        toast({
          title: "Voice Control Unavailable",
          description: "Please allow microphone access for voice commands",
          variant: "destructive",
        });
      } else {
        setStatus(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      setStatus('🟢 Listening');
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
      if (options.enabled) {
        // Restart if still enabled
        setTimeout(() => {
          if (options.enabled && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Voice recognition restart failed:', error);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    // Start recognition
    try {
      recognition.start();
      toast({
        title: "🎤 Voice Control Active",
        description: "Say commands like 'play', 'next', 'volume up'",
      });
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      setStatus('Failed to start');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setStatus('Stopped');
    };
  }, [options.enabled]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    lastCommand,
    status,
    stopListening
  };
};