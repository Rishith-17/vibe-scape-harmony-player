import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleGestureDetection } from '@/hooks/useSimpleGestureDetection';
import { useUnifiedMusicControls } from '@/hooks/useUnifiedMusicControls';
import { useDoubleClap } from '@/hooks/useDoubleClap';
import { useSimplifiedGestures, SimplifiedGestureSettings } from '@/hooks/useSimplifiedGestures';
import { musicController } from '@/controllers/MusicControllerImpl';
import { GestureStatusIndicator } from './GestureStatusIndicator';
import { GestureTutorial } from './GestureTutorial';
import { TestGestureController } from './TestGestureController';
import { ControlFeedback } from './ControlFeedback';
import { VoiceDebugOverlay } from './VoiceDebugOverlay';
import { GestureDebugOverlay } from './GestureDebugOverlay';
import { Landmark } from '@/gestures/gestureUtils';

interface GestureControlsProviderProps {
  children: React.ReactNode;
}

export const GestureControlsProvider: React.FC<GestureControlsProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const musicPlayer = useMusicPlayer();
  const [gestureControlsEnabled, setGestureControlsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [simplifiedSettings, setSimplifiedSettings] = useState<SimplifiedGestureSettings>({
    enabled: true,
    hapticFeedback: true,
  });
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);
  
  // Initialize singleton musicController with player context
  useEffect(() => {
    musicController.setPlayerContext(musicPlayer);
  }, [musicPlayer]);
  
  const { handleGestureCommand, feedback, clearFeedback } = useUnifiedMusicControls();

  // Double clap detection - triggers voice via gesture system
  const { isListening: clapListening } = useDoubleClap({
    enabled: gestureControlsEnabled,
    onDoubleClap: () => {
      console.log('👏👏 Double clap detected - triggering open_hand gesture');
      handleGestureCommand('open_hand', 0.95); // Trigger same path as gesture
    }
  });

  // Fetch user's gesture controls preference (disabled when no user)
  useEffect(() => {
    const fetchGesturePreference = async () => {
      if (!user) {
        // Disable when no user (auth page)
        console.log('🤚 No user - disabling gesture controls');
        setGestureControlsEnabled(false);
        setIsLoading(false);
        return;
      }

      console.log('🤚 User logged in - fetching gesture preference for:', user.id);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('gesture_controls')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching gesture controls preference:', error);
          // Default to true if error
          console.log('🤚 Error fetching preference - defaulting to ENABLED');
          setGestureControlsEnabled(true);
        } else {
          const enabled = (data as any)?.gesture_controls ?? true;
          console.log('🤚 Fetched gesture preference:', enabled);
          setGestureControlsEnabled(enabled);
        }
      } catch (error) {
        console.error('Unexpected error fetching gesture preference:', error);
        console.log('🤚 Unexpected error - defaulting to ENABLED');
        setGestureControlsEnabled(true);
      } finally {
        setIsLoading(false);
        console.log('🤚 Gesture preference fetch complete');
      }
    };

    fetchGesturePreference();
  }, [user]);

  // Enable gesture detection only when user is logged in
  const { isPlaying } = useMusicPlayer();

  // Callback to receive landmarks for advanced gestures
  const handleLandmarks = useCallback((landmarks: Landmark[]) => {
    setCurrentLandmarks(landmarks);
  }, []);
  
  const gestureDetection = useSimpleGestureDetection({
    enabled: !!user && gestureControlsEnabled && !isLoading,
    onGesture: handleGestureCommand,
    onLandmarks: handleLandmarks,
  });

  // Simplified gestures (swipe + point-to-click)
  const simplifiedGestures = useSimplifiedGestures({
    enabled: !!user && gestureControlsEnabled && !isLoading && gestureDetection.isActive,
    settings: simplifiedSettings,
  });

  // Process landmarks through simplified gestures
  useEffect(() => {
    if (currentLandmarks && simplifiedGestures.processLandmarks) {
      simplifiedGestures.processLandmarks(currentLandmarks, 0.85);
    }
  }, [currentLandmarks, simplifiedGestures.processLandmarks]);

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
      
      console.log('🤚 Active gesture controls:');
      console.log('🖐️ Open Hand → Start Voice Control (reuses same mic instance as Tap-Mic)');
      console.log('✊ Fist → Toggle Play/Pause (3s cooldown)');
      console.log('🤘 Rock → Volume Down (-10%)');
      console.log('✌️ Peace → Volume Up (+10%)');
      console.log('👏👏 Double Clap → Activate Voice Control');
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
      {user && gestureControlsEnabled && (
        <>
          <GestureStatusIndicator
            isEnabled={!isLoading}
            status={gestureDetection.status}
            isActive={gestureDetection.isActive}
            lastGesture={gestureDetection.lastGesture}
          />
          <TestGestureController 
            enabled={!isLoading && !gestureDetection.isActive}
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
          {/* Debug overlay (dev only) */}
          {import.meta.env.MODE === 'development' && (
            <GestureDebugOverlay
              debugInfo={{
                palmY: simplifiedGestures.debugInfo.palmY,
                palmX: simplifiedGestures.debugInfo.palmX,
                isPointing: simplifiedGestures.debugInfo.isPointing,
                lastGesture: simplifiedGestures.lastAction,
              }}
              isVisible={true}
            />
          )}
        </>
      )}
      {/* Dev-only debug overlay - shows mic armed status and ASR instance */}
      <VoiceDebugOverlay />
    </>
  );
};