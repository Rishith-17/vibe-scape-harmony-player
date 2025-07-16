
import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, Brain, Sparkles, Palette, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import EmotionResult from '@/components/EmotionResult';
import ImageUploader from '@/components/ImageUploader';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const EmotionDetector = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Convert base64 to the format expected by Hugging Face API
      const base64Data = selectedImage.split(',')[1];
      
      const response = await fetch('https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Data
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result && result.length > 0) {
        // Sort emotions by confidence score
        const sortedEmotions = result.sort((a: any, b: any) => b.score - a.score);
        setEmotionResult(sortedEmotions);
        
        toast({
          title: "Analysis Complete!",
          description: `Detected primary emotion: ${sortedEmotions[0].label}`,
        });
      } else {
        throw new Error('No emotions detected');
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not detect emotion from image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraCapture = async () => {
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

  const resetDetector = () => {
    setSelectedImage(null);
    setEmotionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
      {/* Enhanced 3D Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-primary to-accent rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse transform-gpu animate-[pulse_3s_ease-in-out_infinite]"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-secondary to-primary rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-1000 transform-gpu animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-accent to-muted rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-500 transform-gpu animate-[pulse_5s_ease-in-out_infinite]"></div>
        
        {/* Additional floating 3D spheres with enhanced animations */}
        <div className="absolute top-20 left-20 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-primary to-accent/80 rounded-full opacity-30 animate-bounce transform-gpu shadow-2xl hover:scale-110 transition-transform duration-300" style={{ animationDuration: '3s', filter: 'drop-shadow(0 0 20px hsla(var(--primary), 0.5))' }}></div>
        <div className="absolute bottom-32 right-32 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-secondary to-primary/80 rounded-full opacity-40 animate-bounce delay-700 transform-gpu shadow-2xl hover:scale-110 transition-transform duration-300" style={{ animationDuration: '4s', filter: 'drop-shadow(0 0 15px hsla(var(--secondary), 0.5))' }}></div>
        <div className="absolute top-1/3 right-20 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-accent to-muted/80 rounded-full opacity-50 animate-bounce delay-300 transform-gpu shadow-2xl hover:scale-110 transition-transform duration-300" style={{ animationDuration: '2.5s', filter: 'drop-shadow(0 0 10px hsla(var(--accent), 0.5))' }}></div>
        
        {/* Rotating gradient orbs */}
        <div className="absolute top-16 right-1/4 w-8 h-8 sm:w-16 sm:h-16 bg-gradient-conic from-primary via-secondary to-accent rounded-full opacity-60 animate-spin" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-16 left-1/4 w-6 h-6 sm:w-12 sm:h-12 bg-gradient-conic from-accent via-primary to-secondary rounded-full opacity-40 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
      </div>

      {/* Enhanced Floating Particles with 3D effect and gradient colors */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-secondary' : 'bg-accent'} rounded-full opacity-20 animate-ping transform-gpu shadow-lg`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: `perspective(1000px) rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg) translateZ(${Math.random() * 50}px)`,
              filter: `drop-shadow(0 0 ${2 + Math.random() * 4}px currentColor)`
            }}
          ></div>
        ))}
      </div>

      {/* Animated Neural Network Lines with gradient strokes */}
      <div className="absolute inset-0 opacity-15">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="neuralGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(var(--primary), 0.8)" />
              <stop offset="100%" stopColor="hsla(var(--accent), 0.8)" />
            </linearGradient>
            <linearGradient id="neuralGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsla(var(--secondary), 0.8)" />
              <stop offset="100%" stopColor="hsla(var(--primary), 0.8)" />
            </linearGradient>
          </defs>
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke={i % 2 === 0 ? "url(#neuralGradient1)" : "url(#neuralGradient2)"}
              strokeWidth="2"
              className="animate-pulse"
              style={{ 
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                filter: 'drop-shadow(0 0 3px currentColor)'
              }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-4 sm:p-6 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white transform hover:scale-110 transition-all duration-300 shadow-2xl">
                <Brain className="w-8 h-8 sm:w-12 sm:h-12 animate-bounce" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse transform hover:scale-105 transition-all duration-500 text-center">
              Emotion Detector
            </h1>
          </div>
          <p className="text-lg sm:text-2xl text-gray-200 max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
            🎨 Discover the magic of AI-powered emotion recognition
          </p>
          
          {/* Feature Pills - Mobile responsive */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {[
              { icon: Sparkles, text: "AI Powered", color: "from-yellow-400 to-orange-500" },
              { icon: Zap, text: "Real-time", color: "from-cyan-400 to-teal-500" },
              { icon: Palette, text: "Advanced", color: "from-purple-400 to-pink-500" }
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r ${feature.color} rounded-full text-white text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <feature.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Mobile first layout */}
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-0 lg:grid lg:gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="order-1">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/30 hover:shadow-primary/25 transition-all duration-500 hover:scale-[1.02] hover:border-primary/50">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg">
                    <Upload className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upload Image</h2>
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
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:scale-105 border-0"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Take Photo</span>
                    <span className="sm:hidden">Camera</span>
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-white/30 hover:bg-white/10 text-white hover:text-white backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Gallery</span>
                    <span className="sm:hidden">Upload</span>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <Button
                    onClick={analyzeEmotion}
                    disabled={!selectedImage || isAnalyzing}
                    className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 border-0"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" />
                        <span className="hidden sm:inline">Analyzing Magic...</span>
                        <span className="sm:hidden">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-pulse" />
                        <span className="hidden sm:inline">Detect Emotions ✨</span>
                        <span className="sm:hidden">Detect ✨</span>
                      </>
                    )}
                  </Button>
                  
                  {selectedImage && (
                    <Button
                      variant="outline"
                      onClick={resetDetector}
                      className="px-4 sm:px-8 h-12 sm:h-14 border-2 border-white/30 hover:bg-white/10 text-white hover:text-white backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="order-2">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/30 hover:shadow-accent/25 transition-all duration-500 hover:scale-[1.02] hover:border-accent/50">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg animate-pulse">
                    <Brain className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">AI Results</h2>
                </div>

                {emotionResult ? (
                  <div className="animate-fade-in">
                    <EmotionResult emotions={emotionResult} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-300 text-center">
                    <div className="relative mb-4 sm:mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-medium px-4">
                      {isAnalyzing
                        ? '🔮 Analyzing emotions...'
                        : '📸 Upload an image to discover emotions'}
                    </p>
                    {!isAnalyzing && (
                      <p className="text-sm text-gray-400 mt-3 sm:mt-4 px-4">
                        ✨ Experience AI emotion recognition
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Feature Pills - Mobile optimized */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-12 sm:mt-16 px-4">
          {[
            { icon: Camera, text: "Camera", color: "from-green-400 to-blue-500" },
            { icon: ImageIcon, text: "Gallery", color: "from-pink-400 to-purple-500" }
          ].map((feature, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r ${feature.color} rounded-full text-white text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-fade-in`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <feature.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionDetector;
            
