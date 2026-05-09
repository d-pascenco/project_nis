import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/steps/BasicInfoStep";
import { EducationStep } from "@/components/steps/EducationStep";
import { GoalsStep } from "@/components/steps/GoalsStep";
import { SkillsStep } from "@/components/steps/SkillsStep";
import { ConstraintsStep } from "@/components/steps/ConstraintsStep";
import { ScheduleStep } from "@/components/steps/ScheduleStep";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { authHeaders } from "@/lib/auth";
import type { OnboardingFormData, RoadmapData } from "@/types";
import { Loader2, RefreshCw, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileEditFormProps {
  open: boolean;
  onClose: () => void;
  initialData: Partial<OnboardingFormData>;
  onRoadmapUpdated: (roadmap: RoadmapData) => void;
  onFormSaved?: () => void;
}

const DEFAULT: OnboardingFormData = {
  fullName: "", age: "", location: "", currentStatus: "",
  education: "", university: "", specialization: "",
  yearsExperience: "", currentRole: "", cvSummary: "",
  targetProfession: "", targetIndustry: "", timeline: "",
  motivation: "", priorities: [],
  technicalSkills: [], softSkills: [],
  languages: [], learningStyle: "",
  hoursPerWeek: 15, budget: "", healthConsiderations: "",
  preferOnline: true, preferRussian: true,
  needMentorship: false, additionalInfo: "",
};

const SECTIONS = ["О вас", "Образование", "Цели", "Навыки", "Ограничения", "Расписание"];

export const ProfileEditForm = ({ open, onClose, initialData, onRoadmapUpdated, onFormSaved }: ProfileEditFormProps) => {
  const [formData, setFormData] = useState<OnboardingFormData>({ ...DEFAULT, ...initialData });
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Обновляем форму когда initialData меняется (новые данные загрузились)
  useEffect(() => {
    setFormData({ ...DEFAULT, ...initialData });
  }, [initialData]);

  const update = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStatus("idle");
  };

  // Сохранить данные формы без пересчёта роудмапа
  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    setError(null);
    try {
      const res = await fetch("/api/me/save-form", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ form_data: formData }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || `Ошибка ${res.status}`);
      setStatus("saved");
      onFormSaved?.();
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Сохранить данные + пересчитать роудмап через AI
  const handleRecalculate = async () => {
    setRecalculating(true);
    setStatus("idle");
    setError(null);
    try {
      const res = await fetch("/api/me/recalculate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ form_data: formData }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || `Ошибка ${res.status}`);
      onRoadmapUpdated(body as RoadmapData);
      onClose();
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Ошибка генерации плана");
    } finally {
      setRecalculating(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 0: return (
        <BasicInfoStep
          data={{ fullName: formData.fullName, age: formData.age, location: formData.location, currentStatus: formData.currentStatus }}
          onChange={update}
        />
      );
      case 1: return (
        <EducationStep
          data={{ education: formData.education, university: formData.university, specialization: formData.specialization, yearsExperience: formData.yearsExperience, currentRole: formData.currentRole, cvSummary: formData.cvSummary }}
          onChange={update}
        />
      );
      case 2: return (
        <GoalsStep
          data={{ targetProfession: formData.targetProfession, targetIndustry: formData.targetIndustry, timeline: formData.timeline, motivation: formData.motivation, priorities: formData.priorities }}
          onChange={update}
        />
      );
      case 3: return (
        <SkillsStep
          data={{ technicalSkills: formData.technicalSkills, softSkills: formData.softSkills, languages: formData.languages, learningStyle: formData.learningStyle }}
          onChange={update}
        />
      );
      case 4: return (
        <ConstraintsStep
          data={{ hoursPerWeek: formData.hoursPerWeek, budget: formData.budget, healthConsiderations: formData.healthConsiderations, preferOnline: formData.preferOnline, preferRussian: formData.preferRussian, needMentorship: formData.needMentorship, additionalInfo: formData.additionalInfo }}
          onChange={update}
        />
      );
      case 5: return (
        <ScheduleStep
          data={{ scheduleItems: formData.scheduleItems || [] }}
          onChange={update}
        />
      );
      default: return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="font-serif text-xl">Редактировать профиль</SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Изменения сохраняются в вашем аккаунте
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 flex-wrap px-4 py-3 border-b border-border shrink-0">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setActiveSection(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === i
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Form content — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {renderSection()}
        </div>

        {/* Actions — sticky bottom */}
        <div className="px-4 py-4 border-t border-border bg-background shrink-0 space-y-3">

          {/* Status feedback */}
          {status === "saved" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" />
              Данные сохранены
            </div>
          )}
          {status === "error" && error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSave}
              disabled={saving || recalculating}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</>
                : <><Save className="w-4 h-4" /> Сохранить</>
              }
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleRecalculate}
              disabled={saving || recalculating}
            >
              {recalculating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Пересчёт AI...</>
                : <><RefreshCw className="w-4 h-4" /> Обновить план</>
              }
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            «Сохранить» — только данные &nbsp;•&nbsp; «Обновить план» — новый AI-роудмап
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
