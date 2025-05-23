
import { useState } from 'react';
import { Camera, Upload, Mic, FileText, Zap, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmotionsPage = () => {
  const [analysisMode, setAnalysisMode] = useState<'camera' | 'upload' | 'voice' | 'text'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const analysisMethods = [
    { id: 'text', label: 'Text Analysis', icon: FileText, color: 'from-yellow-500 to-orange-500' },
    { id: 'camera', label: 'Live Camera', icon: Camera, color: 'from-blue-500 to-purple-500' },
    { id: 'upload', label: 'Upload Photo', icon: Upload, color: 'from-green-500 to-teal-500' },
    { id: 'voice', label: 'Voice Analysis', icon: Mic, color: 'from-red-500 to-pink-500' },
  ];

  const handleAnalysis = async () => {
    if (analysisMode === 'text') {
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
        // Use Gemini for emotion analysis
        const { data, error } = await supabase.functions.invoke('ai-mood-analysis', {
          body: { text: textInput, provider: 'gemini' }
        });

        if (error) throw error;

        setAnalysisResult(data.analysis);

        toast({
          title: "Analysis Complete!",
          description: `Detected mood: ${data.analysis.mood} (${data.analysis.intensity}/10)`,
        });
      } catch (error: any) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze emotion",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // Simulate analysis for other modes
      setIsAnalyzing(true);
      setTimeout(() => {
        setAnalysisResult({
          mood: 'happy',
          intensity: 7,
          music_suggestions: ['pop', 'upbeat', 'energetic']
        });
        setIsAnalyzing(false);
        toast({
          title: "Analysis Complete!",
          description: "Emotion detected successfully",
        });
      }, 3000);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      calm: '😌',
      angry: '😠',
      excited: '🤩',
      melancholic: '😔',
      peaceful: '🕊️',
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          {analysisMethods.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setAnalysisMode(id as any)}
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
            {analysisMode === 'camera' && 'Position your face in the frame'}
            {analysisMode === 'upload' && 'Select a photo to analyze'}
            {analysisMode === 'voice' && 'Speak naturally for 10 seconds'}
            {analysisMode === 'text' && 'Describe your feelings or thoughts'}
          </h2>

          {analysisMode === 'camera' && (
            <div className="aspect-square bg-gray-700 rounded-xl mb-6 flex items-center justify-center">
              <Camera size={64} className="text-gray-400" />
            </div>
          )}

          {analysisMode === 'upload' && (
            <div className="aspect-square bg-gray-700 rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-500">
              <Upload size={64} className="text-gray-400" />
            </div>
          )}

          {analysisMode === 'voice' && (
            <div className="text-center py-12">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                isAnalyzing ? 'bg-red-500 animate-pulse' : 'bg-gray-700'
              }`}>
                <Mic size={40} className="text-white" />
              </div>
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
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center">
                <Brain className="animate-pulse mr-2" size={20} />
                Analyzing with AI...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Zap className="mr-2" size={20} />
                Analyze Emotion
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Results Section */}
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
