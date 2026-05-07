import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Autocomplete } from "@/components/Autocomplete";
import { UNIVERSITIES, SPECIALIZATIONS } from "@/lib/suggestions";
import { GraduationCap, Briefcase, FileText } from "lucide-react";

interface EducationStepProps {
  data: {
    education: string;
    university: string;
    specialization: string;
    yearsExperience: string;
    currentRole: string;
    cvSummary: string;
  };
  onChange: (data: Partial<EducationStepProps["data"]>) => void;
}

const MAX_ROLE = 80;

export const EducationStep = ({ data, onChange }: EducationStepProps) => {
  const handleYears = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    onChange({ yearsExperience: val });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= MAX_ROLE) onChange({ currentRole: e.target.value });
  };

  const handleRoleBlur = () => {
    const trimmed = data.currentRole.trim();
    if (trimmed !== data.currentRole) onChange({ currentRole: trimmed });
  };

  const handleCvBlur = () => {
    const trimmed = data.cvSummary.trim();
    if (trimmed !== data.cvSummary) onChange({ cvSummary: trimmed });
  };

  const yearsNum = Number(data.yearsExperience);
  const yearsError = data.yearsExperience && (yearsNum < 0 || yearsNum > 50)
    ? "Введите значение от 0 до 50"
    : null;

  return (
    <FormCard title="Образование и опыт">
      <div className="space-y-6">

        {/* Уровень образования */}
        <div className="space-y-2">
          <Label htmlFor="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Уровень образования <span className="text-destructive">*</span>
          </Label>
          <Select value={data.education} onValueChange={(v) => onChange({ education: v })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Выберите уровень образования" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">Среднее образование</SelectItem>
              <SelectItem value="college">Среднее специальное</SelectItem>
              <SelectItem value="bachelor">Бакалавриат</SelectItem>
              <SelectItem value="master">Магистратура</SelectItem>
              <SelectItem value="phd">Аспирантура / PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Учебное заведение */}
          <div className="space-y-2">
            <Label htmlFor="university">
              Учебное заведение <span className="text-destructive">*</span>
            </Label>
            <Autocomplete
              id="university"
              value={data.university}
              onChange={(v) => onChange({ university: v })}
              suggestions={UNIVERSITIES}
              placeholder="МГУ им. Ломоносова"
            />
          </div>

          {/* Специальность */}
          <div className="space-y-2">
            <Label htmlFor="specialization">
              Специальность <span className="text-destructive">*</span>
            </Label>
            <Autocomplete
              id="specialization"
              value={data.specialization}
              onChange={(v) => onChange({ specialization: v })}
              suggestions={SPECIALIZATIONS}
              placeholder="Программная инженерия"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Опыт работы */}
          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Опыт работы (лет) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="experience"
              inputMode="numeric"
              placeholder="3"
              value={data.yearsExperience}
              onChange={handleYears}
              className={`h-12 ${yearsError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              maxLength={2}
            />
            {yearsError
              ? <p className="text-xs text-destructive">{yearsError}</p>
              : <p className="text-xs text-muted-foreground">Можно 0, если нет опыта</p>
            }
          </div>

          {/* Текущая должность */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="currentRole">Текущая должность</Label>
              <span className="text-xs text-muted-foreground">{data.currentRole.length}/{MAX_ROLE}</span>
            </div>
            <Input
              id="currentRole"
              placeholder="Junior Developer"
              value={data.currentRole}
              onChange={handleRoleChange}
              onBlur={handleRoleBlur}
              className="h-12"
            />
          </div>
        </div>

        {/* CV */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cv" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Краткое описание опыта (CV) <span className="text-destructive">*</span>
            </Label>
            <span className={`text-xs ${data.cvSummary.trim().length >= 300 ? "text-muted-foreground" : "text-destructive"}`}>
              {data.cvSummary.trim().length} / 300
            </span>
          </div>
          <Textarea
            id="cv"
            placeholder="Опишите профессиональный опыт, ключевые достижения и навыки..."
            value={data.cvSummary}
            onChange={(e) => onChange({ cvSummary: e.target.value })}
            onBlur={handleCvBlur}
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground">Минимум 300 символов — чем подробнее, тем точнее ваш план</p>
        </div>

      </div>
    </FormCard>
  );
};
