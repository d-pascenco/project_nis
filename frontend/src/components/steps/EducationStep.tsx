import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
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

export const EducationStep = ({ data, onChange }: EducationStepProps) => {
  return (
    <FormCard title="Образование и опыт">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Уровень образования <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.education}
            onValueChange={(value) => onChange({ education: value })}
          >
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
          <div className="space-y-2">
            <Label htmlFor="university">Учебное заведение <span className="text-destructive">*</span></Label>
            <Input
              id="university"
              placeholder="МГУ им. Ломоносова"
              value={data.university}
              onChange={(e) => onChange({ university: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Специальность <span className="text-destructive">*</span></Label>
            <Input
              id="specialization"
              placeholder="Информационные технологии"
              value={data.specialization}
              onChange={(e) => onChange({ specialization: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Опыт работы (лет) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="experience"
              type="number"
              placeholder="3"
              value={data.yearsExperience}
              onChange={(e) => onChange({ yearsExperience: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentRole">Текущая должность</Label>
            <Input
              id="currentRole"
              placeholder="Junior Developer"
              value={data.currentRole}
              onChange={(e) => onChange({ currentRole: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

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
            placeholder="Опишите ваш профессиональный опыт, достижения и ключевые навыки..."
            value={data.cvSummary}
            onChange={(e) => onChange({ cvSummary: e.target.value })}
            className="min-h-[120px] resize-none"
          />
        </div>
      </div>
    </FormCard>
  );
};
