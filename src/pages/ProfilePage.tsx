
import { Camera, Settings, Bell, Moon, HelpCircle, Info, LogOut, Edit } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CameraAvatarDialog from '@/components/CameraAvatarDialog';
import EditProfileDialog from '@/components/EditProfileDialog';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleImageSelected = (imageUrl: string) => {
    setAvatarUrl(imageUrl);
    toast({
      title: "Success",
      description: "Profile photo updated successfully",
    });
  };

  const handleProfileUpdated = () => {
    // Force a re-render to show updated user data
    window.location.reload();
  };

  const settingsItems = [
    { icon: Bell, label: 'Notifications', toggle: notifications, onToggle: setNotifications },
    { icon: Moon, label: 'Dark Mode', toggle: darkMode, onToggle: setDarkMode },
  ];

  const supportItems = [
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: Info, label: 'About MoodTunes' },
  ];

  // Get username from user metadata or email
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-32">
      <div className="pt-8 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-teal-400 bg-clip-text text-transparent">
          Profile
        </h1>

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsCameraDialogOpen(true)}
              className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full hover:scale-110 transition-transform duration-200"
            >
              <Camera size={16} className="text-black" />
            </button>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{username}</h2>
          <p className="text-gray-400 mb-6">{displayEmail}</p>
          
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setIsEditDialogOpen(true)}
              className="bg-gray-800/50 border border-gray-600 px-6 py-3 rounded-full hover:bg-gray-700/60 transition-all duration-300 flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Profile
            </button>
            <button 
              onClick={handleSignOut}
              className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Settings</h3>
          <div className="space-y-3">
            {settingsItems.map(({ icon: Icon, label, toggle, onToggle }) => (
              <div
                key={label}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <Icon size={20} className="text-gray-300" />
                  </div>
                  <span className="text-white font-medium">{label}</span>
                </div>
                <button
                  onClick={() => onToggle(!toggle)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${
                    toggle ? 'bg-yellow-400' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                      toggle ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Support</h3>
          <div className="space-y-3">
            {supportItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300 cursor-pointer flex items-center"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                  <Icon size={20} className="text-gray-300" />
                </div>
                <span className="text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CameraAvatarDialog
        isOpen={isCameraDialogOpen}
        onClose={() => setIsCameraDialogOpen(false)}
        onImageSelected={handleImageSelected}
      />
      
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default ProfilePage;
