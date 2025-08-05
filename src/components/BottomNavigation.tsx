
import { Home, Search, Library, User, Brain } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Brain, label: 'Emotions', path: '/emotions' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50 w-full overflow-hidden">
      <div className="flex justify-around items-center py-2 px-2 max-w-full">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isEmotions = path === '/emotions';
          
          if (isEmotions) {
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center py-3 px-3 rounded-2xl transition-all duration-500 min-w-0 flex-1 group ${
                  isActive
                    ? 'transform scale-110 animate-pulse'
                    : 'hover:scale-105'
                }`}
                style={{
                  background: isActive 
                    ? 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #ec489980 0%, #3b82f680 100%)',
                  boxShadow: isActive
                    ? '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(59, 130, 246, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 0 15px rgba(236, 72, 153, 0.3), 0 0 30px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <div className={`relative ${isActive ? 'animate-bounce' : 'group-hover:animate-pulse'}`}>
                  <Icon 
                    size={24} 
                    className={`flex-shrink-0 transition-all duration-300 ${
                      isActive 
                        ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                        : 'text-white/80 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                    }`}
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-sm animate-ping"></div>
                  )}
                </div>
                <span 
                  className={`text-xs mt-2 font-bold truncate w-full text-center transition-all duration-300 ${
                    isActive 
                      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] text-shadow-glow' 
                      : 'text-white/80 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                  }`}
                  style={{
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    textShadow: isActive 
                      ? '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)'
                      : '0 0 5px rgba(255, 255, 255, 0.4)'
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-blue-500/20 animate-pulse"></div>
                )}
              </button>
            );
          }
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
                isActive
                  ? 'text-yellow-400 transform scale-110'
                  : 'text-gray-400 hover:text-white hover:scale-105'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="text-xs mt-1 font-medium truncate w-full text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
