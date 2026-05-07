import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Autocomplete } from "@/components/Autocomplete";
import { CITIES } from "@/lib/suggestions";
import { User, MapPin, Calendar } from "lucide-react";

interface BasicInfoStepProps {
  data: {
    fullName: string;
    age: string;
    location: string;
    currentStatus: string;
  };
  onChange: (data: Partial<BasicInfoStepProps["data"]>) => void;
}

const validateCity = (value: string): string | null => {
  if (!value.trim()) return null;
  if (!/^[а-яА-ЯёЁ\s\-]+$/.test(value))
    return "Только кириллица (например: Москва)";
  return null;
};

export const BasicInfoStep = ({ data, onChange }: BasicInfoStepProps) => {
  const handleAge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    onChange({ age: val });
  };

  return (
    <FormCard title="Основная информация">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Полное имя <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Иван Иванов"
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Возраст <span className="text-destructive">*</span>
            </Label>
            <Input
              id="age"
              inputMode="numeric"
              placeholder="25"
              value={data.age}
              onChange={handleAge}
              className="h-12"
              maxLength={2}
            />
            {data.age && (Number(data.age) < 14 || Number(data.age) > 80) && (
              <p className="text-xs text-destructive">Укажите возраст от 14 до 80 лет</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Город <span className="text-destructive">*</span>
            </Label>
            <Autocomplete
              id="location"
              value={data.location}
              onChange={(val) => onChange({ location: val })}
              suggestions={CITIES}
              placeholder="Москва"
              onValidate={validateCity}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">
            Текущий статус <span className="text-destructive">*</span>
          </Label>
          <Select value={data.currentStatus} onValueChange={(v) => onChange({ currentStatus: v })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Выберите ваш статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Студент</SelectItem>
              <SelectItem value="graduate">Выпускник</SelectItem>
              <SelectItem value="employed">Работаю</SelectItem>
              <SelectItem value="unemployed">В поиске работы</SelectItem>
              <SelectItem value="career-change">Меняю карьеру</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormCard>
  );
};
