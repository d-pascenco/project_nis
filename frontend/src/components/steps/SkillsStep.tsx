import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/FormCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/Autocomplete";
import { LANGUAGES } from "@/lib/suggestions";
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

const SUGGESTED_TECH = [
  "JavaScript", "TypeScript", "Python", "React", "Vue.js", "Angular",
  "Node.js", "SQL", "Git", "HTML/CSS", "Docker", "AWS",
  "Java", "C++", "C#", "Go", "Rust", "Swift",
  "PostgreSQL", "MongoDB", "Redis", "Kubernetes", "GraphQL",
];

const SUGGESTED_SOFT = [
  "Коммуникация", "Командная работа", "Тайм-менеджмент",
  "Критическое мышление", "Адаптивность", "Лидерство",
  "Решение проблем", "Стрессоустойчивость", "Самоорганизация",
];

const LEVEL_LABELS: Record<number, string> = {
  0: "Начальный", 25: "Базовый", 50: "Средний", 75: "Продвинутый", 100: "Свободный",
};

const getLevelLabel = (level: number) => {
  const key = Math.round(level / 25) * 25;
  return LEVEL_LABELS[key] ?? "Средний";
};

export const SkillsStep = ({ data, onChange }: SkillsStepProps) => {
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  // ── Tech skills ─────────────────────────────────────────────────────────────

  const addTechSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !data.technicalSkills.includes(trimmed)) {
      onChange({ technicalSkills: [...data.technicalSkills, trimmed] });
    }
    setNewTechSkill("");
  };

  // Вставка через запятую: "Python, React, SQL" → 3 тега
  const handleTechPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const items = text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    if (items.length > 1) {
      e.preventDefault();
      const unique = items.filter((s) => !data.technicalSkills.includes(s));
      onChange({ technicalSkills: [...data.technicalSkills, ...unique] });
    }
  };

  const removeTechSkill = (skill: string) =>
    onChange({ technicalSkills: data.technicalSkills.filter((s) => s !== skill) });

  // ── Soft skills ─────────────────────────────────────────────────────────────

  const addSoftSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !data.softSkills.includes(trimmed)) {
      onChange({ softSkills: [...data.softSkills, trimmed] });
    }
    setNewSoftSkill("");
  };

  const handleSoftPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const items = text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    if (items.length > 1) {
      e.preventDefault();
      const unique = items.filter((s) => !data.softSkills.includes(s));
      onChange({ softSkills: [...data.softSkills, ...unique] });
    }
  };

  const removeSoftSkill = (skill: string) =>
    onChange({ softSkills: data.softSkills.filter((s) => s !== skill) });

  // ── Languages ────────────────────────────────────────────────────────────────

  const addLanguage = () => {
    const trimmed = newLanguage.trim();
    if (trimmed && !data.languages.find((l) => l.name === trimmed)) {
      onChange({ languages: [...data.languages, { name: trimmed, level: 50 }] });
    }
    setNewLanguage("");
  };

  const removeLanguage = (name: string) =>
    onChange({ languages: data.languages.filter((l) => l.name !== name) });

  const updateLanguageLevel = (name: string, level: number) =>
    onChange({ languages: data.languages.map((l) => l.name === name ? { ...l, level } : l) });

  return (
    <FormCard title="Навыки и компетенции">
      <div className="space-y-8">

        {/* Технические навыки */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              Технические навыки
            </Label>
            {data.technicalSkills.length > 0 && (
              <span className="text-xs text-muted-foreground">{data.technicalSkills.length} добавлено</span>
            )}
          </div>

          {data.technicalSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.technicalSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary">
                  {skill}
                  <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTechSkill(skill)} />
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Добавить навык или вставить список через запятую..."
              value={newTechSkill}
              onChange={(e) => setNewTechSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTechSkill(newTechSkill)}
              onPaste={handleTechPaste}
              className="h-10"
            />
            <Button type="button" size="icon" variant="secondary" onClick={() => addTechSkill(newTechSkill)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Быстро добавить:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TECH.filter((s) => !data.technicalSkills.includes(s)).slice(0, 8).map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors text-xs"
                  onClick={() => addTechSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Совет: вставьте список через запятую — все навыки добавятся сразу
          </p>
        </div>

        {/* Soft skills */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" />
            Гибкие навыки (Soft Skills)
          </Label>

          {data.softSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.softSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1 bg-accent/10 text-accent">
                  {skill}
                  <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeSoftSkill(skill)} />
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Добавить навык..."
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSoftSkill(newSoftSkill)}
              onPaste={handleSoftPaste}
              className="h-10"
            />
            <Button type="button" size="icon" variant="secondary" onClick={() => addSoftSkill(newSoftSkill)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SOFT.filter((s) => !data.softSkills.includes(s)).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-secondary transition-colors text-xs"
                onClick={() => addSoftSkill(skill)}
              >
                + {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Языки */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gold" />
            Языки
          </Label>

          <div className="space-y-3">
            {data.languages.map((lang) => (
              <div key={lang.name} className="p-4 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">{lang.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{getLevelLabel(lang.level)}</span>
                    <Button
                      type="button" size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => removeLanguage(lang.name)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[lang.level]}
                  onValueChange={([v]) => updateLanguageLevel(lang.name, v)}
                  max={100} step={25} className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Начальный</span>
                  <span>Свободный</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Autocomplete
              value={newLanguage}
              onChange={setNewLanguage}
              suggestions={LANGUAGES.filter((l) => !data.languages.find((d) => d.name === l))}
              placeholder="Например: Английский, Немецкий..."
            />
            <Button
              type="button" size="icon" variant="secondary"
              onClick={addLanguage}
              disabled={!newLanguage.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </FormCard>
  );
};
