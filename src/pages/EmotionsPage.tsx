import { useState, useRef } from 'react'; import { Camera, Brain, Zap, CameraOff, Image, Upload, Music, Plus } from 'lucide-react'; import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'; import { useToast } from '@/hooks/use-toast'; import { useMusicPlayer } from '@/contexts/MusicPlayerContext'; import { Button } from '@/components/ui/button';

const EmotionsPage = () => { const [isAnalyzing, setIsAnalyzing] = useState(false); const [analysisResult, setAnalysisResult] = useState<any>(null); const [capturedImage, setCapturedImage] = useState<string | null>(null); const videoRef = useRef<HTMLVideoElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const streamRef = useRef<MediaStream | null>(null); const fileInputRef = useRef<HTMLInputElement>(null); const { toast } = useToast(); const { getEmotionPlaylist, addToEmotionPlaylist, playEmotionPlaylist, getEmotionPlaylistSongs } = useMusicPlayer();

const takePhotoWithCapacitor = async () => { try { const image = await CapacitorCamera.getPhoto({ quality: 90, allowEditing: true, resultType: CameraResultType.DataUrl, source: CameraSource.Camera, }); if (image.dataUrl) { setCapturedImage(image.dataUrl); toast({ title: "Photo Captured", description: "Photo captured successfully from camera" }); } } catch (error) { toast({ title: "Camera Error", description: "Failed to take photo with camera", variant: "destructive" }); } };

const selectFromGallery = async () => { try { const image = await CapacitorCamera.getPhoto({ quality: 90, allowEditing: true, resultType: CameraResultType.DataUrl, source: CameraSource.Photos, }); if (image.dataUrl) { setCapturedImage(image.dataUrl); toast({ title: "Photo Selected", description: "Photo selected successfully from gallery" }); } } catch (error) { if (fileInputRef.current) fileInputRef.current.click(); } };

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { setCapturedImage(e.target?.result as string); toast({ title: "Photo Selected", description: "Photo uploaded successfully" }); }; reader.readAsDataURL(file); } };

const analyzeEmotion = async () => { if (!capturedImage) { toast({ title: "Error", description: "Please capture or select an image first", variant: "destructive" }); return; } setIsAnalyzing(true); try { const base64Image = capturedImage.split(',')[1]; const response = await fetch('https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection', { method: 'POST', headers: { 'Authorization': 'Bearer 1y92txxOQo2opq2Jaz3GTiojuDKZzx5EHide', 'Content-Type': 'application/json', }, body: JSON.stringify({ inputs: base64Image }) });

if (!response.ok) throw new Error(`API request failed: ${response.status}`);

  const data = await response.json();
  if (data && data.length > 0) {
    const topEmotion = data.reduce((prev: any, curr: any) => (prev.score > curr.score ? prev : curr));
    setAnalysisResult({
      emotion: topEmotion.label.toLowerCase(),
      confidence: topEmotion.score,
      allEmotions: data
    });

    toast({
      title: "Analysis Complete!",
      description: `Detected emotion: ${topEmotion.label} (${Math.round(topEmotion.score * 100)}%)`
    });

    const emotionPlaylist = getEmotionPlaylist(topEmotion.label.toLowerCase());
    if (emotionPlaylist) {
      const songs = await getEmotionPlaylistSongs(topEmotion.label.toLowerCase());
      if (songs.length > 0) {
        setTimeout(() => playEmotionPlaylist(topEmotion.label.toLowerCase()), 2000);
      }
    }
  } else {
    throw new Error('No emotion data received');
  }
} catch (error: any) {
  toast({ title: "Analysis Failed", description: error.message || "Error occurred", variant: "destructive" });
} finally {
  setIsAnalyzing(false);
}

};

return ( <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 text-white pb-20"> <div className="pt-8 px-6"> <div className="text-center mb-8"> <div className="flex items-center justify-center gap-3 mb-4"> <Brain size={32} /> <h1 className="text-3xl font-bold">Emotion Detector</h1> <Zap size={32} /> </div> <p className="text-white/80">Upload a photo and let AI detect the emotion using facial expression analysis.</p> </div>

<div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Upload size={24} />
        <h2 className="text-xl font-semibold">Upload Image</h2>
      </div>

      {!capturedImage && (
        <div className="space-y-4">
          <button onClick={takePhotoWithCapacitor} className="w-full border-2 border-dashed border-white/30 rounded-xl p-8">
            <div className="flex flex-col items-center">
              <Camera size={48} className="mb-4" />
              <p className="font-medium">Take Photo with Camera</p>
            </div>
          </button>
          <button onClick={selectFromGallery} className="w-full border-2 border-dashed border-white/30 rounded-xl p-8">
            <div className="flex flex-col items-center">
              <Upload size={48} className="mb-4" />
              <p className="font-medium">Upload from Gallery</p>
            </div>
          </button>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden max-w-md mx-auto">
            <img src={capturedImage} alt="Selected" className="w-full h-full object-cover" />
          </div>
          <button onClick={analyzeEmotion} disabled={isAnalyzing} className="w-full bg-pink-600 py-4 rounded-xl">
            {isAnalyzing ? 'Analyzing...' : 'Detect Emotion'}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
    </div>
  </div>
</div>

); };

export default EmotionsPage;

