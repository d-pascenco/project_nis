import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Autocomplete } from "@/components/Autocomplete";
import { PROFESSIONS } from "@/lib/suggestions";
import { Target, Clock, TrendingUp, AlignLeft } from "lucide-react";
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
  { id: "salary",     label: "Высокая зарплата" },
  { id: "balance",    label: "Work-life баланс" },
  { id: "growth",     label: "Карьерный рост" },
  { id: "creativity", label: "Творческая работа" },
  { id: "impact",     label: "Социальное влияние" },
  { id: "remote",     label: "Удалённая работа" },
];

export const GoalsStep = ({ data, onChange }: GoalsStepProps) => {
  const handlePriorityChange = (priorityId: string, checked: boolean) => {
    const newPriorities = checked
      ? [...data.priorities, priorityId]
      : data.priorities.filter((p) => p !== priorityId);
    onChange({ priorities: newPriorities });
  };

  const motivLen = data.motivation.trim().length;

  return (
    <FormCard title="Цели и интересы">
      <div className="space-y-6">

        {/* Профессия */}
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
            placeholder="Начните вводить: Data Scientist, Frontend Developer..."
          />
          <p className="text-xs text-muted-foreground">
            Можно на русском или английском — список содержит 60+ профессий в IT
          </p>
        </div>

        {/* Индустрия + Срок */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Целевая индустрия <span className="text-destructive">*</span>
            </Label>
            <Select value={data.targetIndustry} onValueChange={(v) => onChange({ targetIndustry: v })}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Выберите индустрию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="healthcare">Healthcare / MedTech</SelectItem>
                <SelectItem value="education">EdTech</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="ai">AI / ML</SelectItem>
                <SelectItem value="cybersecurity">Кибербезопасность</SelectItem>
                <SelectItem value="startup">Стартапы</SelectItem>
                <SelectItem value="enterprise">Корпорации</SelectItem>
                <SelectItem value="consulting">Консалтинг</SelectItem>
                <SelectItem value="any">Любая / не важно</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              За какой срок хотите достичь цели? <span className="text-destructive">*</span>
            </Label>
            <Select value={data.timeline} onValueChange={(v) => onChange({ timeline: v })}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Выберите срок" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 месяца — интенсивный спринт</SelectItem>
                <SelectItem value="6months">6 месяцев — оптимальный темп</SelectItem>
                <SelectItem value="1year">1 год — уверенный путь</SelectItem>
                <SelectItem value="2years">2 года — глубокое погружение</SelectItem>
                <SelectItem value="flexible">Гибкий срок — без давления</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              AI скорректирует темп обучения под выбранный срок
            </p>
          </div>
        </div>

        {/* Приоритеты */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Приоритеты в карьере <span className="text-destructive">*</span></Label>
            {data.priorities.length === 0 && (
              <span className="text-xs text-destructive">Выберите хотя бы один</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {priorityOptions.map((priority) => {
              const checked = data.priorities.includes(priority.id);
              return (
                <div
                  key={priority.id}
                  onClick={() => handlePriorityChange(priority.id, !checked)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? "border-primary/50 bg-primary/8 text-primary"
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <Checkbox
                    id={priority.id}
                    checked={checked}
                    onCheckedChange={(c) => handlePriorityChange(priority.id, c as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label htmlFor={priority.id} className="text-sm cursor-pointer">
                    {priority.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Мотивация */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="motivation" className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-accent" />
              Почему именно эта цель? <span className="text-destructive">*</span>
            </Label>
            <span className={`text-xs font-medium tabular-nums ${
              motivLen >= 50 ? "text-muted-foreground" : motivLen > 0 ? "text-amber-500" : "text-muted-foreground"
            }`}>
              {motivLen} / 50
            </span>
          </div>
          <Textarea
            id="motivation"
            placeholder="Что вас вдохновляет в этой профессии? Какую проблему хотите решать? Почему сейчас? Чем дольше расскажете — тем точнее будет план..."
            value={data.motivation}
            onChange={(e) => onChange({ motivation: e.target.value })}
            className="min-h-[110px] resize-none"
          />
          {motivLen > 0 && motivLen < 50 && (
            <p className="text-xs text-amber-500">
              Напишите ещё {50 - motivLen} символов для более точного плана
            </p>
          )}
          {motivLen === 0 && (
            <p className="text-xs text-muted-foreground">
              Минимум 50 символов — это помогает AI лучше понять вашу ситуацию
            </p>
          )}
        </div>

      </div>
    </FormCard>
  );
};
