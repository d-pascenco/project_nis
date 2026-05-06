import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const navigate = useNavigate();
  const sizes = {
    sm: { icon: "w-5 h-5", text: "text-lg" },
    md: { icon: "w-6 h-6", text: "text-xl" },
    lg: { icon: "w-8 h-8", text: "text-2xl" },
  };

  return (
    <div
      className={`flex items-center gap-2 cursor-pointer ${className}`}
      onClick={() => navigate("/")}
    >
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Compass className={`${sizes[size].icon} text-primary`} />
      </div>
      <span className={`font-serif ${sizes[size].text} text-foreground`}>
        NextPath
      </span>
    </div>
  );
};