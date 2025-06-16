
import { useState, useRef } from 'react';
import { Camera, Brain, Zap, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EmotionsPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

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
    setCapturedImage(null);
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
      }
    }
  };

  const analyzeEmotion = async () => {
    if (!capturedImage) {
      toast({
        title: "Error",
        description: "Please capture an image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert image to base64 (remove data:image/jpeg;base64, prefix)
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
      console.log('Hugging Face API response:', data);

      if (data && data.length > 0) {
        // Find the emotion with highest score
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          AI Emotion Detector
        </h1>

        {/* Camera Interface */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <Camera className="text-blue-400" size={24} />
            Face Emotion Detection
          </h2>

          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden max-w-md mx-auto">
              {isCameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {capturedImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={64} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Camera Preview</p>
                  </div>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex gap-4 justify-center flex-wrap">
              {!isCameraOn ? (
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105"
                >
                  <Camera size={20} />
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={captureImage}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105"
                  >
                    <Camera size={20} />
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105"
                  >
                    <CameraOff size={20} />
                    Stop Camera
                  </button>
                </>
              )}
            </div>

            {capturedImage && (
              <button
                onClick={analyzeEmotion}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <Brain className="animate-pulse mr-2" size={20} />
                    Analyzing Emotion...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="mr-2" size={20} />
                    Detect Emotion
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Brain className="text-purple-400 mr-2" size={20} />
              Emotion Analysis Results
            </h3>
            
            {/* Primary Emotion Display */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">{getMoodEmoji(analysisResult.emotion)}</div>
              <h4 className="text-2xl font-bold capitalize text-white mb-2">
                {analysisResult.emotion}
              </h4>
              <p className="text-gray-400">
                Confidence: {Math.round(analysisResult.confidence * 100)}%
              </p>
            </div>

            {/* Confidence Bar */}
            <div className="mb-6">
              <h5 className="text-white font-semibold mb-2">Confidence Level:</h5>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`bg-gradient-to-r ${getEmotionColor(analysisResult.emotion)} h-3 rounded-full transition-all duration-1000`}
                  style={{ width: `${analysisResult.confidence * 100}%` }}
                ></div>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {Math.round(analysisResult.confidence * 100)}% confident
              </p>
            </div>

            {/* All Detected Emotions */}
            {analysisResult.allEmotions && (
              <div>
                <h5 className="text-white font-semibold mb-3">All Detected Emotions:</h5>
                <div className="space-y-2">
                  {analysisResult.allEmotions
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((emotion: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
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
                        <span className="text-sm text-gray-300 w-12 text-right">
                          {Math.round(emotion.score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionsPage;
