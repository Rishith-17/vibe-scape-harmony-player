
import { useState } from 'react';
import { Camera, Upload, Mic, FileText, Zap } from 'lucide-react';

const EmotionsPage = () => {
  const [analysisMode, setAnalysisMode] = useState<'camera' | 'upload' | 'voice' | 'text'>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisMethods = [
    { id: 'camera', label: 'Live Camera', icon: Camera, color: 'from-blue-500 to-purple-500' },
    { id: 'upload', label: 'Upload Photo', icon: Upload, color: 'from-green-500 to-teal-500' },
    { id: 'voice', label: 'Voice Analysis', icon: Mic, color: 'from-red-500 to-pink-500' },
    { id: 'text', label: 'Text Analysis', icon: FileText, color: 'from-yellow-500 to-orange-500' },
  ];

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Emotion Analysis
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
            {analysisMode === 'text' && 'Type how you feel'}
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
              placeholder="Describe your current mood and feelings..."
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
                <Zap className="animate-spin mr-2" size={20} />
                Analyzing...
              </div>
            ) : (
              'Analyze Emotion'
            )}
          </button>
        </div>

        {/* Results Section */}
        {isAnalyzing && (
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Happiness</span>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full w-3/4 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Energy</span>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full w-2/3 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Calm</span>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionsPage;
