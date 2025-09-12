import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useUnifiedMusicControls } from '@/hooks/useUnifiedMusicControls';
import { ControlFeedback } from './ControlFeedback';

interface VoiceControlsProviderProps {
  children: React.ReactNode;
}

export const VoiceControlsProvider: React.FC<VoiceControlsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [voiceControlsEnabled, setVoiceControlsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { handleVoiceCommand, feedback, clearFeedback } = useUnifiedMusicControls();

  // Fetch user's voice controls preference
  useEffect(() => {
    const fetchVoicePreference = async () => {
      if (!user) {
        // Enable by default when no user
        setVoiceControlsEnabled(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('voice_controls')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching voice controls preference:', error);
          setVoiceControlsEnabled(true);
        } else {
          setVoiceControlsEnabled((data as any)?.voice_controls ?? true);
        }
      } catch (error) {
        console.error('Unexpected error fetching voice preference:', error);
        setVoiceControlsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoicePreference();
  }, [user]);

  // Voice recognition hook
  const voiceRecognition = useVoiceRecognition({
    enabled: voiceControlsEnabled && !isLoading,
    onCommand: handleVoiceCommand
  });

  // Listen for real-time updates to voice controls preference
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('voice-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.voice_controls !== undefined) {
            setVoiceControlsEnabled(payload.new.voice_controls);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Log voice status
  useEffect(() => {
    console.log('🎤 Voice Controls Status:', {
      enabled: voiceControlsEnabled,
      loading: isLoading,
      user: !!user,
      listening: voiceRecognition.isListening,
      status: voiceRecognition.status,
      lastCommand: voiceRecognition.lastCommand
    });
  }, [voiceControlsEnabled, isLoading, user, voiceRecognition]);

  return (
    <>
      {children}
      <ControlFeedback
        gestureIcon={feedback.gestureIcon}
        voiceText={feedback.voiceText}
        show={feedback.show}
        onComplete={clearFeedback}
      />
      {voiceControlsEnabled && voiceRecognition.isListening && (
        <div className="fixed top-4 right-4 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 z-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary">Listening...</span>
          </div>
        </div>
      )}
    </>
  );
};