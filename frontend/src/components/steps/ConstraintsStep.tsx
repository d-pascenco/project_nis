import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormCard } from "@/components/FormCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Heart, Wallet, Settings2 } from "lucide-react";
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

// Подсказка по часам
function hoursHint(h: number): string {
  if (h <= 7) return "Лёгкий темп — 1 час в день. Подойдёт при плотном графике.";
  if (h <= 14) return "Умеренный темп — 1.5–2 часа в день. Хороший баланс.";
  if (h <= 21) return "Активный темп — 3 часа в день. Быстрый прогресс.";
  return "Интенсивный режим — 4+ часов в день. Максимальная скорость.";
}

export const ConstraintsStep = ({ data, onChange }: ConstraintsStepProps) => {
  const addLen = data.additionalInfo.length;

  return (
    <FormCard title="Ограничения и предпочтения">
      <div className="space-y-8">

        {/* Часы в неделю */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Сколько часов в неделю готовы уделять?
            </Label>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {data.hoursPerWeek} ч/нед
            </span>
          </div>
          <div className="px-1">
            <Slider
              value={[data.hoursPerWeek]}
              onValueChange={([v]) => onChange({ hoursPerWeek: v })}
              max={40} min={5} step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>5 ч (минимум)</span>
              <span>40 ч (full-time)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-secondary/40 px-3 py-2 rounded-lg">
            💡 {hoursHint(data.hoursPerWeek)}
          </p>
        </div>

        {/* Бюджет */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Бюджет на обучение в месяц
          </Label>
          <Select value={data.budget} onValueChange={(v) => onChange({ budget: v })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Выберите бюджет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Только бесплатные ресурсы</SelectItem>
              <SelectItem value="low">До 2 000 ₽/мес — книги и базовые курсы</SelectItem>
              <SelectItem value="medium">2 000–10 000 ₽/мес — качественные курсы</SelectItem>
              <SelectItem value="high">10 000–30 000 ₽/мес — буткемпы, менторы</SelectItem>
              <SelectItem value="unlimited">Без ограничений — лучшее качество</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            AI подберёт ресурсы под ваш бюджет — бесплатных тоже много отличных
          </p>
        </div>

        {/* Здоровье */}
        <div className="space-y-2">
          <Label htmlFor="health" className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            Особенности здоровья <span className="text-xs text-muted-foreground ml-1">(опционально)</span>
          </Label>
          <Textarea
            id="health"
            placeholder="Если есть ограничения — напишите здесь. Например: «нарушения зрения», «хронические боли», «синдром СДВГ», «необходимость частых перерывов». Это поможет AI составить более щадящий план."
            value={data.healthConsiderations}
            onChange={(e) => onChange({ healthConsiderations: e.target.value })}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Данные используются только для персонализации расписания — не передаются третьим лицам
          </p>
        </div>

        {/* Предпочтения */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Предпочтения в обучении
          </Label>
          <div className="space-y-2">
            {[
              {
                id: "online",
                checked: data.preferOnline,
                onChange: (v: boolean) => onChange({ preferOnline: v }),
                label: "🖥 Предпочитаю онлайн-обучение",
                hint: "Курсы, вебинары, видео — без физического присутствия",
              },
              {
                id: "russian",
                checked: data.preferRussian,
                onChange: (v: boolean) => onChange({ preferRussian: v }),
                label: "🇷🇺 Предпочитаю материалы на русском языке",
                hint: "AI подберёт русскоязычные ресурсы в первую очередь",
              },
              {
                id: "mentorship",
                checked: data.needMentorship,
                onChange: (v: boolean) => onChange({ needMentorship: v }),
                label: "👨‍💼 Хочу ментора / наставника",
                hint: "Живой эксперт, который направляет и даёт обратную связь",
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => item.onChange(!item.checked)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  item.checked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-secondary/20 hover:bg-secondary/40"
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={item.onChange}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor={item.id} className="cursor-pointer text-sm font-medium">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Доп. информация */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="additional">Дополнительно</Label>
            {addLen > 400 && (
              <span className={`text-xs tabular-nums ${addLen > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {addLen} / 500
              </span>
            )}
          </div>
          <Textarea
            id="additional"
            placeholder="Любые пожелания к плану: «учусь по вечерам», «хочу фокус на практике», «уже проходил Python», «есть пробел в математике»..."
            value={data.additionalInfo}
            onChange={(e) => { if (e.target.value.length <= 500) onChange({ additionalInfo: e.target.value }); }}
            className="min-h-[90px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Здесь можно написать всё, что не вошло в предыдущие шаги
          </p>
        </div>

      </div>
    </FormCard>
  );
};
