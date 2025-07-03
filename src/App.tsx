
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { useMobileAudio } from "@/hooks/useMobileAudio";
import BackgroundAudioManager from "@/services/BackgroundAudioManager";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNavigation from "@/components/BottomNavigation";
import MiniPlayer from "@/components/MiniPlayer";
import AuthPage from "./pages/AuthPage";
import EnhancedHomePage from "./pages/EnhancedHomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import EmotionsPage from "./pages/EmotionsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useMobileAudio(); // Initialize mobile audio service
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <EnhancedHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emotions"
          element={
            <ProtectedRoute>
              <EmotionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation />
      <MiniPlayer />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MusicPlayerProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </MusicPlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
