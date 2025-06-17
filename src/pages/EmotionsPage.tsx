import { useState, useRef } from 'react';
import { Camera, Brain, Zap, CameraOff, Image, Upload, Music, Plus } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';

const EmotionsPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { 
    getEmotionPlaylist, 
    addToEmotionPlaylist, 
    playEmotionPlaylist,
    getEmotionPlaylistSongs 
  } = useMusicPlayer();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
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

  const takePhotoWithCapacitor = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        stopCamera();
        toast({
          title: "Photo Captured",
          description: "Photo captured successfully from camera",
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Failed to take photo with camera",
        variant: "destructive",
      });
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        stopCamera();
        toast({
          title: "Photo Selected",
          description: "Photo selected successfully from gallery",
        });
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      // Fallback to file input for web
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        toast({
          title: "Photo Selected",
          description: "Photo uploaded successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeEmotion = async () => {
    if (!capturedImage) {
      toast({
        title: "Error",
        description: "Please capture or select an image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Image = capturedImage.split(',')[1];
      
      const response = await fetch('https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Image
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Emotion detection result:', data);

      if (data && data.length > 0) {
        const topEmotion = data.reduce((prev: any, current: any) => 
          (prev.score > current.score) ? prev : current
        );

        setAnalysisResult({
          emotion: topEmotion.label.toLowerCase(),
          confidence: topEmotion.score,
          allEmotions: data
        });

        toast({
          title: "Analysis Complete!",
          description: `Detected emotion: ${topEmotion.label} (${Math.round(topEmotion.score * 100)}% confidence)`,
        });

        // Auto-play emotion playlist if it has songs
        const detectedEmotion = topEmotion.label.toLowerCase();
        const emotionPlaylist = getEmotionPlaylist(detectedEmotion);
        if (emotionPlaylist) {
          const songs = await getEmotionPlaylistSongs(detectedEmotion);
          if (songs.length > 0) {
            setTimeout(() => {
              playEmotionPlaylist(detectedEmotion);
            }, 2000);
          }
        }
      } else {
        throw new Error('No emotion data received from API');
      }
    } catch (error: any) {
      console.error('Emotion analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze emotion from image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    stopCamera();
  };

  const getMoodEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      happy: 'from-yellow-400 to-orange-500',
      sad: 'from-blue-400 to-blue-600',
      angry: 'from-red-400 to-red-600',
      fear: 'from-purple-400 to-purple-600',
      surprise: 'from-pink-400 to-pink-600',
      disgust: 'from-green-400 to-green-600',
      neutral: 'from-gray-400 to-gray-600'
    };
    return colorMap[emotion] || 'from-gray-400 to-gray-600';
  };

  const handlePlayEmotionPlaylist = async () => {
    if (!analysisResult) return;
    
    try {
      await playEmotionPlaylist(analysisResult.emotion);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play emotion playlist",
        variant: "destructive",
      });
    }
  };

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 text-white pb-20">
        <div className="pt-8 px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="text-white" size={32} />
              <h1 className="text-3xl font-bold">Emotion Detector</h1>
              <Zap className="text-white" size={32} />
            </div>
            <p className="text-white/80">
              Upload a photo and let AI detect the emotion from facial expressions with advanced machine learning
            </p>
          </div>

          {/* Image Display */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
            <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden max-w-md mx-auto mb-6">
              <img
                src={capturedImage}
                alt="Analyzed"
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              onClick={analyzeEmotion}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <Brain className="animate-pulse mr-2" size={20} />
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Brain className="mr-2" size={20} />
                  Detect Emotion
                </div>
              )}
            </button>
          </div>

          {/* Detection Results */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Zap className="text-white mr-2" size={20} />
              Detection Results
            </h3>
            
            {/* Primary Emotion Display */}
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">{getMoodEmoji(analysisResult.emotion)}</div>
              <h4 className="text-3xl font-bold capitalize text-white mb-2">
                {analysisResult.emotion}
              </h4>
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-2 rounded-full inline-block">
                {Math.round(analysisResult.confidence * 100)}% Confidence
              </div>
              <p className="text-white/70 mt-4">
                The AI detected <span className="font-semibold text-white">{analysisResult.emotion}</span> emotion with{' '}
                {Math.round(analysisResult.confidence * 100)}% confidence.
              </p>
            </div>

            {/* Confidence Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`bg-gradient-to-r ${getEmotionColor(analysisResult.emotion)} h-3 rounded-full transition-all duration-1000`}
                  style={{ width: `${analysisResult.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* All Detected Emotions */}
            {analysisResult.allEmotions && (
              <div className="mb-6">
                <h5 className="text-white font-semibold mb-3">All Detected Emotions:</h5>
                <div className="space-y-2">
                  {analysisResult.allEmotions
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((emotion: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodEmoji(emotion.label.toLowerCase())}</span>
                        <span className="capitalize font-medium">{emotion.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-600 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${getEmotionColor(emotion.label.toLowerCase())} h-2 rounded-full`}
                            style={{ width: `${emotion.score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-white w-12 text-right">
                          {Math.round(emotion.score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Music Actions */}
            <div className="space-y-3">
              <Button
                onClick={handlePlayEmotionPlaylist}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                <Music className="mr-2" size={20} />
                Play {analysisResult.emotion} Playlist
              </Button>

              <p className="text-center text-white/70 text-sm">
                Music will automatically play based on your detected emotion. 
                You can add more songs to your emotion playlists from the search page!
              </p>
            </div>

            <Button
              onClick={resetAnalysis}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
            >
              Analyze Another Image
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 text-white pb-20">
      <div className="pt-8 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="text-white" size={32} />
            <h1 className="text-3xl font-bold">Emotion Detector</h1>
            <Zap className="text-white" size={32} />
          </div>
          <p className="text-white/80">
            Upload a photo and let AI detect the emotion from facial expressions with advanced machine learning
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Upload className="text-white" size={24} />
            <h2 className="text-xl font-semibold">Upload Image</h2>
          </div>

          {!capturedImage && !isCameraOn && (
            <div className="space-y-4">
              {/* Camera Option */}
              <button
                onClick={takePhotoWithCapacitor}
                className="w-full border-2 border-dashed border-white/30 rounded-xl p-8 hover:border-white/50 transition-all duration-300 hover:bg-white/5"
              >
                <div className="flex flex-col items-center">
                  <Camera size={48} className="text-white/70 mb-4" />
                  <p className="text-white font-medium">Take Photo with Camera</p>
                </div>
              </button>

              {/* Gallery Option */}
              <button
                onClick={selectFromGallery}
                className="w-full border-2 border-dashed border-white/30 rounded-xl p-8 hover:border-white/50 transition-all duration-300 hover:bg-white/5"
              >
                <div className="flex flex-col items-center">
                  <Upload size={48} className="text-white/70 mb-4" />
                  <p className="text-white font-medium">Upload from Gallery</p>
                </div>
              </button>

              {/* Web Camera Option */}
              <button
                onClick={startCamera}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center justify-center">
                  <Camera className="mr-2" size={20} />
                  Use Web Camera
                </div>
              </button>
            </div>
          )}

          {/* Camera Preview */}
          {isCameraOn && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden max-w-md mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={captureImage}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300"
                >
                  <Camera size={20} />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300"
                >
                  <CameraOff size={20} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected Image Preview */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden max-w-md mx-auto">
                <img
                  src={capturedImage}
                  alt="Selected for analysis"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <button
                onClick={analyzeEmotion}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <Brain className="animate-pulse mr-2" size={20} />
                    Detecting Emotion...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Brain className="mr-2" size={20} />
                    Detect Emotion
                  </div>
                )}
              </button>

              <button
                onClick={resetAnalysis}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all duration-300"
              >
                Choose Different Image
              </button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default EmotionsPage;
