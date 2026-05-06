import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const FormCard = ({ children, className, title, description }: FormCardProps) => {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-8 shadow-card border border-border animate-scale-in",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-serif text-foreground mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};