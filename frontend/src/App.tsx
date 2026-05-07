import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { IS_CABINET_DOMAIN, IS_DEV, CABINET_ORIGIN } from "./lib/urls";
import { isAuthenticated } from "./lib/auth";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Редирект /profile на my.nextpath.su в prod
const ProfileRedirect = () => {
  useEffect(() => {
    if (!IS_DEV) {
      window.location.href = CABINET_ORIGIN + "/profile";
    }
  }, []);
  if (IS_DEV) return <Profile />;
  return null;
};

// Охрана кабинета: если не авторизован → на главный сайт
const CabinetGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) {
      if (IS_DEV) {
        navigate("/");
      } else {
        window.location.href = import.meta.env.VITE_MAIN_URL || "https://nextpath.su";
      }
    }
  }, [navigate]);
  return isAuthenticated() ? <>{children}</> : null;
};

// Маршруты для my.nextpath.su
const CabinetRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/profile" replace />} />
    <Route path="/profile" element={
      <CabinetGuard><Profile /></CabinetGuard>
    } />
    <Route path="*" element={<Navigate to="/profile" replace />} />
  </Routes>
);

// Маршруты для nextpath.su
const MainRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/profile" element={<ProfileRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {IS_CABINET_DOMAIN ? <CabinetRoutes /> : <MainRoutes />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
