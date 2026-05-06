import { FormCard } from "@/components/FormCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { RoadmapData } from "@/pages/Onboarding";

interface RoadmapPreviewProps {
  userData: {
    fullName: string;
    targetProfession: string;
    timeline: string;
  };
  roadmapData?: RoadmapData | null;
  isLoading?: boolean;
}

const roadmapStages = [
  {
    id: 1,
    title: "Основы программирования",
    duration: "4 недели",
    status: "current",
    skills: ["HTML/CSS", "JavaScript Basics", "Git"],
    resources: ["freeCodeCamp", "Codecademy", "YouTube"],
  },
  {
    id: 2,
    title: "Продвинутый JavaScript",
    duration: "6 недель",
    status: "upcoming",
    skills: ["ES6+", "Async/Await", "DOM API"],
    resources: ["JavaScript.info", "Udemy", "MDN"],
  },
  {
    id: 3,
    title: "React.js Разработка",
    duration: "8 недель",
    status: "upcoming",
    skills: ["React Hooks", "State Management", "API Integration"],
    resources: ["React Docs", "Scrimba", "Epic React"],
  },
  {
    id: 4,
    title: "Проектная практика",
    duration: "4 недели",
    status: "upcoming",
    skills: ["Portfolio Project", "Code Review", "Best Practices"],
    resources: ["GitHub", "Frontend Mentor", "CodeWars"],
  },
  {
    id: 5,
    title: "Подготовка к трудоустройству",
    duration: "4 недели",
    status: "upcoming",
    skills: ["Resume", "Interview Prep", "Networking"],
    resources: ["LinkedIn", "Glassdoor", "Mock Interviews"],
  },
];

export const RoadmapPreview = ({ userData, roadmapData, isLoading }: RoadmapPreviewProps) => {
  const professionLabels: Record<string, string> = {
    frontend: "Frontend Developer",
    backend: "Backend Developer",
    fullstack: "Fullstack Developer",
    "data-scientist": "Data Scientist",
    "ml-engineer": "ML Engineer",
    devops: "DevOps Engineer",
    product: "Product Manager",
    designer: "UX/UI Designer",
    analyst: "Business Analyst",
    qa: "QA Engineer",
  };

  const timelineLabels: Record<string, string> = {
    "3months": "3 месяца",
    "6months": "6 месяцев",
    "1year": "1 год",
    "2years": "2 года",
    flexible: "Гибкий срок",
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Ваша дорожная карта готова
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          Путь к{" "}
          <span className="text-primary">
            {professionLabels[userData.targetProfession] || userData.targetProfession}
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {userData.fullName}, мы составили индивидуальный план на{" "}
          {timelineLabels[userData.timeline] || userData.timeline}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Срок", value: roadmapData?.total_duration || timelineLabels[userData.timeline] || "6 месяцев" },
          { icon: BookOpen, label: "Этапов", value: roadmapData ? `${roadmapData.stages.length} этапа` : "5 этапов" },
          { icon: Award, label: "Навыков", value: roadmapData ? `${roadmapData.stages.reduce((n, s) => n + s.skills.length, 0)}+` : "15+" },
          { icon: Briefcase, label: "Ресурсов", value: roadmapData ? `${roadmapData.stages.reduce((n, s) => n + s.resources.length, 0)}+` : "10+" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-card border border-border text-center"
          >
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
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {roadmapData.summary}
              </p>
            )}
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {(roadmapData?.stages ?? roadmapStages).map((stage, idx) => {
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
                          {isCurrent && (
                            <Badge className="bg-primary/10 text-primary border-0">Текущий этап</Badge>
                          )}
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
                                <Badge key={resource} variant="outline" className="text-xs text-muted-foreground">{resource}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {isCurrent && (
                          <Button variant="default" size="sm" className="mt-4">
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
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="hero" size="lg">
          <Download className="w-4 h-4" />
          Скачать план (PDF)
        </Button>
        <Button variant="outline" size="lg">
          <Share2 className="w-4 h-4" />
          Поделиться
        </Button>
      </div>
    </div>
  );
};