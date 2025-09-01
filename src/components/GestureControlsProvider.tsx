import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useMediaPipeGestures } from '@/hooks/useMediaPipeGestures';
import { GestureStatusIndicator } from './GestureStatusIndicator';
import { GestureTutorial } from './GestureTutorial';

interface GestureControlsProviderProps {
  children: React.ReactNode;
}

export const GestureControlsProvider: React.FC<GestureControlsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [gestureControlsEnabled, setGestureControlsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Fetch user's gesture controls preference (default to true if no user)
  useEffect(() => {
    const fetchGesturePreference = async () => {
      if (!user) {
        // Enable by default when no user (for testing)
        setGestureControlsEnabled(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('gesture_controls')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching gesture controls preference:', error);
          // Default to true if error
          setGestureControlsEnabled(true);
        } else {
          setGestureControlsEnabled((data as any)?.gesture_controls ?? true);
        }
      } catch (error) {
        console.error('Unexpected error fetching gesture preference:', error);
        setGestureControlsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGesturePreference();
  }, [user]);

  // Only enable gesture detection when music is playing
  const { isPlaying } = useMusicPlayer();
  
  const gestureDetection = useMediaPipeGestures({
    enabled: gestureControlsEnabled && isPlaying, // Only when music is playing
    detectionInterval: 2000, // Check every 2 seconds as requested
    confidenceThreshold: 0.5 // Lower threshold for better detection
  });

  // Add logging to see status
  useEffect(() => {
    console.log('🤚 MediaPipe Gesture Controls Status:', {
      enabled: gestureControlsEnabled,
      loading: isLoading,
      user: !!user,
      musicPlaying: isPlaying,
      initialized: gestureDetection.isInitialized,
      detecting: gestureDetection.isDetecting,
      lastGesture: gestureDetection.lastGesture
    });
  }, [gestureControlsEnabled, isLoading, user, isPlaying, gestureDetection.isInitialized, gestureDetection.isDetecting, gestureDetection.lastGesture]);

  // Show tutorial when gesture detection is first enabled and initialized
  useEffect(() => {
    if (gestureControlsEnabled && isPlaying && gestureDetection.isInitialized) {
      console.log('✅ Gesture detection is ACTIVE - Camera permission granted!');
      
      // Show tutorial on first activation (check localStorage)
      const hasSeenTutorial = localStorage.getItem('vibescape_gesture_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        localStorage.setItem('vibescape_gesture_tutorial_seen', 'true');
      }
      
      console.log('🤚 Try these gestures every 2 seconds:');
      console.log('✊ Fist → Play/Pause');
      console.log('🤙 Call Me → Next Song');
      console.log('🖐️ Five Fingers → Previous Song'); 
      console.log('✌️ Peace Sign → Volume Up');
      console.log('🤟 Rock Sign → Volume Down');
    } else if (gestureControlsEnabled && isPlaying && !gestureDetection.isInitialized) {
      console.log('🔄 Initializing gesture detection... Please allow camera access when prompted.');
    } else if (gestureControlsEnabled && !isPlaying) {
      console.log('🎵 Play music to activate gesture controls');
    }
  }, [gestureControlsEnabled, isPlaying, gestureDetection.isInitialized]);

  // Listen for real-time updates to gesture controls preference
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.gesture_controls !== undefined) {
            setGestureControlsEnabled(payload.new.gesture_controls);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      {children}
      <GestureStatusIndicator
        isEnabled={gestureControlsEnabled && !isLoading && isPlaying}
        isInitialized={gestureDetection.isInitialized}
        isDetecting={gestureDetection.isDetecting}
        lastGesture={gestureDetection.lastGesture}
      />
      <GestureTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
};