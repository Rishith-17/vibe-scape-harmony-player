import React, { useState, useRef } from 'react';
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
        title: 'No Image Selected',
        description: 'Please upload an image first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const base64Data = selectedImage.split(',')[1];
      const response = await fetch('/api/emotion-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) throw new Error('API request failed');

      const result = await response.json();

      if (result && result.length > 0) {
        const sortedEmotions = result.sort((a: any, b: any) => b.score - a.score);
        setEmotionResult(sortedEmotions);
        toast({
          title: 'Analysis Complete!',
          description: `Detected: ${sortedEmotions[0].label}`,
        });
      } else {
        throw new Error('No emotions detected');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Analysis Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDetector = () => {
    setSelectedImage(null);
    setEmotionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Emotion Detector</h1>

      <Card>
        <CardContent className="space-y-4">
          <ImageUploader
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            ref={fileInputRef}
          />

          <div className="flex gap-4">
            <Button onClick={analyzeEmotion} disabled={!selectedImage || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Detect Emotion'}
            </Button>
            <Button variant="outline" onClick={resetDetector} disabled={!selectedImage}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {emotionResult && <EmotionResult emotions={emotionResult} />}
    </div>
  );
};

export default EmotionDetector;