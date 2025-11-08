import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Music, Wifi, Zap, Hand } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Already Installable",
        description: "Use your browser menu to install this app",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "Installation Started",
        description: "App is being installed...",
      });
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Install VibeScape
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get the full music experience with offline playback and hand gesture controls
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Download className="w-6 h-6 text-primary" />
              Why Install?
            </CardTitle>
            <CardDescription>
              Transform your music experience with these powerful features
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-lg bg-background/50">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Offline Playback</h3>
                  <p className="text-sm text-muted-foreground">
                    Listen to your favorite tracks even without internet
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-background/50">
              <div className="flex items-start gap-3">
                <Hand className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Hand Gesture Controls</h3>
                  <p className="text-sm text-muted-foreground">
                    Control playback with simple hand movements
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-background/50">
              <div className="flex items-start gap-3">
                <Music className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Background Audio</h3>
                  <p className="text-sm text-muted-foreground">
                    Music keeps playing when you switch apps
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-background/50">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Faster Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Lightning-fast loading and smooth playback
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isInstalled ? (
            <Button 
              onClick={handleInstall}
              size="lg"
              className="text-lg px-8"
            >
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/')}
              size="lg"
              className="text-lg px-8"
            >
              Open App
            </Button>
          )}
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="text-lg px-8"
          >
            Continue in Browser
          </Button>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">How to Install on Mobile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📱 iPhone (Safari):</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Tap the Share button (square with arrow)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🤖 Android (Chrome):</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Tap the three dots menu</li>
                <li>Tap "Install app" or "Add to Home Screen"</li>
                <li>Tap "Install"</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
