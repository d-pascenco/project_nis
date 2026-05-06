import { useState } from "react";

export interface RoadmapStage {
  id: number;
  title: string;
  duration: string;
  skills: string[];
  resources: string[];
}

export interface RoadmapData {
  stages: RoadmapStage[];
  total_duration: string;
  summary: string;
}
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { StepIndicator } from "@/components/StepIndicator";
import { BasicInfoStep } from "@/components/steps/BasicInfoStep";
import { EducationStep } from "@/components/steps/EducationStep";
import { GoalsStep } from "@/components/steps/GoalsStep";
import { SkillsStep } from "@/components/steps/SkillsStep";
import { ConstraintsStep } from "@/components/steps/ConstraintsStep";
import { RoadmapPreview } from "@/components/RoadmapPreview";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  "О вас",
  "Образование",
  "Цели",
  "Навыки",
  "Ограничения",
];

interface FormData {
  // Basic Info
  fullName: string;
  age: string;
  location: string;
  currentStatus: string;
  // Education
  education: string;
  university: string;
  specialization: string;
  yearsExperience: string;
  currentRole: string;
  cvSummary: string;
  // Goals
  targetProfession: string;
  targetIndustry: string;
  timeline: string;
  motivation: string;
  priorities: string[];
  // Skills
  technicalSkills: string[];
  softSkills: string[];
  languages: { name: string; level: number }[];
  learningStyle: string;
  // Constraints
  hoursPerWeek: number;
  budget: string;
  healthConsiderations: string;
  preferOnline: boolean;
  preferRussian: boolean;
  needMentorship: boolean;
  additionalInfo: string;
}

const initialFormData: FormData = {
  fullName: "",
  age: "",
  location: "",
  currentStatus: "",
  education: "",
  university: "",
  specialization: "",
  yearsExperience: "",
  currentRole: "",
  cvSummary: "",
  targetProfession: "",
  targetIndustry: "",
  timeline: "",
  motivation: "",
  priorities: [],
  technicalSkills: [],
  softSkills: [],
  languages: [],
  learningStyle: "",
  hoursPerWeek: 15,
  budget: "",
  healthConsiderations: "",
  preferOnline: true,
  preferRussian: true,
  needMentorship: false,
  additionalInfo: "",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setValidationError(false);
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: return !!formData.fullName.trim() && !!formData.currentStatus;
      case 1: return !!formData.education;
      case 2: return !!formData.targetProfession && !!formData.timeline;
      default: return true;
    }
  };

  const submitForm = async () => {
    setIsSubmitting(false);
    setRoadmapLoading(true);
    setShowRoadmap(true);

    // сохраняем форму в БД (не блокируем UI)
    fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).catch(() => {});

    // генерируем роудмап через Groq
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmapData(data);
      }
    } catch {
      // показываем статичный fallback
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (!isCurrentStepValid()) {
        setValidationError(true);
        return;
      }
      setValidationError(false);
      setCurrentStep((prev) => prev + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    setValidationError(false);
    if (showRoadmap) {
      setShowRoadmap(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={{
              fullName: formData.fullName,
              age: formData.age,
              location: formData.location,
              currentStatus: formData.currentStatus,
            }}
            onChange={updateFormData}
          />
        );
      case 1:
        return (
          <EducationStep
            data={{
              education: formData.education,
              university: formData.university,
              specialization: formData.specialization,
              yearsExperience: formData.yearsExperience,
              currentRole: formData.currentRole,
              cvSummary: formData.cvSummary,
            }}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <GoalsStep
            data={{
              targetProfession: formData.targetProfession,
              targetIndustry: formData.targetIndustry,
              timeline: formData.timeline,
              motivation: formData.motivation,
              priorities: formData.priorities,
            }}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <SkillsStep
            data={{
              technicalSkills: formData.technicalSkills,
              softSkills: formData.softSkills,
              languages: formData.languages,
              learningStyle: formData.learningStyle,
            }}
            onChange={updateFormData}
          />
        );
      case 4:
        return (
          <ConstraintsStep
            data={{
              hoursPerWeek: formData.hoursPerWeek,
              budget: formData.budget,
              healthConsiderations: formData.healthConsiderations,
              preferOnline: formData.preferOnline,
              preferRussian: formData.preferRussian,
              needMentorship: formData.needMentorship,
              additionalInfo: formData.additionalInfo,
            }}
            onChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            {!showRoadmap && (
              <div className="text-sm text-muted-foreground">
                Шаг {currentStep + 1} из {steps.length}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {!showRoadmap ? (
          <>
            {/* Step indicator */}
            <div className="mb-10">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>

            {/* Form content */}
            <div className="mb-10">{renderStep()}</div>

            {/* Validation error */}
            {validationError && (
              <p className="text-sm text-destructive text-center mb-4">
                Заполните обязательные поля, отмеченные *
              </p>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
              <Button variant="hero" onClick={handleNext} disabled={isSubmitting}>
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isSubmitting ? "Сохраняем..." : "Создать карту"}
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <RoadmapPreview
              userData={{
                fullName: formData.fullName || "Пользователь",
                targetProfession: formData.targetProfession,
                timeline: formData.timeline,
              }}
              roadmapData={roadmapData}
              isLoading={roadmapLoading}
            />
            <div className="mt-10 text-center">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
                Вернуться к редактированию
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Onboarding;