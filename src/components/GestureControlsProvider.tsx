import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGestureDetection } from '@/hooks/useGestureDetection';

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

  // Initialize gesture detection with user preferences
  const gestureDetection = useGestureDetection({
    enabled: gestureControlsEnabled && !isLoading,
    detectionInterval: 1000, // Check every second
    confidenceThreshold: 0.6 // 60% confidence threshold
  });

  // Add logging to see status
  useEffect(() => {
    console.log('🤖 Gesture Controls Status:', {
      enabled: gestureControlsEnabled,
      loading: isLoading,
      user: !!user,
      initialized: gestureDetection.isInitialized,
      detecting: gestureDetection.isDetecting
    });
  }, [gestureControlsEnabled, isLoading, user, gestureDetection.isInitialized, gestureDetection.isDetecting]);

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

  return <>{children}</>;
};