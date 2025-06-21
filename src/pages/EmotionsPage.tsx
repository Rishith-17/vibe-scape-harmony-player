import { useState, useRef } from 'react';
import { Camera, CameraOff, Brain, Zap, Upload, Music } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';

const EMOTION_API_URL = "https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection";
const HF_TOKEN = "1y92txxOQo2opq2Jaz3GTiojuDKZzx5EHide"; // 🌟 Your working token

const EmotionsPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    getEmotionPlaylist,
    getEmotionPlaylistSongs,
    playEmotionPlaylist
  } = useMusicPlayer();

  const takePhotoWithCapacitor = async () => {
    const img = await CapacitorCamera.getPhoto({
      quality: 90, allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    }).catch(() => null);
    if (img?.dataUrl) setCapturedImage(img.dataUrl);
  };

  const selectFromGallery = async () => {
    const img = await CapacitorCamera.getPhoto({
      quality: 90, allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    }).catch(() => fileInputRef.current?.click());
    if (img?.dataUrl) setCapturedImage(img.dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = () => setCapturedImage(reader.result as string);
    file && reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setIsCameraOn(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
      setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const analyzeEmotion = async () => {
    if (!capturedImage) return toast({ title: "Error", description: "No image selected.", variant: "destructive" });

    setIsAnalyzing(true);
    try {
      const res = await fetch(EMOTION_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: capturedImage })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("No detection");

      const top = data.reduce((a, b) => (a.score > b.score ? a : b));
      setAnalysisResult({
        emotion: top.label.toLowerCase(),
        confidence: top.score,
        all: data
      });

      toast({ title: "Detected", description: `${top.label} (${Math.round(top.score*100)}%)` });

      const pl = getEmotionPlaylist(top.label.toLowerCase());
      if (pl) {
        const songs = await getEmotionPlaylistSongs(top.label.toLowerCase());
        if (songs.length) setTimeout(() => playEmotionPlaylist(top.label.toLowerCase()), 2000);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Detection failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Brain /> Emotion Detector <Zap /></h1>

      {!capturedImage && !isCameraOn && (
        <div className="space-y-4">
          <Button onClick={takePhotoWithCapacitor}><Camera /> Take Photo</Button>
          <Button onClick={selectFromGallery}><Upload /> Upload</Button>
          <Button onClick={startCamera}><Camera /> Camera</Button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} hidden />
        </div>
      )}

      {isCameraOn && (
        <div className="space-y-4">
          <video ref={videoRef} autoPlay muted className="rounded-lg" />
          <div className="flex gap-2">
            <Button onClick={captureImage}><Camera /> Capture</Button>
            <Button onClick={stopCamera}><CameraOff /> Cancel</Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4 mt-6">
          <img src={capturedImage} alt="Selected" className="rounded-lg" />
          <Button onClick={analyzeEmotion} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Detect Emotion'}
          </Button>
        </div>
      )}

      {analysisResult && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">
            {analysisResult.emotion} – {Math.round(analysisResult.confidence * 100)}%
          </h2>
          <ul className="space-y-2">
            {analysisResult.all.map((e: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{e.label}</span><span>{Math.round(e.score*100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <canvas ref={canvasRef} hidden />
    </div>
  );
};

export default EmotionsPage;