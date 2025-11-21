
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider, useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { GestureControlsProvider } from "@/components/GestureControlsProvider";
import { useMobileAudio } from "@/hooks/useMobileAudio";
import BackgroundAudioManager from "@/services/BackgroundAudioManager";
import PWAInstallPrompt from "@/services/PWAInstallPrompt";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNavigation from "@/components/BottomNavigation";
import MiniPlayer from "@/components/MiniPlayer";
import AuthPage from "./pages/AuthPage";
import EnhancedHomePage from "./pages/EnhancedHomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import EmotionsPage from "./pages/EmotionsPage";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";
import { isFeatureEnabled } from "@/config/featureFlags";
import { useVoiceSettings } from "@/store/voiceSettings";

const queryClient = new QueryClient();

const VoiceIntegration = () => {
  const voiceSettings = useVoiceSettings();
  const musicPlayer = useMusicPlayer();
  const navigate = useNavigate();
  const [voiceController, setVoiceController] = React.useState<any>(null);
  const [voiceState, setVoiceState] = React.useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');

  React.useEffect(() => {
    console.log('[App] Voice control check:', {
      featureEnabled: isFeatureEnabled('VOICE_CONTROL_ENABLED'),
      userEnabled: voiceSettings.enabled,
      consentGiven: voiceSettings.consentGiven
    });

    // Only initialize if feature is enabled AND user has enabled it
    if (!isFeatureEnabled('VOICE_CONTROL_ENABLED') || !voiceSettings.enabled) {
      console.log('[App] Voice control not active - feature or user setting disabled');
      // Clean up if controller exists
      if (voiceController) {
        voiceController.destroy();
        setVoiceController(null);
      }
      return;
    }

    // NOTE: Do NOT request microphone permission here!
    // Permission is ONLY requested through voiceController.armMic() when user taps mic button
    // This ensures single shared mic instance and privacy-first design

    // Lazy load voice controller
    let controller: any = null;
    
    (async () => {
      try {
        const { VoiceController } = await import('./voice/voiceController');
        const { MusicControllerImpl } = await import('./controllers/MusicControllerImpl');
        const { NavControllerImpl } = await import('./controllers/NavControllerImpl');

        const musicControllerAdapter = new MusicControllerImpl(musicPlayer);
        const navControllerAdapter = new NavControllerImpl(navigate);

        controller = new VoiceController(
          musicControllerAdapter,
          navControllerAdapter,
          {
            language: voiceSettings.language,
            wakeSensitivity: voiceSettings.wakeSensitivity,
            ttsEnabled: voiceSettings.ttsEnabled,
            wakeEnabled: voiceSettings.wakeEnabled && !voiceSettings.pttOnly,
          }
        );

        controller.onStateChange((state: any) => {
          setVoiceState(state);
        });

        await controller.initialize();
        await controller.start();
        
        setVoiceController(controller);
        console.log('[App] Voice controller initialized and started');
      } catch (error) {
        console.error('[App] Failed to initialize voice controller:', error);
        // Even if initialization fails, set controller to enable manual trigger
        if (controller) {
          setVoiceController(controller);
        }
      }
      
      // Always set controller so manual trigger works
      setVoiceController(controller);
    })();

    return () => {
      if (controller) {
        controller.destroy();
      }
    };
  }, [voiceSettings.enabled, voiceSettings.language, voiceSettings.wakeSensitivity, voiceSettings.ttsEnabled, musicPlayer, navigate]);

  // Update controller config when settings change
  React.useEffect(() => {
    if (voiceController && voiceSettings.enabled) {
      voiceController.updateConfig({
        language: voiceSettings.language,
        wakeSensitivity: voiceSettings.wakeSensitivity,
        ttsEnabled: voiceSettings.ttsEnabled,
      });
    }
  }, [voiceController, voiceSettings.language, voiceSettings.wakeSensitivity, voiceSettings.ttsEnabled, voiceSettings.enabled]);

  // Render VoiceChip when enabled (even if controller isn't fully initialized yet)
  if (!isFeatureEnabled('VOICE_CONTROL_ENABLED') || !voiceSettings.enabled) {
    return null;
  }

  const handleManualTrigger = async () => {
    console.log('[App] 🎤 Mic button clicked!');
    if (voiceController) {
      console.log('[App] ✅ Voice controller exists, calling manualTrigger()');
      try {
        await voiceController.manualTrigger();
        console.log('[App] ✅ manualTrigger() completed successfully');
      } catch (error) {
        console.error('[App] ❌ manualTrigger() failed:', error);
      }
    } else {
      console.error('[App] ❌ Voice controller is NULL - not initialized!');
    }
  };

    // Listen for gesture/clap voice trigger events
    React.useEffect(() => {
      const handleGestureTrigger = async (event: Event) => {
        const customEvent = event as CustomEvent;
        const source = customEvent.detail?.source || 'unknown';
        
        console.log('[App] ========== VOICE TRIGGER EVENT ==========');
        console.log('[App] 🤙 Voice triggered by:', source);
        console.log('[App] Voice controller exists:', !!voiceController);
        console.log('[App] Voice settings enabled:', voiceSettings.enabled);
        console.log('[App] Feature enabled:', isFeatureEnabled('VOICE_CONTROL_ENABLED'));
        
        if (!voiceController) {
          console.error('[App] ❌ Voice controller not initialized!');
          console.error('[App] This usually means voice control is disabled in settings');
          console.error('[App] Or the controller failed to initialize');
          return;
        }
        
        console.log('[App] ✅ Voice controller is ready');
        
        // Check if mic is armed - if not, gesture should arm it first
        const micArmed = voiceController.isMicArmed();
        console.log('[App] Mic armed status:', micArmed);
        
        if (!micArmed) {
          console.log('[App] 🔓 Gesture trigger - arming mic first...');
          try {
            await voiceController.armMic();
            console.log('[App] ✅ Mic armed successfully by gesture');
          } catch (error) {
            console.error('[App] ❌ Failed to arm mic from gesture:', error);
            return;
          }
        }
        
        try {
          console.log('[App] 🎤 Calling startListeningFromArmedMic("gesture")...');
          await voiceController.startListeningFromArmedMic('gesture');
          console.log('[App] ✅ Voice ASR started successfully from gesture');
          console.log('[App] 🔍 ASR Instance ID:', voiceController.getAsrInstanceId());
        } catch (error) {
          console.error('[App] ❌ Failed to start voice ASR from gesture:', error);
        }
        
        console.log('[App] ==========================================');
      };

      console.log('[App] 🎤 Registering event listener for vibescape:trigger-voice');
      console.log('[App] Voice controller ready:', !!voiceController);
      window.addEventListener('vibescape:trigger-voice', handleGestureTrigger);
      
      return () => {
        window.removeEventListener('vibescape:trigger-voice', handleGestureTrigger);
      };
    }, [voiceController, voiceSettings.enabled]);

  return (
    <VoiceChipLazy 
      state={voiceState} 
      onManualTrigger={handleManualTrigger}
      voiceController={voiceController}
    />
  );
};

