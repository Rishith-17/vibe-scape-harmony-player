import { useState, useRef } from 'react'; import { Camera, Brain, Zap, CameraOff, Upload, Music } from 'lucide-react'; import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'; import { useToast } from '@/hooks/use-toast'; import { useMusicPlayer } from '@/contexts/MusicPlayerContext'; import { Button } from '@/components/ui/button';

const EmotionsPage = () => { const [isAnalyzing, setIsAnalyzing] = useState(false); const [analysisResult, setAnalysisResult] = useState<any>(null); const [isCameraOn, setIsCameraOn] = useState(false); const [capturedImage, setCapturedImage] = useState<string | null>(null); const videoRef = useRef<HTMLVideoElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const fileInputRef = useRef<HTMLInputElement>(null); const streamRef = useRef<MediaStream | null>(null); const { toast } = useToast(); const { getEmotionPlaylist, addToEmotionPlaylist, playEmotionPlaylist, getEmotionPlaylistSongs } = useMusicPlayer();

const startCamera = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; setIsCameraOn(true); } } catch (error) { toast({ title: 'Camera Error', description: 'Could not access camera. Please check permissions.', variant: 'destructive' }); } };

const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; } setIsCameraOn(false); };

const captureImage = () => { if (videoRef.current && canvasRef.current) { const canvas = canvasRef.current; const video = videoRef.current;

canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }
}

};

const takePhotoWithCapacitor = async () => { try { const image = await CapacitorCamera.getPhoto({ quality: 90, allowEditing: true, resultType: CameraResultType.DataUrl, source: CameraSource.Camera, }); setCapturedImage(image.dataUrl); stopCamera(); toast({ title: 'Photo Captured', description: 'Successfully captured from camera.' }); } catch (error) { toast({ title: 'Camera Error', description: 'Failed to take photo.', variant: 'destructive' }); } };

const selectFromGallery = async () => { try { const image = await CapacitorCamera.getPhoto({ quality: 90, allowEditing: true, resultType: CameraResultType.DataUrl, source: CameraSource.Photos, }); setCapturedImage(image.dataUrl); stopCamera(); } catch (error) { if (fileInputRef.current) fileInputRef.current.click(); } };

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => setCapturedImage(e.target?.result as string); reader.readAsDataURL(file); } };

const analyzeEmotion = async () => { if (!capturedImage) return toast({ title: 'Error', description: 'No image provided', variant: 'destructive' });

setIsAnalyzing(true);
try {
  const base64Image = capturedImage.split(',')[1];

  const response = await fetch('https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: base64Image })
  });

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid API response');

  const top = data.reduce((prev, curr) => prev.score > curr.score ? prev : curr);

  setAnalysisResult({
    emotion: top.label.toLowerCase(),
    confidence: top.score,
    allEmotions: data
  });

  const detectedEmotion = top.label.toLowerCase();
  const playlist = getEmotionPlaylist(detectedEmotion);
  const songs = await getEmotionPlaylistSongs(detectedEmotion);
  if (playlist && songs.length > 0) {
    setTimeout(() => playEmotionPlaylist(detectedEmotion), 2000);
  }
} catch (err: any) {
  toast({ title: 'API Error', description: err.message || 'Emotion analysis failed.', variant: 'destructive' });
} finally {
  setIsAnalyzing(false);
}

};

const reset = () => { setCapturedImage(null); setAnalysisResult(null); stopCamera(); };

const getEmoji = (emotion: string) => ({ happy: '😊', sad: '😢', angry: '😠', fear: '😨', surprise: '😲', disgust: '🤢', neutral: '😐' })[emotion] || '😐';

const getColor = (emotion: string) => ({ happy: 'from-yellow-400 to-orange-500', sad: 'from-blue-400 to-blue-600', angry: 'from-red-400 to-red-600', fear: 'from-purple-400 to-purple-600', surprise: 'from-pink-400 to-pink-600', disgust: 'from-green-400 to-green-600', neutral: 'from-gray-400 to-gray-600' })[emotion] || 'from-gray-400 to-gray-600';

return ( <div className="p-4"> <h1 className="text-2xl font-bold mb-4">Emotion Detector</h1>

{capturedImage ? (
    <>
      <img src={capturedImage} alt="Captured" className="w-full max-w-sm rounded-lg" />
      <Button onClick={analyzeEmotion} disabled={isAnalyzing} className="mt-4">
        {isAnalyzing ? 'Analyzing...' : 'Detect Emotion'}
      </Button>
      <Button onClick={reset} variant="ghost" className="mt-2">Reset</Button>
    </>
  ) : (
    <div className="space-y-3">
      <Button onClick={takePhotoWithCapacitor}>Take Photo</Button>
      <Button onClick={selectFromGallery}>Select From Gallery</Button>
      <Button onClick={startCamera}>Use Web Camera</Button>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
    </div>
  )}

  {analysisResult && (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Detected Emotion</h2>
      <p className="text-lg">{getEmoji(analysisResult.emotion)} {analysisResult.emotion} ({Math.round(analysisResult.confidence * 100)}%)</p>
    </div>
  )}

  <canvas ref={canvasRef} className="hidden" />
  <video ref={videoRef} autoPlay playsInline muted className="hidden" />
</div>

); };

export default EmotionsPage;

