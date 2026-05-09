import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Autocomplete } from "@/components/Autocomplete";
import { PROFESSIONS } from "@/lib/suggestions";
import { Target, Clock, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface GoalsStepProps {
  data: {
    targetProfession: string;
    targetIndustry: string;
    timeline: string;
    motivation: string;
    priorities: string[];
  };
  onChange: (data: Partial<GoalsStepProps["data"]>) => void;
}

const priorityOptions = [
  { id: "salary", label: "Высокая зарплата" },
  { id: "balance", label: "Work-life баланс" },
  { id: "growth", label: "Карьерный рост" },
  { id: "creativity", label: "Творческая работа" },
  { id: "impact", label: "Социальное влияние" },
  { id: "remote", label: "Удалённая работа" },
];

export const GoalsStep = ({ data, onChange }: GoalsStepProps) => {
  const handlePriorityChange = (priorityId: string, checked: boolean) => {
    const newPriorities = checked
      ? [...data.priorities, priorityId]
      : data.priorities.filter((p) => p !== priorityId);
    onChange({ priorities: newPriorities });
  };

  return (
    <FormCard title="Цели и интересы">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="targetProfession" className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Желаемая профессия / роль <span className="text-destructive">*</span>
          </Label>
          <Autocomplete
            id="targetProfession"
            value={data.targetProfession}
            onChange={(value) => onChange({ targetProfession: value })}
            suggestions={PROFESSIONS}
            placeholder="Data Scientist, Frontend Developer..."
          />
          <p className="text-xs text-muted-foreground">Введите на русском или английском — подберём нужное</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Целевая индустрия <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.targetIndustry}
              onValueChange={(value) => onChange({ targetIndustry: value })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Выберите индустрию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">EdTech</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="ai">AI / ML</SelectItem>
                <SelectItem value="startup">Стартапы</SelectItem>
                <SelectItem value="enterprise">Корпорации</SelectItem>
                <SelectItem value="any">Любая</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Желаемый срок достижения цели <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.timeline}
              onValueChange={(value) => onChange({ timeline: value })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Выберите срок" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 месяца</SelectItem>
                <SelectItem value="6months">6 месяцев</SelectItem>
                <SelectItem value="1year">1 год</SelectItem>
                <SelectItem value="2years">2 года</SelectItem>
                <SelectItem value="flexible">Гибкий срок</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Приоритеты в карьере <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {priorityOptions.map((priority) => (
              <div
                key={priority.id}
                className="flex items-center space-x-2 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  id={priority.id}
                  checked={data.priorities.includes(priority.id)}
                  onCheckedChange={(checked) =>
                    handlePriorityChange(priority.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={priority.id}
                  className="text-sm cursor-pointer"
                >
                  {priority.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="motivation">
              Почему вы выбрали эту цель? <span className="text-destructive">*</span>
            </Label>
            <span className={`text-xs ${data.motivation.trim().length >= 50 ? "text-muted-foreground" : "text-destructive"}`}>
              {data.motivation.trim().length} / 50
            </span>
          </div>
          <Textarea
            id="motivation"
            placeholder="Расскажите, что вас мотивирует и почему вы хотите достичь именно этой цели..."
            value={data.motivation}
            onChange={(e) => onChange({ motivation: e.target.value })}
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>
    </FormCard>
  );
};
