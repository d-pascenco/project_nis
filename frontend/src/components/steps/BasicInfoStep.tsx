import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Autocomplete } from "@/components/Autocomplete";
import { COUNTRIES, getCitiesForCountry } from "@/lib/suggestions";
import { User, MapPin, Calendar, Globe, UserPlus } from "lucide-react";
import { goToCabinet } from "@/lib/urls";
import { isAuthenticated } from "@/lib/auth";

interface BasicInfoStepProps {
  data: {
    fullName: string;
    age: string;
    location: string;
    currentStatus: string;
    country: string;
  };
  onChange: (data: Partial<BasicInfoStepProps["data"]>) => void;
}

const validateCity = (value: string): string | null => {
  if (!value.trim()) return null;
  // Allow Cyrillic, Latin, spaces, hyphens (world cities)
  if (!/^[\p{L}\s\-'.]+$/u.test(value)) return "Некорректное название города";
  return null;
};

const validateName = (value: string): string | null => {
  if (!value.trim()) return null;
  if (value.trim().length < 2) return "Минимум 2 символа";
  return null;
};

export const BasicInfoStep = ({ data, onChange }: BasicInfoStepProps) => {
  const [nameError, setNameError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[^а-яА-ЯёЁa-zA-Z\s\-.'"]/g, "");
    setNameError(null);
    onChange({ fullName: filtered });
  };

  const handleNameBlur = () => {
    const trimmed = data.fullName.trim();
    if (trimmed !== data.fullName) onChange({ fullName: trimmed });
    setNameError(validateName(trimmed));
  };

  const handleAge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setAgeError(null);
    onChange({ age: val });
  };

  const handleAgeBlur = () => {
    if (!data.age) return;
    const n = Number(data.age);
    if (n < 14 || n > 80) setAgeError("Введите возраст от 14 до 80 лет");
  };

  return (
    <FormCard title="Основная информация">
      <div className="space-y-6">

        {/* Полное имя */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Полное имя <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Иван Иванов"
            value={data.fullName}
            onChange={handleName}
            onBlur={handleNameBlur}
            className={`h-12 ${nameError ? "border-destructive" : ""}`}
            maxLength={100}
          />
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}

          {/* Подсказка + кнопка регистрации */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border/60">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Не хотите указывать настоящее имя? Напишите псевдоним — это не влияет на качество плана.
            </p>
            {!isAuthenticated() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                onClick={() => goToCabinet()}
              >
                <UserPlus className="w-3 h-3" />
                Войти
              </Button>
            )}
          </div>
        </div>

        {/* Возраст + Страна */}
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
              onBlur={handleAgeBlur}
              className={`h-12 ${ageError ? "border-destructive" : ""}`}
              maxLength={2}
            />
            {ageError
              ? <p className="text-xs text-destructive">{ageError}</p>
              : <p className="text-xs text-muted-foreground">От 14 до 80 лет</p>
            }
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Страна <span className="text-destructive">*</span>
            </Label>
            <Autocomplete
              id="country"
              value={data.country || ""}
              onChange={(v) => onChange({ country: v })}
              suggestions={COUNTRIES}
              placeholder="Россия"
            />
          </div>
        </div>

        {/* Город */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Город <span className="text-destructive">*</span>
          </Label>
          <Autocomplete
            id="location"
            value={data.location}
            onChange={(val) => onChange({ location: val })}
            suggestions={getCitiesForCountry(data.country || "")}
            placeholder={data.country ? "Введите город..." : "Сначала выберите страну"}
            onValidate={validateCity}
          />
          {data.country && getCitiesForCountry(data.country).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Показаны города {data.country}
            </p>
          )}
        </div>

        {/* Текущий статус */}
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
