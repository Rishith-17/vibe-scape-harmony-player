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

  // Fetch user's gesture controls preference
  useEffect(() => {
    const fetchGesturePreference = async () => {
      if (!user) {
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
        } else {
          setGestureControlsEnabled((data as any)?.gesture_controls ?? true);
        }
      } catch (error) {
        console.error('Unexpected error fetching gesture preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGesturePreference();
  }, [user]);

  // Initialize MediaPipe gesture detection with user preferences
  const gestureDetection = useMediaPipeGestures({
    enabled: gestureControlsEnabled && !isLoading,
    detectionInterval: 100, // Process frames every 100ms
    confidenceThreshold: 0.7 // 70% confidence threshold
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

  // Show initialization status
  useEffect(() => {
    if (gestureControlsEnabled && gestureDetection.isInitialized) {
      console.log('✅ Gesture detection is active - try these gestures:');
      console.log('🖐️ Open Palm → Play/Pause');
      console.log('✌️ Peace Sign → Next Song');
      console.log('✊ Fist → Previous Song'); 
      console.log('👍 Thumbs Up → Volume Up');
      console.log('👎 Thumbs Down → Volume Down');
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