import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
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

export const BasicInfoStep = ({ data, onChange }: BasicInfoStepProps) => {
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
              Возраст
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={data.age}
              onChange={(e) => onChange({ age: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Город
            </Label>
            <Input
              id="location"
              placeholder="Москва"
              value={data.location}
              onChange={(e) => onChange({ location: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Текущий статус <span className="text-destructive">*</span></Label>
          <Select
            value={data.currentStatus}
            onValueChange={(value) => onChange({ currentStatus: value })}
          >
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
