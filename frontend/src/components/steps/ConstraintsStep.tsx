import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormCard } from "@/components/FormCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Heart, Wallet, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ConstraintsStepProps {
  data: {
    hoursPerWeek: number;
    budget: string;
    healthConsiderations: string;
    preferOnline: boolean;
    preferRussian: boolean;
    needMentorship: boolean;
    additionalInfo: string;
  };
  onChange: (data: Partial<ConstraintsStepProps["data"]>) => void;
}

export const ConstraintsStep = ({ data, onChange }: ConstraintsStepProps) => {
  return (
    <FormCard title="Ограничения и предпочтения">
      <div className="space-y-8">
        {/* Time availability */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Сколько часов в неделю вы готовы уделять обучению?
          </Label>
          <div className="px-2">
            <Slider
              value={[data.hoursPerWeek]}
              onValueChange={([value]) => onChange({ hoursPerWeek: value })}
              max={40}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>5 часов</span>
              <span className="font-semibold text-foreground">
                {data.hoursPerWeek} часов/неделю
              </span>
              <span>40 часов</span>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gold" />
            Бюджет на обучение
          </Label>
          <Select
            value={data.budget}
            onValueChange={(value) => onChange({ budget: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Выберите бюджет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Только бесплатные ресурсы</SelectItem>
              <SelectItem value="low">До 10 000 ₽/мес</SelectItem>
              <SelectItem value="medium">10 000 - 30 000 ₽/мес</SelectItem>
              <SelectItem value="high">30 000 - 100 000 ₽/мес</SelectItem>
              <SelectItem value="unlimited">Без ограничений</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Health considerations */}
        <div className="space-y-2">
          <Label htmlFor="health" className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            Особенности здоровья (опционально)
          </Label>
          <Textarea
            id="health"
            placeholder="Укажите, если есть ограничения, которые нужно учесть (например: проблемы со зрением, необходимость частых перерывов и т.д.)"
            value={data.healthConsiderations}
            onChange={(e) => onChange({ healthConsiderations: e.target.value })}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            Предпочтения в обучении
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/30">
              <Checkbox
                id="online"
                checked={data.preferOnline}
                onCheckedChange={(checked) =>
                  onChange({ preferOnline: checked as boolean })
                }
              />
              <Label htmlFor="online" className="cursor-pointer flex-1">
                Предпочитаю онлайн-обучение
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/30">
              <Checkbox
                id="russian"
                checked={data.preferRussian}
                onCheckedChange={(checked) =>
                  onChange({ preferRussian: checked as boolean })
                }
              />
              <Label htmlFor="russian" className="cursor-pointer flex-1">
                Предпочитаю материалы на русском языке
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/30">
              <Checkbox
                id="mentorship"
                checked={data.needMentorship}
                onCheckedChange={(checked) =>
                  onChange({ needMentorship: checked as boolean })
                }
              />
              <Label htmlFor="mentorship" className="cursor-pointer flex-1">
                Хочу иметь ментора / наставника
              </Label>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="additional">Дополнительная информация</Label>
            {data.additionalInfo.length > 400 && (
              <span className={`text-xs ${data.additionalInfo.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {data.additionalInfo.length} / 500
              </span>
            )}
          </div>
          <Textarea
            id="additional"
            placeholder="Любые пожелания к плану: предпочтительное время занятий, особые цели, что уже пробовали..."
            value={data.additionalInfo}
            onChange={(e) => { if (e.target.value.length <= 500) onChange({ additionalInfo: e.target.value }); }}
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>
    </FormCard>
  );
};
