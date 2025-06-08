
import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraAvatarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
}

const CameraAvatarDialog = ({ isOpen, onClose, onImageSelected }: CameraAvatarDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const requestCameraPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const takePhoto = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        toast({
          title: "Permission Required",
          description: "Camera permission is required to take photos",
          variant: "destructive",
        });
        return;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        onImageSelected(image.dataUrl);
        onClose();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Error",
        description: "Failed to take photo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromGallery = async () => {
    setIsLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        onImageSelected(image.dataUrl);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      toast({
        title: "Error",
        description: "Failed to select photo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Choose Profile Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={takePhoto}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold flex items-center gap-3"
          >
            <CameraIcon size={20} />
            Take a Photo
          </Button>
          
          <Button
            onClick={selectFromGallery}
            disabled={isLoading}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-3"
          >
            <Image size={20} />
            Choose from Gallery
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraAvatarDialog;
