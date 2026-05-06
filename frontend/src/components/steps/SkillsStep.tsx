import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/FormCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Code, Languages, Wrench } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface SkillsStepProps {
  data: {
    technicalSkills: string[];
    softSkills: string[];
    languages: { name: string; level: number }[];
    learningStyle: string;
  };
  onChange: (data: Partial<SkillsStepProps["data"]>) => void;
}

const suggestedTechnicalSkills = [
  "JavaScript", "Python", "React", "Node.js", "SQL", "Git",
  "TypeScript", "HTML/CSS", "Docker", "AWS", "Java", "C++",
];

const suggestedSoftSkills = [
  "Коммуникация", "Командная работа", "Тайм-менеджмент",
  "Критическое мышление", "Адаптивность", "Лидерство",
];

export const SkillsStep = ({ data, onChange }: SkillsStepProps) => {
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const addTechSkill = (skill: string) => {
    if (skill && !data.technicalSkills.includes(skill)) {
      onChange({ technicalSkills: [...data.technicalSkills, skill] });
    }
    setNewTechSkill("");
  };

  const removeTechSkill = (skill: string) => {
    onChange({ technicalSkills: data.technicalSkills.filter((s) => s !== skill) });
  };

  const addSoftSkill = (skill: string) => {
    if (skill && !data.softSkills.includes(skill)) {
      onChange({ softSkills: [...data.softSkills, skill] });
    }
    setNewSoftSkill("");
  };

  const removeSoftSkill = (skill: string) => {
    onChange({ softSkills: data.softSkills.filter((s) => s !== skill) });
  };

  const addLanguage = () => {
    if (newLanguage && !data.languages.find((l) => l.name === newLanguage)) {
      onChange({ languages: [...data.languages, { name: newLanguage, level: 50 }] });
    }
    setNewLanguage("");
  };

  const removeLanguage = (name: string) => {
    onChange({ languages: data.languages.filter((l) => l.name !== name) });
  };

  const updateLanguageLevel = (name: string, level: number) => {
    onChange({
      languages: data.languages.map((l) =>
        l.name === name ? { ...l, level } : l
      ),
    });
  };

  const getLevelLabel = (level: number) => {
    if (level < 25) return "Начальный";
    if (level < 50) return "Базовый";
    if (level < 75) return "Средний";
    if (level < 90) return "Продвинутый";
    return "Свободный";
  };

  return (
    <FormCard title="Навыки и компетенции">
      <div className="space-y-8">
        {/* Technical Skills */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            Технические навыки
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.technicalSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
              >
                {skill}
                <X
                  className="w-3 h-3 ml-2"
                  onClick={() => removeTechSkill(skill)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Добавить навык..."
              value={newTechSkill}
              onChange={(e) => setNewTechSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTechSkill(newTechSkill)}
              className="h-10"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => addTechSkill(newTechSkill)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedTechnicalSkills
              .filter((s) => !data.technicalSkills.includes(s))
              .slice(0, 6)
              .map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => addTechSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" />
            Гибкие навыки (Soft Skills)
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.softSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="px-3 py-1 bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
              >
                {skill}
                <X
                  className="w-3 h-3 ml-2"
                  onClick={() => removeSoftSkill(skill)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Добавить навык..."
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSoftSkill(newSoftSkill)}
              className="h-10"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => addSoftSkill(newSoftSkill)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedSoftSkills
              .filter((s) => !data.softSkills.includes(s))
              .map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => addSoftSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gold" />
            Языки
          </Label>
          <div className="space-y-4">
            {data.languages.map((lang) => (
              <div
                key={lang.name}
                className="p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{lang.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {getLevelLabel(lang.level)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeLanguage(lang.name)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[lang.level]}
                  onValueChange={([value]) => updateLanguageLevel(lang.name, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Добавить язык (например: English, Deutsch)..."
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLanguage()}
              className="h-10"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={addLanguage}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </FormCard>
  );
};