const VoiceChipLazy = ({ state, onManualTrigger, voiceController }: { 
  state: any; 
  onManualTrigger?: () => void;
  voiceController?: any;
}) => {
  const [VoiceChipComponent, setVoiceChipComponent] = React.useState<any>(null);

  React.useEffect(() => {
    import('./voice/ui/VoiceChip').then((mod) => {
      setVoiceChipComponent(() => mod.VoiceChip);
    });
  }, []);

  if (!VoiceChipComponent) return null;

  return (
    <VoiceChipComponent 
      state={state} 
      onManualTrigger={onManualTrigger}
      debugInfo={{
        asrInstanceId: voiceController?.getAsrInstanceId() || null,
        isMicArmed: voiceController?.isMicArmed() || false
      }}
    />
  );
};

const AppContent = () => {
  useMobileAudio(); // Initialize mobile audio service
  
  // Initialize PWA install prompt and Chrome optimizations
  React.useEffect(() => {
    const pwaPrompt = PWAInstallPrompt.getInstance();
    
    // Chrome-specific: Show install prompt earlier for better background playback
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const tipDelay = isChrome ? 15000 : 30000; // Show earlier on Chrome
    
    const tipTimer = setTimeout(() => {
      if (!pwaPrompt.isAppInstalled()) {
        pwaPrompt.showBackgroundPlaybackTip();
      }
    }, tipDelay);
    
    // Chrome-specific: Initialize background audio manager earlier
    if (isChrome) {
      setTimeout(() => {
        BackgroundAudioManager.getInstance();
      }, 1000);
    }
    
    return () => clearTimeout(tipTimer);
  }, []);
  
  return (
    <BrowserRouter>
      <GestureControlsProvider>
        <div className="min-h-screen bg-background overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/index" element={<Navigate to="/home" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <EnhancedHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emotions"
              element={
                <ProtectedRoute>
                  <EmotionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <LibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            {isFeatureEnabled('VOICE_CONTROL_ENABLED') && (
              <Route
                path="/voice-settings"
                element={
                  <ProtectedRoute>
                    <VoiceSettingsPageLazy />
                  </ProtectedRoute>
                }
              />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
          <MiniPlayer />
          <VoiceIntegration />
        </div>
      </GestureControlsProvider>
    </BrowserRouter>
  );
};

const VoiceSettingsPageLazy = () => {
  const [VoiceSettingsPage, setVoiceSettingsPage] = React.useState<any>(null);

  React.useEffect(() => {
    import('./settings/VoiceSettingsPage').then((mod) => {
      setVoiceSettingsPage(() => mod.default);
    });
  }, []);

  if (!VoiceSettingsPage) return <div>Loading...</div>;

  return <VoiceSettingsPage />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MusicPlayerProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </MusicPlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
