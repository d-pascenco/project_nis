import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { RoadmapPreview } from "@/components/RoadmapPreview";
import type { RoadmapData } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Shared = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }
    fetch(`/api/share/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setRoadmap(data.roadmap))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-serif text-foreground">Ссылка недействительна</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Эта страница не существует или ссылка устарела.
        </p>
        <Button variant="hero" onClick={() => navigate("/onboarding")}>
          Создать свой план
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="hero" size="sm" onClick={() => navigate("/onboarding")}>
            Создать свой план
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Персональная карта развития — создана с помощью NextPath
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <RoadmapPreview
            userData={{
              fullName: "",
              targetProfession: "",
              timeline: "",
            }}
            roadmapData={roadmap}
            isLoading={false}
            hideActions={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Shared;
