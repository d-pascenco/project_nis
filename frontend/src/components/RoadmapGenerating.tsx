import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";

const STEPS = [
  { label: "Анализируем ваш профиль и цели",       icon: "🎯", ms: 900,  color: "#c0623e" },
  { label: "Изучаем требования рынка труда",        icon: "📊", ms: 1100, color: "#6384c7" },
  { label: "Подбираем курсы и ресурсы",             icon: "📚", ms: 1200, color: "#8263c7" },
  { label: "Проектируем учебный маршрут",           icon: "🗺️", ms: 900,  color: "#c7a328" },
  { label: "Составляем план по неделям",            icon: "📅", ms: 1000, color: "#3ea262" },
  { label: "Адаптируем под ваше расписание",        icon: "⏰", ms: 1000, color: "#c0623e" },
  { label: "Настраиваем образ жизни и мотивацию",   icon: "🌿", ms: 800,  color: "#6384c7" },
  { label: "Финальная персонализация плана",        icon: "✨", ms: 700,  color: "#8263c7" },
];

const TOTAL_MS = STEPS.reduce((s, st) => s + st.ms, 0);

interface Props {
  targetProfession?: string;
  isLoadingDone: boolean;
  onDoneShown: () => void;
}

export const RoadmapGenerating = ({ targetProfession, isLoadingDone, onDoneShown }: Props) => {
  const [stepProgress, setStepProgress] = useState<number[]>(STEPS.map(() => 0));
  const [activeStep, setActiveStep] = useState(0);
  const [overall, setOverall] = useState(0);
  const [fading, setFading] = useState(false);

  // Stable callback ref — избегаем stale closure
  const onDoneRef = useRef(onDoneShown);
  useEffect(() => { onDoneRef.current = onDoneShown; }, [onDoneShown]);

  const triggerExit = useCallback(() => {
    setOverall(100);
    setFading(true);
    const t = setTimeout(() => onDoneRef.current(), 600);
    return () => clearTimeout(t);
  }, []);

  // ── Анимация шагов ──────────────────────────────────────────────────────────
  const apiDoneRef = useRef(false);
  const animDoneRef = useRef(false);

  useEffect(() => {
    const FPS = 30;
    const INTERVAL = 1000 / FPS;
    const elapsed = STEPS.map(() => 0);
    let currentStep = 0;
    let totalElapsed = 0;

    const tick = setInterval(() => {
      const boost = (apiDoneRef.current && totalElapsed / TOTAL_MS >= 0.7) ? 4 : 1;

      if (currentStep < STEPS.length) {
        const step = STEPS[currentStep];
        elapsed[currentStep] = Math.min(elapsed[currentStep] + INTERVAL * boost, step.ms);
        const pct = Math.round((elapsed[currentStep] / step.ms) * 100);

        setStepProgress(prev => {
          const next = [...prev];
          next[currentStep] = pct;
          return next;
        });

        totalElapsed = elapsed.reduce((s, e) => s + e, 0);
        setOverall(Math.min(Math.round((totalElapsed / TOTAL_MS) * 100), 99));

        if (pct >= 100 && currentStep < STEPS.length - 1) {
          currentStep++;
          setActiveStep(currentStep);
        }

        // Последний шаг завершён
        if (pct >= 100 && currentStep === STEPS.length - 1) {
          clearInterval(tick);
          animDoneRef.current = true;
          if (apiDoneRef.current) triggerExit();
          // иначе ждём API (следующий useEffect)
        }
      }
    }, INTERVAL);

    return () => clearInterval(tick);
  }, [triggerExit]);

  // ── Реакция на завершение API ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoadingDone) return;
    apiDoneRef.current = true;

    if (animDoneRef.current) {
      // Анимация уже завершена — уходим сразу
      triggerExit();
    } else {
      // Анимация ещё идёт — она ускорится (boost=4)
      // Страховой таймаут: если через 6с анимация всё ещё не закончилась — уходим принудительно
      const failsafe = setTimeout(() => {
        if (!animDoneRef.current) triggerExit();
      }, 6000);
      return () => clearTimeout(failsafe);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "radial-gradient(ellipse at 50% 30%, rgba(40,12,4,1) 0%, rgba(6,3,1,1) 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      opacity: fading ? 0 : 1,
      transition: fading ? "opacity 0.5s ease" : "none",
      pointerEvents: fading ? "none" : "auto",
    }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(192,98,62,0.12) 0%, transparent 65%)" }} />

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <Sparkles size={18} style={{ color: "#c0623e" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: 1 }}>NextPath AI</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.2, marginBottom: 8 }}>
            Создаём ваш персональный план
          </h1>
          {targetProfession && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{targetProfession}</p>
          )}
        </div>

        {/* Overall bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              {overall < 100 ? "Анализируем данные..." : "Готово!"}
            </span>
            <span style={{ color: "#c0623e", fontWeight: 700 }}>{overall}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overall}%`, background: "linear-gradient(90deg, #c0623e, #e8855a)", borderRadius: 3, transition: "width 0.25s ease", boxShadow: "0 0 12px rgba(192,98,62,0.6)" }} />
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STEPS.map((step, idx) => {
            const pct = stepProgress[idx];
            const isActive = idx === activeStep;
            const isDone = pct >= 100;
            const isPending = idx > activeStep;
            return (
              <div key={idx} style={{
                borderRadius: 12, padding: "12px 14px",
                background: isActive ? `${step.color}12` : isDone ? "rgba(255,255,255,0.03)" : "transparent",
                border: `1px solid ${isActive ? step.color + "44" : isDone ? "rgba(255,255,255,0.07)" : "transparent"}`,
                transition: "all 0.3s", opacity: isPending ? 0.35 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isActive ? 10 : 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: "center" }}>
                    {isDone ? "✓" : step.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isDone ? "rgba(255,255,255,0.45)" : isActive ? "#fff" : "rgba(255,255,255,0.3)", transition: "color 0.3s" }}>
                    {step.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "right", color: isDone ? "rgba(255,255,255,0.25)" : isActive ? step.color : "rgba(255,255,255,0.15)", transition: "color 0.3s" }}>
                    {pct}%
                  </span>
                </div>
                {(isActive || isDone) && (
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginLeft: 40 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isDone ? "rgba(255,255,255,0.15)" : `linear-gradient(90deg, ${step.color}, ${step.color}cc)`, borderRadius: 2, transition: "width 0.08s linear", boxShadow: isActive ? `0 0 8px ${step.color}88` : "none" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 28, lineHeight: 1.6 }}>
          AI анализирует ваши данные и строит комплексный план развития
        </p>
      </div>
    </div>
  );
};
