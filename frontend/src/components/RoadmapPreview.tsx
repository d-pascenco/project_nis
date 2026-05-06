import { createPortal } from "react-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock, Download, Share2, Sparkles, Loader2, ExternalLink, ChevronRight,
} from "lucide-react";
import { RoadmapData } from "@/pages/Onboarding";
import { setToken, setUser, isAuthenticated, authHeaders } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormSnapshot {
  fullName?: string;
  age?: string;
  location?: string;
  currentStatus?: string;
  education?: string;
  university?: string;
  specialization?: string;
  yearsExperience?: string;
  currentRole?: string;
  targetProfession?: string;
  targetIndustry?: string;
  timeline?: string;
  technicalSkills?: string[];
  hoursPerWeek?: number;
  budget?: string;
}

interface RoadmapPreviewProps {
  userData: { fullName: string; targetProfession: string; timeline: string };
  roadmapData?: RoadmapData | null;
  isLoading?: boolean;
  hideActions?: boolean;
  formSnapshot?: FormSnapshot;
}

// ── Static fallback stages ────────────────────────────────────────────────────

const FALLBACK_STAGES = [
  { id: 1, title: "Основы программирования", duration: "4 недели", skills: ["HTML/CSS", "JavaScript", "Git"], resources: ["freeCodeCamp", "Codecademy", "YouTube"] },
  { id: 2, title: "Углублённый JavaScript", duration: "6 недель", skills: ["ES6+", "Async/Await", "DOM"], resources: ["JavaScript.info", "Udemy", "MDN"] },
  { id: 3, title: "React-разработка", duration: "8 недель", skills: ["React Hooks", "State", "API"], resources: ["React Docs", "Scrimba", "Stepik"] },
  { id: 4, title: "Проектная практика", duration: "4 недели", skills: ["Portfolio", "Code Review"], resources: ["GitHub", "Frontend Mentor"] },
  { id: 5, title: "Подготовка к трудоустройству", duration: "4 недели", skills: ["Resume", "Interview"], resources: ["LinkedIn", "Хекслет"] },
];

const PLATFORM_URLS: Record<string, string> = {
  Stepik: "https://stepik.org/search", Coursera: "https://www.coursera.org/search",
  YouTube: "https://www.youtube.com/results", GitHub: "https://github.com/search",
  Хекслет: "https://ru.hexlet.io", freeCodeCamp: "https://www.freecodecamp.org",
  Udemy: "https://www.udemy.com/courses/search", "JavaScript.info": "https://javascript.info",
  MDN: "https://developer.mozilla.org/ru", LinkedIn: "https://www.linkedin.com",
  Kaggle: "https://www.kaggle.com", Codecademy: "https://www.codecademy.com",
};

