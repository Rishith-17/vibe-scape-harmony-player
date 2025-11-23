import React, { useState, useEffect } from 'react';
import { getGlobalVoiceController } from '@/voice/voiceController';

/**
 * Development-only debug overlay showing voice controller status
 * Displays: mic armed status, ASR instance ID, and last gesture
 */
export const VoiceDebugOverlay: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    micArmed: false,
    asrInstanceId: null as string | null,
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    // Only show in development
    if (import.meta.env.PROD) return;

    const updateDebugInfo = () => {
      const controller = getGlobalVoiceController();
      if (controller) {
        setDebugInfo({
          micArmed: controller.isMicArmed(),
          asrInstanceId: controller.getAsrInstanceId(),
          lastUpdate: Date.now(),
        });
      }
    };

    // Update initially
    updateDebugInfo();

    // Update every 500ms
    const interval = setInterval(updateDebugInfo, 500);

    return () => clearInterval(interval);
  }, []);

  // Only render in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white text-xs p-3 rounded-lg font-mono max-w-[280px] border border-primary/30 shadow-lg">
      <div className="font-bold mb-2 text-primary">🔧 Voice Controller Debug</div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mic Armed:</span>
          <span className={debugInfo.micArmed ? 'text-green-400 font-bold' : 'text-red-400'}>
            {debugInfo.micArmed ? '✅ YES' : '❌ NO'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Controller:</span>
          <span className={getGlobalVoiceController() ? 'text-green-400' : 'text-red-400'}>
            {getGlobalVoiceController() ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="border-t border-primary/20 pt-1 mt-1">
          <div className="text-muted-foreground mb-0.5">ASR Instance ID:</div>
          <div 
            className="truncate text-[10px] bg-black/50 px-1 py-0.5 rounded"
            title={debugInfo.asrInstanceId || 'null'}
          >
            {debugInfo.asrInstanceId || 'Not initialized'}
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-primary/20 text-[10px] text-muted-foreground">
        💡 Tap mic to arm • Open hand gesture to activate
      </div>
    </div>
  );
};
