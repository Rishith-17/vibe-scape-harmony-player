import React, { useState, useEffect } from 'react';
import { X, Navigation, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface GestureSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureSettingsDialog: React.FC<GestureSettingsDialogProps> = ({ isOpen, onClose }) => {
  const [navMode, setNavMode] = useState<'cycle' | 'fixed'>('cycle');
  const [fixedDestination, setFixedDestination] = useState('/emotions');
  const { toast } = useToast();

  // Load saved preferences
  useEffect(() => {
    const savedMode = localStorage.getItem('vibescape_thumbs_nav_mode') as 'cycle' | 'fixed' || 'cycle';
    const savedDestination = localStorage.getItem('vibescape_thumbs_nav_destination') || '/emotions';
    setNavMode(savedMode);
    setFixedDestination(savedDestination);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('vibescape_thumbs_nav_mode', navMode);
    localStorage.setItem('vibescape_thumbs_nav_destination', fixedDestination);
    
    toast({
      title: "Settings Saved",
      description: `Thumbs up gesture will ${navMode === 'cycle' ? 'cycle through pages' : `navigate to ${fixedDestination.replace('/', '')}`}`,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>👍 Thumbs Up Navigation</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Configure how the thumbs up gesture navigates through your app.
          </p>
          
          <div className="space-y-4">
            <Label className="text-base font-medium">Navigation Mode</Label>
            <RadioGroup value={navMode} onValueChange={(value) => setNavMode(value as 'cycle' | 'fixed')}>
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <RadioGroupItem value="cycle" id="cycle" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="cycle" className="flex items-center gap-2 cursor-pointer">
                    <Repeat size={18} />
                    <span className="font-medium">Cycle Pages</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Navigate through Emotions → Library → Profile in order
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                    <Navigation size={18} />
                    <span className="font-medium">Fixed Destination</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Always navigate to a specific page
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {navMode === 'fixed' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Destination Page</Label>
              <RadioGroup value={fixedDestination} onValueChange={setFixedDestination}>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <RadioGroupItem value="/emotions" id="emotions" />
                  <Label htmlFor="emotions" className="flex-1 cursor-pointer font-medium">
                    Emotions
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <RadioGroupItem value="/library" id="library" />
                  <Label htmlFor="library" className="flex-1 cursor-pointer font-medium">
                    Library
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <RadioGroupItem value="/profile" id="profile" />
                  <Label htmlFor="profile" className="flex-1 cursor-pointer font-medium">
                    Profile
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
