
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import EmotionsPage from "./pages/EmotionsPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNavigation from "./components/BottomNavigation";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="relative">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <HomePage />
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
                path="/library" 
                element={
                  <ProtectedRoute>
                    <LibraryPage />
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
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Routes>
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <BottomNavigation />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