const resourceUrl = (name: string) => {
  for (const [k, v] of Object.entries(PLATFORM_URLS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(name + " курс")}`;
};

const PROFESSION_LABELS: Record<string, string> = {
  frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Fullstack Developer",
  "data-scientist": "Data Scientist", "ml-engineer": "ML Engineer", devops: "DevOps Engineer",
  product: "Product Manager", designer: "UX/UI Designer", analyst: "Business Analyst", qa: "QA Engineer",
};

const TIMELINE_LABELS: Record<string, string> = {
  "3months": "3 месяца", "6months": "6 месяцев", "1year": "1 год", "2years": "2 года", flexible: "Гибкий срок",
};

const STATUS_LABELS: Record<string, string> = {
  student: "Студент", graduate: "Выпускник", employed: "Работаю",
  unemployed: "В поиске работы", "career-change": "Меняю карьеру",
};

// ── Stage colors ──────────────────────────────────────────────────────────────

const STAGE_COLORS = [
  "bg-primary/10 border-primary/30 text-primary",
  "bg-blue-500/10 border-blue-500/30 text-blue-600",
  "bg-violet-500/10 border-violet-500/30 text-violet-600",
  "bg-amber-500/10 border-amber-500/30 text-amber-600",
  "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
  "bg-rose-500/10 border-rose-500/30 text-rose-600",
];

// ── Print Layout (portal — renders outside #root) ─────────────────────────────

const PrintLayout = ({ userData, formSnapshot, roadmapData, stages }: {
  userData: RoadmapPreviewProps["userData"];
  formSnapshot?: FormSnapshot;
  roadmapData?: RoadmapData | null;
  stages: typeof FALLBACK_STAGES;
}) => createPortal(
  <div className="nextpath-print-root">
    <style>{`
      .nextpath-print-root { font-family: 'DM Sans', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 700px; }
      .nextpath-print-root h1 { font-size: 26px; margin-bottom: 4px; color: #c0623e; }
      .nextpath-print-root h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
      .nextpath-print-root h3 { font-size: 14px; margin: 16px 0 4px; }
      .nextpath-print-root p, .nextpath-print-root li { font-size: 13px; margin: 2px 0; color: #444; }
      .nextpath-print-root ul { padding-left: 20px; }
      .nextpath-print-root .meta { display: flex; gap: 32px; margin: 8px 0 24px; }
      .nextpath-print-root .meta span { font-size: 12px; color: #666; }
      .nextpath-print-root .stage { margin: 12px 0; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
      .nextpath-print-root .stage-title { font-weight: bold; font-size: 14px; }
      .nextpath-print-root .arrow { text-align: center; font-size: 18px; color: #c0623e; margin: 4px 0; }
      .nextpath-print-root .section-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .nextpath-print-root .info-row { font-size: 12px; }
      .nextpath-print-root .info-row b { color: #333; }
    `}</style>

    <h1>NextPath — Персональный план развития</h1>
    <div className="meta">
      <span>Дата: {new Date().toLocaleDateString("ru-RU")}</span>
      <span>nextpath.su</span>
    </div>

    <h2>Профиль</h2>
    <div className="section-info">
      <div className="info-row"><b>Имя:</b> {formSnapshot?.fullName || userData.fullName}</div>
      <div className="info-row"><b>Возраст:</b> {formSnapshot?.age || "—"}</div>
      <div className="info-row"><b>Город:</b> {formSnapshot?.location || "—"}</div>
      <div className="info-row"><b>Статус:</b> {STATUS_LABELS[formSnapshot?.currentStatus || ""] || formSnapshot?.currentStatus || "—"}</div>
      <div className="info-row"><b>Образование:</b> {formSnapshot?.university || "—"}{formSnapshot?.specialization ? `, ${formSnapshot.specialization}` : ""}</div>
      <div className="info-row"><b>Опыт:</b> {formSnapshot?.yearsExperience ? `${formSnapshot.yearsExperience} лет` : "—"}</div>
      <div className="info-row"><b>Текущая роль:</b> {formSnapshot?.currentRole || "—"}</div>
      <div className="info-row"><b>Навыки:</b> {formSnapshot?.technicalSkills?.join(", ") || "—"}</div>
    </div>

    <h2>Цель</h2>
    <div className="section-info">
      <div className="info-row"><b>Профессия:</b> {PROFESSION_LABELS[formSnapshot?.targetProfession || ""] || formSnapshot?.targetProfession || "—"}</div>
      <div className="info-row"><b>Индустрия:</b> {formSnapshot?.targetIndustry || "—"}</div>
      <div className="info-row"><b>Срок:</b> {TIMELINE_LABELS[formSnapshot?.timeline || ""] || roadmapData?.total_duration || "—"}</div>
      <div className="info-row"><b>Часов/неделю:</b> {formSnapshot?.hoursPerWeek || "—"}</div>
    </div>

    {roadmapData?.summary && (
      <>
        <h2>Резюме плана</h2>
        <p>{roadmapData.summary}</p>
      </>
    )}

    <h2>Дорожная карта</h2>
    {stages.map((stage, i) => (
      <div key={stage.id}>
        <div className="stage">
          <div className="stage-title">{i + 1}. {stage.title}</div>
          <p><b>Срок:</b> {stage.duration}</p>
          <p><b>Навыки:</b></p>
          <ul>{stage.skills.map((s) => <li key={s}>{s}</li>)}</ul>
          <p><b>Ресурсы:</b> {stage.resources.join(", ")}</p>
        </div>
        {i < stages.length - 1 && <div className="arrow">↓</div>}
      </div>
    ))}
  </div>,
  document.body,
);

// ── Main component ────────────────────────────────────────────────────────────

export const RoadmapPreview = ({
  userData, roadmapData, isLoading, hideActions, formSnapshot,
}: RoadmapPreviewProps) => {
  const navigate = useNavigate();
  const [showResources, setShowResources] = useState<number | null>(null);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const stages = roadmapData?.stages ?? FALLBACK_STAGES;
  const profession = PROFESSION_LABELS[userData.targetProfession] || userData.targetProfession || "цели";
  const timeline = TIMELINE_LABELS[userData.timeline] || roadmapData?.total_duration || "6 месяцев";

  const handlePdf = () => window.print();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Мой план — NextPath`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMsg("Ссылка скопирована!");
        setTimeout(() => setShareMsg(null), 2500);
      }
    } catch { /* cancelled */ }
  };

  const handleGoogleSuccess = async (resp: { credential?: string }) => {
    if (!resp.credential) return;
    setSavingRoadmap(true);
    setAuthError(null);
    try {
      const authRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: resp.credential }),
      });
      const body = await authRes.json().catch(() => ({}));
      if (!authRes.ok) throw new Error(body.detail || `Ошибка ${authRes.status}`);
      setToken(body.token);
      setUser(body.user);
      if (roadmapData) {
        await fetch("/api/me/roadmap", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ roadmap: roadmapData }),
        });
      }
      navigate("/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка авторизации";
      setAuthError(msg);
      console.error("Sign-in error:", err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  return (
    <>
      {/* Print layout — rendered via portal outside #root */}
      <PrintLayout userData={userData} formSnapshot={formSnapshot} roadmapData={roadmapData} stages={stages} />

      <div className="space-y-10 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Ваша дорожная карта готова
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">
            Путь к <span className="text-primary">{profession}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {userData.fullName}, персональный план на {timeline}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Срок", value: timeline },
            { label: "Этапов", value: String(stages.length) },
            { label: "Навыков", value: `${stages.reduce((n, s) => n + s.skills.length, 0)}+` },
            { label: "Ресурсов", value: `${stages.reduce((n, s) => n + s.resources.length, 0)}+` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="font-medium text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Roadmap flowchart */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Генерируем персональный план...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {roadmapData?.summary && (
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed text-center">{roadmapData.summary}</p>
            )}

            {stages.map((stage, idx) => {
              const color = STAGE_COLORS[idx % STAGE_COLORS.length];
              const isCurrent = idx === 0;
              return (
                <div key={stage.id}>
                  {/* Stage block */}
                  <div className={`relative rounded-2xl border-2 p-6 transition-all ${
                    isCurrent
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-card border-border/60 hover:border-border"
                  }`}>
                    {/* Number badge + title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif text-lg font-bold ${color}`}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground text-lg">{stage.title}</h3>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Старт</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {stage.duration}
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1.5">Навыки:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground mb-1.5">Ресурсы:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.resources.map((r) => (
                          <a key={r} href={resourceUrl(r)} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-xs gap-1 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                              {r} <ExternalLink className="w-2.5 h-2.5" />
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Start button for stage 1 */}
                    {isCurrent && (
                      <Button size="sm" variant="default" onClick={() => setShowResources(stage.id)}>
                        Начать обучение <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Arrow connector */}
                  {idx < stages.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-px h-4 bg-border" />
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-border"
                          style={{ borderTopWidth: 6, borderTopColor: 'hsl(var(--border))' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!hideActions && !isLoading && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={handlePdf}>
              <Download className="w-4 h-4" /> Скачать план (PDF)
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="w-4 h-4" /> {shareMsg || "Поделиться"}
            </Button>
          </div>
        )}

        {/* Register CTA — Google button inline, no extra dialog */}
        {!hideActions && !isLoading && !isAuthenticated() && (
          <div className="border border-primary/20 rounded-2xl p-6 bg-primary/5 text-center space-y-4">
            <p className="font-medium text-foreground">Сохраните план и отслеживайте прогресс</p>
            <p className="text-sm text-muted-foreground">Войдите через Google — займёт 10 секунд</p>
            {savingRoadmap ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Сохраняем план...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setAuthError("Не удалось войти через Google. Попробуйте ещё раз.")}
                  locale="ru"
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                />
                {authError && (
                  <p className="text-sm text-destructive mt-1">{authError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resources modal */}
      <Dialog open={showResources !== null} onOpenChange={() => setShowResources(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ресурсы для старта</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {stages.find((s) => s.id === showResources)?.resources.map((r) => (
              <a key={r} href={resourceUrl(r)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                <span className="font-medium text-sm">{r}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};
