import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FormCard } from "@/components/FormCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Briefcase,
  Award,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
  Loader2,
  UserPlus,
} from "lucide-react";
import { RoadmapData } from "@/pages/Onboarding";
import { setToken, setUser, isAuthenticated, authHeaders } from "@/lib/auth";

interface RoadmapPreviewProps {
  userData: {
    fullName: string;
    targetProfession: string;
    timeline: string;
  };
  roadmapData?: RoadmapData | null;
  isLoading?: boolean;
  hideActions?: boolean;
}

const PLATFORM_LINKS: Record<string, string> = {
  Stepik: "https://stepik.org/search",
  Coursera: "https://www.coursera.org/search",
  YouTube: "https://www.youtube.com/results",
  GitHub: "https://github.com/search",
  "Яндекс Практикум": "https://practicum.yandex.ru",
  Хекслет: "https://ru.hexlet.io",
  freeCodeCamp: "https://www.freecodecamp.org",
  Udemy: "https://www.udemy.com/courses/search",
  "JavaScript.info": "https://javascript.info",
  MDN: "https://developer.mozilla.org/ru/search",
  "Frontend Mentor": "https://www.frontendmentor.io",
  Scrimba: "https://scrimba.com",
  CodeWars: "https://www.codewars.com",
  LinkedIn: "https://www.linkedin.com",
};

const getResourceUrl = (name: string): string => {
  for (const [key, url] of Object.entries(PLATFORM_LINKS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return url;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(name)}`;
};

const roadmapStages = [
  { id: 1, title: "Основы программирования", duration: "4 недели", skills: ["HTML/CSS", "JavaScript Basics", "Git"], resources: ["freeCodeCamp", "Codecademy", "YouTube"] },
  { id: 2, title: "Продвинутый JavaScript", duration: "6 недель", skills: ["ES6+", "Async/Await", "DOM API"], resources: ["JavaScript.info", "Udemy", "MDN"] },
  { id: 3, title: "React.js Разработка", duration: "8 недель", skills: ["React Hooks", "State Management", "API Integration"], resources: ["React Docs", "Scrimba", "Stepik"] },
  { id: 4, title: "Проектная практика", duration: "4 недели", skills: ["Portfolio Project", "Code Review", "Best Practices"], resources: ["GitHub", "Frontend Mentor", "CodeWars"] },
  { id: 5, title: "Подготовка к трудоустройству", duration: "4 недели", skills: ["Resume", "Interview Prep", "Networking"], resources: ["LinkedIn", "Glassdoor", "Mock Interviews"] },
];

export const RoadmapPreview = ({ userData, roadmapData, isLoading, hideActions }: RoadmapPreviewProps) => {
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const professionLabels: Record<string, string> = {
    frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Fullstack Developer",
    "data-scientist": "Data Scientist", "ml-engineer": "ML Engineer", devops: "DevOps Engineer",
    product: "Product Manager", designer: "UX/UI Designer", analyst: "Business Analyst", qa: "QA Engineer",
  };
  const timelineLabels: Record<string, string> = {
    "3months": "3 месяца", "6months": "6 месяцев", "1year": "1 год", "2years": "2 года", flexible: "Гибкий срок",
  };

  const stages = roadmapData?.stages ?? roadmapStages;

  const handlePdf = () => window.print();

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Мой план развития — NextPath", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Ссылка скопирована!");
        setTimeout(() => setShareMsg(null), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setSavingRoadmap(true);
    try {
      // authenticate
      const authRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!authRes.ok) throw new Error("Auth failed");
      const { token, user } = await authRes.json();
      setToken(token);
      setUser(user);

      // save roadmap if available
      if (roadmapData) {
        await fetch("/api/me/roadmap", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ roadmap: roadmapData }),
        });
      }
      setShowSignIn(false);
      navigate("/profile");
    } catch (err) {
      console.error("Sign-in error:", err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in" id="roadmap-print">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Ваша дорожная карта готова
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          Путь к{" "}
          <span className="text-primary">
            {professionLabels[userData.targetProfession] || userData.targetProfession || "цели"}
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {userData.fullName}, персональный план на{" "}
          {timelineLabels[userData.timeline] || roadmapData?.total_duration || "6 месяцев"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Срок", value: roadmapData?.total_duration || timelineLabels[userData.timeline] || "6 месяцев" },
          { icon: BookOpen, label: "Этапов", value: `${stages.length} этапа` },
          { icon: Award, label: "Навыков", value: `${stages.reduce((n, s) => n + s.skills.length, 0)}+` },
          { icon: Briefcase, label: "Ресурсов", value: `${stages.reduce((n, s) => n + s.resources.length, 0)}+` },
        ].map((stat, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-card border border-border text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="font-medium text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Roadmap timeline */}
      <FormCard title="Ваш план развития">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Генерируем персональный план...</p>
          </div>
        ) : (
          <>
            {roadmapData?.summary && (
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{roadmapData.summary}</p>
            )}
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {stages.map((stage, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <div key={stage.id} className="relative pl-14">
                      <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center font-serif ${
                        isCurrent ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                      }`}>
                        {isCurrent ? <span>{stage.id}</span> : <Circle className="w-4 h-4" />}
                      </div>
                      <div className={`p-5 rounded-xl border transition-all ${
                        isCurrent ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/10"
                      }`}>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-medium text-foreground">{stage.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {stage.duration}
                            </div>
                          </div>
                          {isCurrent && <Badge className="bg-primary/10 text-primary border-0">Текущий этап</Badge>}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Навыки:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {stage.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Ресурсы:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {stage.resources.map((resource) => (
                                <a key={resource} href={getResourceUrl(resource)} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="outline" className="text-xs text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors">
                                    {resource}
                                  </Badge>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                        {isCurrent && (
                          <Button
                            variant="default"
                            size="sm"
                            className="mt-4 no-print"
                            onClick={() => window.open(getResourceUrl(stage.resources[0]), "_blank")}
                          >
                            Начать обучение
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </FormCard>

      {/* Action buttons */}
      {!hideActions && !isLoading && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
          <Button variant="hero" size="lg" onClick={handlePdf}>
            <Download className="w-4 h-4" />
            Скачать план (PDF)
          </Button>
          <Button variant="outline" size="lg" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            {shareMsg || "Поделиться"}
          </Button>
        </div>
      )}

      {/* Register CTA */}
      {!hideActions && !isLoading && !isAuthenticated() && (
        <div className="no-print border border-primary/20 rounded-2xl p-6 bg-primary/5 text-center space-y-3">
          <p className="font-medium text-foreground">Сохраните план и отслеживайте прогресс</p>
          <p className="text-sm text-muted-foreground">Войдите через Google — это займёт 10 секунд</p>
          <Button variant="hero" onClick={() => setShowSignIn(true)}>
            <UserPlus className="w-4 h-4" />
            Войти и сохранить план
          </Button>
        </div>
      )}

      {/* Google Sign-In dialog */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Войти через Google</DialogTitle>
          </DialogHeader>
          {savingRoadmap ? (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Сохраняем план...
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error("Google login failed")}
                useOneTap={false}
                locale="ru"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
