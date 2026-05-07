import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/steps/BasicInfoStep";
import { EducationStep } from "@/components/steps/EducationStep";
import { GoalsStep } from "@/components/steps/GoalsStep";
import { SkillsStep } from "@/components/steps/SkillsStep";
import { ConstraintsStep } from "@/components/steps/ConstraintsStep";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { authHeaders } from "@/lib/auth";
import type { OnboardingFormData, RoadmapData } from "@/types";
import { Loader2, RefreshCw, Save } from "lucide-react";

interface ProfileEditFormProps {
  open: boolean;
  onClose: () => void;
  initialData: Partial<OnboardingFormData>;
  onRoadmapUpdated: (roadmap: RoadmapData) => void;
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

const SECTIONS = ["О вас", "Образование", "Цели", "Навыки", "Ограничения"];

export const ProfileEditForm = ({ open, onClose, initialData, onRoadmapUpdated }: ProfileEditFormProps) => {
  const [formData, setFormData] = useState<OnboardingFormData>({ ...DEFAULT, ...initialData });
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/recalculate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ form_data: formData }),
      });
      // save only — don't use the returned roadmap yet
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Ошибка ${res.status}`);
      }
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    try {
      const res = await fetch("/api/me/recalculate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ form_data: formData }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Ошибка ${res.status}`);
      }
      const roadmap = await res.json();
      onRoadmapUpdated(roadmap);
      onClose();
    } catch (e: unknown) {
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
      default: return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">Редактировать профиль</SheetTitle>
        </SheetHeader>

        {/* Section tabs */}
        <div className="flex gap-1 flex-wrap mt-4 mb-2">
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

        {/* Form section */}
        <div className="flex-1 overflow-y-auto">
          {renderSection()}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-3 shrink-0">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-primary">Данные сохранены</p>}

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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Пересчёт...</>
                : <><RefreshCw className="w-4 h-4" /> Обновить план</>
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            «Сохранить» — только данные. «Обновить план» — данные + новый роудмап через AI.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
