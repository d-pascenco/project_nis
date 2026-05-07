import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  onValidate?: (value: string) => string | null;
}

export const Autocomplete = ({
  id, value, onChange, suggestions, placeholder, className, onValidate,
}: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setError(null);
    setActiveIdx(-1);
    if (val.length > 0) {
      const matches = suggestions
        .filter((s) => s.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 7);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
    if (onValidate) {
      const err = onValidate(value);
      setError(err);
    }
  };

  const handleFocus = () => {
    if (value.length > 0 && filtered.length > 0) setOpen(true);
  };

  const select = (item: string) => {
    onChange(item);
    setOpen(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const highlight = (text: string) => {
    if (!value) return text;
    const idx = text.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-primary">{text.slice(idx, idx + value.length)}</span>
        {text.slice(idx + value.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("h-12", error && "border-destructive focus-visible:ring-destructive", className)}
        autoComplete="off"
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {filtered.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                idx === activeIdx ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground",
              )}
              onMouseDown={() => select(item)}
            >
              {highlight(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
