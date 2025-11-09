import React, { useState } from 'react';
import { ArrowLeft, Mic, Volume2, Globe, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoiceSettings } from '@/store/voiceSettings';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const VoiceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const settings = useVoiceSettings();
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handleEnableToggle = (checked: boolean) => {
    if (checked && !settings.consentGiven) {
      setShowConsentDialog(true);
    } else {
      settings.setEnabled(checked);
      toast.success(checked ? 'Voice control enabled' : 'Voice control disabled');
    }
  };

  const handleConsentAccept = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      settings.setConsentGiven(true);
      settings.setEnabled(true);
      setShowConsentDialog(false);
      toast.success('Voice control enabled');
    } catch (error) {
      toast.error('Microphone permission denied');
      setShowConsentDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Voice & Privacy</h1>
            <p className="text-sm text-muted-foreground">Configure hands-free voice controls</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Control
            </CardTitle>
            <CardDescription>
              Enable hands-free music control with voice commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Enable Voice Control</p>
                <p className="text-sm text-muted-foreground">
                  Say "Hey Vibe" to activate
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={handleEnableToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* ASR Settings */}
        {settings.enabled && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Recognition Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Offline Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use on-device speech recognition (slower but private)
                    </p>
                  </div>
                  <Switch
                    checked={settings.useOfflineAsr}
                    onCheckedChange={settings.setUseOfflineAsr}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Wake Word Sensitivity
                  </label>
                  <Slider
                    value={[settings.wakeSensitivity * 100]}
                    onValueChange={([value]) => settings.setWakeSensitivity(value / 100)}
                    min={0}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = more sensitive (may trigger accidentally)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={settings.language} onValueChange={(v: any) => settings.setLanguage(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-IN">English (India)</SelectItem>
                    <SelectItem value="hi-IN">हिन्दी (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Enable TTS Responses</p>
                    <p className="text-sm text-muted-foreground">
                      Speak confirmations and feedback
                    </p>
                  </div>
                  <Switch
                    checked={settings.ttsEnabled}
                    onCheckedChange={settings.setTtsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Info */}
            <Card className="border-muted-foreground/20">
              <CardHeader>
                <CardTitle className="text-base">Privacy Notice</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  • Wake word detection runs entirely on your device
                </p>
                <p>
                  • {settings.useOfflineAsr 
                      ? 'Speech recognition runs on your device' 
                      : 'Speech transcripts are sent to your browser\'s speech service'}
                </p>
                <p>
                  • No audio is stored or sent to our servers
                </p>
                <p>
                  • You can disable voice control anytime
                </p>
              </CardContent>
            </Card>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                settings.reset();
                toast.success('Voice data cleared and disabled');
              }}
            >
              Delete Voice Data & Disable
            </Button>
          </>
        )}
      </div>

      {/* Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Voice Control?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Voice control requires microphone access.</p>
              <p className="font-medium">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Wake word detection runs on your device</li>
                <li>Voice commands are processed locally when possible</li>
                <li>No audio is stored or sent to our servers</li>
                <li>You can disable it anytime in settings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>
              Allow & Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceSettingsPage;
