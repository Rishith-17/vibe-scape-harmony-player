
import { useState } from 'react';
import { Send, Mic, Camera } from 'lucide-react';
import MoodCard from '../components/MoodCard';
import PlaylistCard from '../components/PlaylistCard';

const HomePage = () => {
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'photo'>('text');

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '⚡', label: 'Energetic', icon: <div className="text-yellow-400">⚡</div> },
    { emoji: '😌', label: 'Calm' },
  ];

  const playlists = [
    {
      title: 'Happy Vibes',
      description: 'Uplifting tunes to boost your mood',
      gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    },
    {
      title: 'Calming Collection',
      description: 'Relax and unwind with soothing melodies',
      gradient: 'bg-gradient-to-br from-teal-400 to-blue-500',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      {/* Header */}
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          MoodTunes
        </h1>
      </div>

      {/* Input Mode Tabs */}
      <div className="px-6 mb-6">
        <div className="flex bg-gray-800/50 rounded-2xl p-1 backdrop-blur-sm">
          {[
            { id: 'text', label: 'Text', icon: Send },
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'photo', label: 'Photo', icon: Camera },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setInputMode(id as any)}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 ${
                inputMode === id
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 mb-8">
        {inputMode === 'text' && (
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="How are you feeling today?"
              className="w-full bg-gray-800/70 border border-gray-600 rounded-2xl py-4 px-6 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm transition-all duration-300"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-full hover:scale-110 transition-transform duration-200">
              <Send size={18} className="text-black" />
            </button>
          </div>
        )}

        {inputMode === 'voice' && (
          <div className="text-center py-8">
            <button className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-full hover:scale-110 transition-transform duration-300 animate-pulse">
              <Mic size={32} className="text-white" />
            </button>
            <p className="text-gray-300 mt-4">Tap to record your voice</p>
          </div>
        )}

        {inputMode === 'photo' && (
          <div className="text-center py-8">
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full hover:scale-110 transition-transform duration-300">
              <Camera size={32} className="text-white" />
            </button>
            <p className="text-gray-300 mt-4">Take a photo or upload from gallery</p>
          </div>
        )}
      </div>

      {/* Mood Selection */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">How are you feeling?</h2>
        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood) => (
            <MoodCard
              key={mood.label}
              emoji={mood.emoji}
              label={mood.label}
              icon={mood.icon}
              isSelected={selectedMood === mood.label}
              onClick={() => setSelectedMood(mood.label)}
            />
          ))}
        </div>
      </div>

      {/* Featured Playlists */}
      <div className="px-6">
        <h2 className="text-2xl font-bold mb-6">Featured Playlists</h2>
        <div className="grid grid-cols-1 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.title}
              title={playlist.title}
              description={playlist.description}
              gradient={playlist.gradient}
              textColor={playlist.textColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
