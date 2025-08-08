import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMediaPipeGestures } from '@/hooks/useMediaPipeGestures';
import { GestureStatusIndicator } from './GestureStatusIndicator';

interface GestureControlsProviderProps {
  children: React.ReactNode;
}

export const GestureControlsProvider: React.FC<GestureControlsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [gestureControlsEnabled, setGestureControlsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Initialize MediaPipe gesture detection - enable by default for testing
  const gestureDetection = useMediaPipeGestures({
    enabled: gestureControlsEnabled || !user, // Enable even without user for testing
    detectionInterval: 2000, // Check every 2 seconds as requested
    confidenceThreshold: 0.5 // Lower threshold for better detection
  });

  // Add logging to see status
  useEffect(() => {
    console.log('🤚 MediaPipe Gesture Controls Status:', {
      enabled: gestureControlsEnabled,
      loading: isLoading,
      user: !!user,
      initialized: gestureDetection.isInitialized,
      detecting: gestureDetection.isDetecting,
      lastGesture: gestureDetection.lastGesture
    });
  }, [gestureControlsEnabled, isLoading, user, gestureDetection.isInitialized, gestureDetection.isDetecting, gestureDetection.lastGesture]);

  // Show initialization status and instructions
  useEffect(() => {
    if (gestureControlsEnabled && gestureDetection.isInitialized) {
      console.log('✅ Gesture detection is ACTIVE - Camera permission granted!');
      console.log('🤚 Try these gestures every 2 seconds:');
      console.log('🖐️ Open Palm → Play/Pause');
      console.log('✌️ Peace Sign → Next Song');
      console.log('✊ Fist → Previous Song'); 
      console.log('👍 Thumbs Up → Volume Up');
      console.log('👎 Thumbs Down → Volume Down');
    } else if (gestureControlsEnabled && !gestureDetection.isInitialized) {
      console.log('🔄 Initializing gesture detection... Please allow camera access when prompted.');
    }
  }, [gestureControlsEnabled, gestureDetection.isInitialized]);

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
        isEnabled={gestureControlsEnabled && !isLoading}
        isInitialized={gestureDetection.isInitialized}
        isDetecting={gestureDetection.isDetecting}
        lastGesture={gestureDetection.lastGesture}
      />
    </>
  );
};