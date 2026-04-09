import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetUsername from "./pages/SetUsername";
import BolaoList from "./pages/BolaoList";
import BolaoDetail from "./pages/BolaoDetail";
import Calendario from "./pages/Calendario";
import Admin from "./pages/Admin";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowDefaultUsername = false }: { children: React.ReactNode; allowDefaultUsername?: boolean }) => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      const savedRedirect = localStorage.getItem("invite_redirect");
      if (savedRedirect) {
        localStorage.removeItem("invite_redirect");
        navigate(savedRedirect, { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to set-username if needed, but NOT if we're already allowing default username (i.e. on /set-username)
  if (!allowDefaultUsername && profile && profile.username.startsWith("user_")) {
    return <Navigate to="/set-username" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/convite/:code" element={<Invite />} />
            <Route
              path="/set-username"
              element={
                <ProtectedRoute allowDefaultUsername>
                  <SetUsername />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bolao"
              element={
                <ProtectedRoute>
                  <BolaoList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bolao/:id"
              element={
                <ProtectedRoute>
                  <BolaoDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <Calendario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
