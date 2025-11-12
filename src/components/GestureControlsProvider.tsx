import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleGestureDetection } from '@/hooks/useSimpleGestureDetection';
import { useUnifiedMusicControls } from '@/hooks/useUnifiedMusicControls';
import { useDoubleClap } from '@/hooks/useDoubleClap';
import { GestureStatusIndicator } from './GestureStatusIndicator';
import { GestureTutorial } from './GestureTutorial';
import { TestGestureController } from './TestGestureController';
import { ControlFeedback } from './ControlFeedback';

interface GestureControlsProviderProps {
  children: React.ReactNode;
}

export const GestureControlsProvider: React.FC<GestureControlsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [gestureControlsEnabled, setGestureControlsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [voiceControlActive, setVoiceControlActive] = useState(false);
  
  const { handleGestureCommand, feedback, clearFeedback } = useUnifiedMusicControls();

  // Voice control trigger function - dispatches event for VoiceIntegration to handle
  const activateVoiceControl = () => {
    console.log('🎤 Voice control activated by gesture/clap - dispatching event');
    setVoiceControlActive(true);
    
    // Dispatch custom event that VoiceIntegration listens for
    const event = new CustomEvent('vibescape:trigger-voice');
    window.dispatchEvent(event);
  };

  // Double clap detection
  const { isListening: clapListening } = useDoubleClap({
    enabled: gestureControlsEnabled,
    onDoubleClap: activateVoiceControl
  });

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

  // Enable gesture detection when enabled (works with or without music)
  const { isPlaying } = useMusicPlayer();
  
  const gestureDetection = useSimpleGestureDetection({
    enabled: gestureControlsEnabled,
    onGesture: handleGestureCommand
  });

  // Add logging to see status
  useEffect(() => {
    console.log('🤚 Gesture & Clap Controls Status:', {
      enabled: gestureControlsEnabled,
      loading: isLoading,
      user: !!user,
      musicPlaying: isPlaying,
      gestureStatus: gestureDetection.status,
      gestureActive: gestureDetection.isActive,
      lastGesture: gestureDetection.lastGesture,
      clapListening: clapListening
    });
  }, [gestureControlsEnabled, isLoading, user, isPlaying, gestureDetection.status, gestureDetection.isActive, gestureDetection.lastGesture]);

  // Show tutorial when gesture detection is first enabled and active
  useEffect(() => {
    if (gestureControlsEnabled && gestureDetection.isActive) {
      console.log('✅ Gesture detection is ACTIVE - Camera permission granted!');
      
      // Show tutorial on first activation (check localStorage)
      const hasSeenTutorial = localStorage.getItem('vibescape_gesture_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        localStorage.setItem('vibescape_gesture_tutorial_seen', 'true');
      }
      
      console.log('🤚 Try these gestures:');
      console.log('✊ Fist → Stop');
      console.log('🖐️ Open Hand → Play/Resume');
      console.log('🤙 Call Me → Voice Control');
      console.log('👍 Thumbs Up → Navigation');
      console.log('✌️ Peace Sign → Volume Up');
      console.log('🤟 Rock Sign → Volume Down');
      console.log('👏👏 Double Clap → Voice Control');
    } else if (gestureControlsEnabled && !gestureDetection.isActive) {
      console.log('🔄 Initializing gesture detection... Please allow camera access when prompted.');
    }
  }, [gestureControlsEnabled, gestureDetection.isActive]);

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
        status={gestureDetection.status}
        isActive={gestureDetection.isActive}
        lastGesture={gestureDetection.lastGesture}
      />
      <TestGestureController 
        enabled={gestureControlsEnabled && !isLoading && !gestureDetection.isActive}
      />
      <GestureTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      <ControlFeedback
        gestureIcon={feedback.gestureIcon}
        show={feedback.show}
        onComplete={clearFeedback}
      />
    </>
  );
};