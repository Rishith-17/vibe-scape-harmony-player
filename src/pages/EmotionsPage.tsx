'use client';

import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, Brain, Sparkles, Palette, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import EmotionResult from '@/components/EmotionResult';
import ImageUploader from '@/components/ImageUploader';
import { getHuggingFaceToken } from '@/lib/getHuggingFaceToken';

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
        title: 'No Image Selected',
        description: 'Please upload an image first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const base64Data = selectedImage.split(',')[1];
      const token = await getHuggingFaceToken();

      const response = await fetch(
        'https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: base64Data }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result && result.length > 0) {
        const sortedEmotions = result.sort((a: any, b: any) => b.score - a.score);
        setEmotionResult(sortedEmotions);
        toast({
          title: 'Analysis Complete!',
          description: `Detected primary emotion: ${sortedEmotions[0].label}`,
        });
      } else {
        throw new Error('No emotions detected');
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not detect emotion from image. Please try again.',
        variant: 'destructive',
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-2">Emotion Detector</h1>
          <p className="text-lg opacity-80">🎨 Discover AI-powered emotion recognition</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/10 text-white backdrop-blur-md shadow-lg border-white/10">
            <CardContent className="space-y-4 p-6">
              <ImageUploader
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
                ref={fileInputRef}
              />
              <div className="flex gap-4">
                <Button onClick={analyzeEmotion} disabled={!selectedImage || isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Detect Emotion ✨'}
                </Button>
                {selectedImage && (
                  <Button variant="outline" onClick={resetDetector}>
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 text-white backdrop-blur-md shadow-lg border-white/10">
            <CardContent className="p-6">
              {emotionResult ? (
                <EmotionResult emotions={emotionResult} />
              ) : (
                <div className="text-center py-10 text-gray-300">
                  {isAnalyzing ? 'Analyzing emotions...' : '📸 Upload an image to begin'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmotionDetector;