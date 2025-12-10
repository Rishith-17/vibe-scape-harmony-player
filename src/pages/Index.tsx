import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check for OAuth callback tokens in hash
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      // OAuth callback - redirect to home
      navigate('/home', { replace: true });
      return;
    }

    // Wait for auth to finish loading
    if (loading) return;

    // Redirect based on auth state
    if (user) {
      navigate('/home', { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Show minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="animate-pulse text-white text-xl">Loading...</div>
    </div>
  );
};

export default Index;
