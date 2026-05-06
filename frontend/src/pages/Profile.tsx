import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { RoadmapPreview } from "@/components/RoadmapPreview";
import { authHeaders, clearToken, getUser, isAuthenticated } from "@/lib/auth";
import { RoadmapData } from "@/pages/Onboarding";
import { LogOut } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/"); return; }

    fetch("/api/me", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (data.roadmap) setRoadmap(data.roadmap); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm text-muted-foreground hidden md:block">{user.name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {loading ? (
          <div className="text-center text-muted-foreground py-24">Загрузка...</div>
        ) : roadmap ? (
          <>
            <RoadmapPreview
              userData={{
                fullName: user?.name || "",
                targetProfession: roadmap.stages[0]?.title || "",
                timeline: roadmap.total_duration || "",
              }}
              roadmapData={roadmap}
              isLoading={false}
              hideActions
            />
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => navigate("/onboarding")}>
                Обновить план
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-24 space-y-4">
            <p className="text-muted-foreground">У вас пока нет сохранённого плана.</p>
            <Button variant="hero" onClick={() => navigate("/onboarding")}>
              Создать дорожную карту
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
