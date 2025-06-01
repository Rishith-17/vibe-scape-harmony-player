
import { Home, Search, Library, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50 w-full overflow-hidden">
      <div className="flex justify-around items-center py-2 px-2 max-w-full">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
              location.pathname === path
                ? 'text-yellow-400 transform scale-110'
                : 'text-gray-400 hover:text-white hover:scale-105'
            }`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="text-xs mt-1 font-medium truncate w-full text-center">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
