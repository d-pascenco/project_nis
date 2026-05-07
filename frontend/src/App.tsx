import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { IS_CABINET_DOMAIN, IS_DEV, CABINET_ORIGIN, MAIN_ORIGIN } from "./lib/urls";
import { isAuthenticated, setToken } from "./lib/auth";

// ── Cross-subdomain auth handshake ────────────────────────────────────────────
// localStorage не шарится между nextpath.su и my.nextpath.su.
// При редиректе передаём токен в ?t=, здесь сохраняем и чистим URL.
console.log("[App] hostname:", window.location.hostname, "IS_CABINET_DOMAIN:", IS_CABINET_DOMAIN, "IS_DEV:", IS_DEV);
if (IS_CABINET_DOMAIN) {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("t");
  console.log("[App] cabinet: urlToken present:", !!urlToken, "current auth:", isAuthenticated());
  if (urlToken) {
    setToken(urlToken);
    window.history.replaceState({}, "", window.location.pathname);
    console.log("[App] token saved from URL, isAuthenticated now:", isAuthenticated());
  }
}

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

// Охрана кабинета: синхронная проверка до рендера
// (токен уже сохранён из URL выше, поэтому race condition отсутствует)
const CabinetGuard = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    if (!IS_DEV) window.location.replace(MAIN_ORIGIN);
    return null;
  }
  return <>{children}</>;
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
