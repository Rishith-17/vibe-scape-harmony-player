
import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, Brain, Sparkles, Palette, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import EmotionResult from '@/components/EmotionResult';
import ImageUploader from '@/components/ImageUploader';

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
          'Authorization': 'Bearer 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 ',
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

  const resetDetector = () => {
    setSelectedImage(null);
    setEmotionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements - Optimized for mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-pink-500 to-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles - Reduced for mobile */}
      <div className="absolute inset-0 hidden sm:block">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
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
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 hover:shadow-pink-500/25 transition-all duration-500">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg">
                    <Upload className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Upload Image</h2>
                </div>
                
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  selectedImage={selectedImage}
                  ref={fileInputRef}
                />

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
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 hover:shadow-cyan-500/25 transition-all duration-500">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg animate-pulse">
                    <Brain className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">AI Results</h2>
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
            
