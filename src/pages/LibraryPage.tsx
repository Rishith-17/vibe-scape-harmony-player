
import { Heart, Music, Clock, Download } from 'lucide-react';

const LibraryPage = () => {
  const libraryItems = [
    { icon: Heart, title: 'Liked Songs', count: '127 songs', gradient: 'from-purple-500 to-pink-500' },
    { icon: Music, title: 'My Playlists', count: '8 playlists', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Clock, title: 'Recently Played', count: '25 songs', gradient: 'from-green-500 to-teal-500' },
    { icon: Download, title: 'Downloaded', count: '45 songs', gradient: 'from-orange-500 to-red-500' },
  ];

  const playlists = [
    'Chill Vibes',
    'Workout Energy',
    'Focus Music',
    'Evening Relaxation',
    'Happy Moments',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-20">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Your Library
        </h1>

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {libraryItems.map(({ icon: Icon, title, count, gradient }) => (
            <div
              key={title}
              className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300`}
              style={{ boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)' }}
            >
              <Icon size={32} className="text-white mb-3" />
              <h3 className="text-white font-semibold text-lg">{title}</h3>
              <p className="text-white/80 text-sm">{count}</p>
            </div>
          ))}
        </div>

        {/* Playlists */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Playlists</h2>
          <div className="space-y-3">
            {playlists.map((playlist, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 cursor-pointer flex items-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-4 flex items-center justify-center">
                  <Music size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{playlist}</h3>
                  <p className="text-gray-400 text-sm">12 songs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;
