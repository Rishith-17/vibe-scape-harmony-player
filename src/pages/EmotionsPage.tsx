
import { useState, useRef } from 'react';
import { Camera, Mic, FileText, Zap, Brain, CameraOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmotionsPage = () => {
  const [analysisMode, setAnalysisMode] = useState<'camera' | 'voice' | 'text'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const analysisMethods = [
    { id: 'text', label: 'Text Analysis', icon: FileText, color: 'from-yellow-500 to-orange-500' },
    { id: 'camera', label: 'Live Camera', icon: Camera, color: 'from-blue-500 to-purple-500' },
    { id: 'voice', label: 'Voice Analysis', icon: Mic, color: 'from-red-500 to-pink-500' },
  ];

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

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeVoiceEmotion(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopVoiceRecording();
        }
      }, 10000);

      toast({
        title: "Recording Started",
        description: "Speak naturally for up to 10 seconds",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeVoiceEmotion = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-emotion-analysis', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        setAnalysisResult({
          mood: data.emotion,
          intensity: data.confidence * 10,
          music_suggestions: getMusicSuggestions(data.emotion)
        });

        toast({
          title: "Voice Analysis Complete!",
          description: `Detected emotion: ${data.emotion}`,
        });
      };
      reader.readAsDataURL(audioBlob);
    } catch (error: any) {
      console.error('Voice analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze voice emotion",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCameraEmotion = async () => {
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
      const { data, error } = await supabase.functions.invoke('camera-emotion-detection', {
        body: { image: capturedImage }
      });

      if (error) throw error;

      setAnalysisResult({
        mood: data.emotion,
        intensity: data.confidence * 10,
        music_suggestions: getMusicSuggestions(data.emotion)
      });

      toast({
        title: "Analysis Complete!",
        description: `Detected emotion: ${data.emotion} (${Math.round(data.confidence * 100)}% confidence)`,
      });
    } catch (error: any) {
      console.error('Camera analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze emotion from camera",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeTextEmotion = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mood-analysis', {
        body: { text: textInput, provider: 'gemini' }
      });

      if (error) throw error;

      // Ensure mood is one of the allowed emotions
      const allowedEmotions = ['happy', 'sad', 'neutral', 'angry'];
      let mood = data.analysis.mood.toLowerCase();
      if (!allowedEmotions.includes(mood)) {
        // Map other emotions to our allowed set
        if (['excited', 'energetic', 'joyful'].includes(mood)) mood = 'happy';
        else if (['melancholic', 'depressed', 'down'].includes(mood)) mood = 'sad';
        else if (['furious', 'mad', 'rage'].includes(mood)) mood = 'angry';
        else mood = 'neutral';
      }

      setAnalysisResult({
        mood,
        intensity: data.analysis.intensity,
        music_suggestions: getMusicSuggestions(mood)
      });

      toast({
        title: "Analysis Complete!",
        description: `Detected mood: ${mood} (${data.analysis.intensity}/10)`,
      });
    } catch (error: any) {
      console.error('Text analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze emotion",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMusicSuggestions = (emotion: string) => {
    const suggestions: { [key: string]: string[] } = {
      happy: ['pop', 'upbeat', 'energetic'],
      sad: ['ballad', 'acoustic', 'melancholic'],
      neutral: ['indie', 'ambient', 'chill'],
      angry: ['rock', 'metal', 'intense']
    };
    return suggestions[emotion] || ['pop', 'indie', 'acoustic'];
  };

  const handleAnalysis = async () => {
    if (analysisMode === 'camera') {
      await analyzeCameraEmotion();
    } else if (analysisMode === 'text') {
      await analyzeTextEmotion();
    } else if (analysisMode === 'voice') {
      if (isRecording) {
        stopVoiceRecording();
      } else {
        await startVoiceRecording();
      }
    }
  };

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐'
    };
    return emojiMap[mood] || '😐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          AI Emotion Analysis
        </h1>

        {/* Analysis Methods */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {analysisMethods.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => {
                setAnalysisMode(id as any);
                if (id !== 'camera') {
                  stopCamera();
                }
                if (id !== 'voice') {
                  setIsRecording(false);
                }
              }}
              className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                analysisMode === id
                  ? `bg-gradient-to-br ${color} shadow-lg`
                  : 'bg-gray-800/50 hover:bg-gray-700/60'
              }`}
            >
              <Icon size={32} className="text-white mx-auto mb-3" />
              <p className="text-white font-semibold text-center">{label}</p>
            </button>
          ))}
        </div>

        {/* Analysis Interface */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {analysisMode === 'camera' && 'Position your face in the frame and capture'}
            {analysisMode === 'voice' && 'Speak naturally for 10 seconds'}
            {analysisMode === 'text' && 'Describe your feelings or thoughts'}
          </h2>

          {analysisMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden">
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
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={64} className="text-gray-400" />
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-4 justify-center">
                {!isCameraOn ? (
                  <button
                    onClick={startCamera}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
                  >
                    <Camera size={20} />
                    Start Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureImage}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <CameraOff size={20} />
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {analysisMode === 'voice' && (
            <div className="text-center py-12">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700'
              }`}>
                <Mic size={40} className="text-white" />
              </div>
              {isRecording && (
                <p className="text-gray-300 mb-4">Recording... Speak naturally</p>
              )}
            </div>
          )}

          {analysisMode === 'text' && (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Describe your current mood and feelings... (e.g., 'I'm feeling excited about my new job but also a bit nervous')"
              className="w-full bg-gray-700 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-6"
              rows={4}
            />
          )}

          <button
            onClick={handleAnalysis}
            disabled={isAnalyzing || (analysisMode === 'camera' && !capturedImage)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center">
                <Brain className="animate-pulse mr-2" size={20} />
                Analyzing with AI...
              </div>
            ) : isRecording ? (
              <div className="flex items-center justify-center">
                <Mic className="mr-2" size={20} />
                Stop Recording
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Zap className="mr-2" size={20} />
                {analysisMode === 'voice' ? 'Start Recording' : 'Analyze Emotion'}
              </div>
            )}
          </button>
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Brain className="text-purple-400 mr-2" size={20} />
              AI Analysis Results
            </h3>
            
            {/* Mood Display */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">{getMoodEmoji(analysisResult.mood)}</div>
              <h4 className="text-2xl font-bold capitalize text-white mb-2">{analysisResult.mood}</h4>
              <p className="text-gray-400">Intensity: {analysisResult.intensity}/10</p>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-4">
              <div>
                <h5 className="text-white font-semibold mb-2">Recommended Music Genres:</h5>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.music_suggestions?.map((genre: string, index: number) => (
                    <span 
                      key={index}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Intensity Bar */}
              <div>
                <h5 className="text-white font-semibold mb-2">Emotional Intensity:</h5>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(analysisResult.intensity / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-1">{analysisResult.intensity}/10</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionsPage;
