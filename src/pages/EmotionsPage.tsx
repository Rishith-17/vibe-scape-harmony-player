
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Camera, Image as ImageIcon, Brain, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import EmotionResult from '@/components/EmotionResult';
import ImageUploader from '@/components/ImageUploader';
import WebcamCaptureDialog from '@/components/WebcamCaptureDialog';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { emotionAnalysisService } from '@/services/EmotionAnalysisService';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigate } from 'react-router-dom';

const EmotionDetector = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isVoiceTriggered, setIsVoiceTriggered] = useState(false);
  const { toast } = useToast();
  const { playTrack } = useMusicPlayer();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoAnalyzeRef = useRef(false);

  // Initialize emotion analysis service with dependencies
  useEffect(() => {
    emotionAnalysisService.initialize({
      playTrack,
      showToast: toast,
      navigate,
    });

    // Check if there's a pending voice-triggered capture request
    if (emotionAnalysisService.consumePendingCapture()) {
      console.log('[EmotionsPage] Voice-triggered capture detected on mount');
      setIsVoiceTriggered(true);
      autoAnalyzeRef.current = true;
      // Open webcam on desktop (native will be handled differently)
      if (!Capacitor.isNativePlatform()) {
        setIsWebcamOpen(true);
      } else {
        // For native, trigger camera capture
        (async () => {
          try {
            const image = await CapacitorCamera.getPhoto({
              quality: 90,
              allowEditing: false,
              resultType: CameraResultType.DataUrl,
              source: CameraSource.Camera,
            });
            if (image.dataUrl) {
              setSelectedImage(image.dataUrl);
            }
          } catch (err) {
            console.error('Voice-triggered camera error:', err);
          }
        })();
      }
    }
  }, [playTrack, toast, navigate]);

  const handleImageSelect = (imageData: string) => {
    setSelectedImage(imageData);
    setEmotionResult(null);
  };

  const analyzeEmotion = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch(
        'https://zchhecueiqpqhvrnnmsm.supabase.co/functions/v1/emotion-detection',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: selectedImage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Emotion detection response:', result);
      
      if (result.emotions && result.emotions.length > 0) {
        setEmotionResult(result.emotions);
        
        toast({
          title: "Analysis Complete!",
          description: `Detected primary emotion: ${result.emotions[0].label}`,
        });
      } else {
        throw new Error('No emotions detected');
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not detect emotion from image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraCapture = async () => {
    // Use webcam dialog on desktop/web, Capacitor on native
    if (!Capacitor.isNativePlatform()) {
      setIsWebcamOpen(true);
      return;
    }

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setSelectedImage(image.dataUrl);
        setEmotionResult(null);
        toast({
          title: "Photo Captured!",
          description: "Ready for emotion analysis",
        });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWebcamCapture = useCallback(async (imageData: string) => {
    setSelectedImage(imageData);
    setEmotionResult(null);
    
    // If voice-triggered, auto-analyze immediately
    if (autoAnalyzeRef.current) {
      autoAnalyzeRef.current = false;
      setIsVoiceTriggered(false);
      
      toast({
        title: "Photo Captured!",
        description: "Analyzing your emotion...",
      });

      // Auto-analyze the captured image
      setIsAnalyzing(true);
      try {
        const emotions = await emotionAnalysisService.analyzeImage(imageData);
        if (emotions) {
          setEmotionResult(emotions);
          toast({
            title: "Analysis Complete!",
            description: `Detected primary emotion: ${emotions[0]?.label}`,
          });
        }
      } catch (error) {
        console.error('Auto-analyze error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      toast({
        title: "Photo Captured!",
        description: "Ready for emotion analysis",
      });
    }
  }, [toast]);

  const resetDetector = () => {
    setSelectedImage(null);
    setEmotionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f28] to-[#050510] text-white pb-32 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 170, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 255, 170, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridFlow 20s linear infinite'
          }}
        />
      </div>

      {/* Floating Data Stream Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? '#00ffaa' : i % 3 === 1 ? '#00d4ff' : '#7000ff',
              boxShadow: `0 0 ${4 + Math.random() * 8}px currentColor`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Ambient Lighting Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Add grid animation keyframes */}
        <style>{`
          @keyframes gridFlow {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
        `}</style>

        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <motion.div 
              className="relative"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full blur-xl opacity-60"></div>
              <div className="relative p-6 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 text-black">
                <Brain className="w-12 h-12" />
              </div>
            </motion.div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
              Emotion Detector
            </h1>
          </div>
          <p className="text-xl text-cyan-300/80 max-w-3xl mx-auto">
            AI-powered facial emotion recognition with neural network analysis
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="relative p-8 rounded-[2rem] overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(10, 10, 26, 0.8), rgba(15, 15, 40, 0.9))',
                backdropFilter: 'blur(20px)',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                transform: 'perspective(1000px) rotateY(-2deg)',
              }}
              whileHover={{
                scale: 1.02,
                rotateY: 0,
                transition: { duration: 0.3 }
              }}
            >
              {/* Glowing Border Effect */}
              <motion.div
                className="absolute inset-0 rounded-[2rem] opacity-60"
                style={{
                  background: 'linear-gradient(145deg, #00ffaa, #00d4ff, #00ffaa)',
                  filter: 'blur(8px)',
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-green-500"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(0, 255, 170, 0.5)',
                        '0 0 40px rgba(0, 255, 170, 0.8)',
                        '0 0 20px rgba(0, 255, 170, 0.5)',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Upload className="w-6 h-6 text-black" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-cyan-300">Upload Image</h2>
                </div>
                
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  selectedImage={selectedImage}
                  ref={fileInputRef}
                />

                {/* Camera and Gallery Options */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleCameraCapture}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium transition-all duration-300 border-0 relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-30"
                      whileHover={{ opacity: 0.3 }}
                    />
                    <Camera className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">Take Photo</span>
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-cyan-500/60 hover:bg-cyan-500/20 text-cyan-300 backdrop-blur-sm transition-all duration-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gallery
                  </Button>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={analyzeEmotion}
                    disabled={!selectedImage || isAnalyzing}
                    className="flex-1 h-14 text-lg bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 text-black font-bold transition-all duration-300 border-0 relative overflow-hidden group"
                  >
                    {isAnalyzing ? (
                      <>
                        <motion.div 
                          className="w-5 h-5 border-3 border-black border-t-transparent rounded-full mr-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3" />
                        Detect Emotions
                      </>
                    )}
                  </Button>
                  
                  {selectedImage && (
                    <Button
                      variant="outline"
                      onClick={resetDetector}
                      className="px-8 h-14 border-2 border-red-500/60 hover:bg-red-500/20 text-red-400 backdrop-blur-sm transition-all duration-300"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div 
              className="relative p-8 rounded-[2rem] overflow-hidden min-h-[500px]"
              style={{
                background: 'linear-gradient(145deg, rgba(10, 10, 26, 0.8), rgba(15, 15, 40, 0.9))',
                backdropFilter: 'blur(20px)',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                transform: 'perspective(1000px) rotateY(2deg)',
              }}
              whileHover={{
                scale: 1.02,
                rotateY: 0,
                transition: { duration: 0.3 }
              }}
            >
              {/* Glowing Border Effect */}
              <motion.div
                className="absolute inset-0 rounded-[2rem] opacity-60"
                style={{
                  background: 'linear-gradient(145deg, #7000ff, #00d4ff, #7000ff)',
                  filter: 'blur(8px)',
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(112, 0, 255, 0.5)',
                        '0 0 40px rgba(112, 0, 255, 0.8)',
                        '0 0 20px rgba(112, 0, 255, 0.5)',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Brain className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-purple-300">AI Results</h2>
                </div>

                {emotionResult ? (
                  <EmotionResult emotions={emotionResult} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Brain className="w-24 h-24 text-cyan-500/30 mb-4" />
                    </motion.div>
                    <p className="text-xl text-cyan-300/50">
                      {isAnalyzing ? 'Analyzing emotion patterns...' : 'Upload an image to detect emotions'}
                    </p>
                    
                    {/* Floating Data Indicators */}
                    {isAnalyzing && (
                      <div className="mt-8 relative w-full h-32">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                            style={{
                              left: `${10 + i * 10}%`,
                              boxShadow: '0 0 10px currentColor'
                            }}
                            animate={{
                              y: [0, -60, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Webcam Capture Dialog for Desktop */}
      <WebcamCaptureDialog
        isOpen={isWebcamOpen}
        onClose={() => {
          setIsWebcamOpen(false);
          setIsVoiceTriggered(false);
        }}
        onCapture={handleWebcamCapture}
        autoCapture={isVoiceTriggered}
      />
    </div>
  );
};

export default EmotionDetector;
