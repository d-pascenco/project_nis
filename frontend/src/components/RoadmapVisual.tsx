import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoadmapData, RoadmapStage } from "@/types";
import { PROFESSION_LABELS, getResourceUrl } from "@/lib/constants";
import {
  X, ExternalLink, Clock, CheckCircle2, Circle,
  Target, User, ChevronDown, ChevronUp, GitBranch,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoadmapVisualProps {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  completedStages?: number[];
  open: boolean;
  onClose: () => void;
}

// ── Stage colors ──────────────────────────────────────────────────────────────

const STAGE_PALETTE = [
  { bg: "rgba(192,98,62,0.15)",  border: "#c0623e", glow: "rgba(192,98,62,0.4)",  text: "#e8855a" },
  { bg: "rgba(99,132,199,0.15)", border: "#6384c7", glow: "rgba(99,132,199,0.4)", text: "#7fa0e0" },
  { bg: "rgba(130,99,199,0.15)", border: "#8263c7", glow: "rgba(130,99,199,0.4)", text: "#a07fe0" },
  { bg: "rgba(199,163,40,0.15)", border: "#c7a328", glow: "rgba(199,163,40,0.4)", text: "#dfc050" },
  { bg: "rgba(62,162,98,0.15)",  border: "#3ea262", glow: "rgba(62,162,98,0.4)",  text: "#5abf80" },
  { bg: "rgba(199,80,100,0.15)", border: "#c75064", glow: "rgba(199,80,100,0.4)", text: "#e07a90" },
];

// ── Connector line with arrow ─────────────────────────────────────────────────

const Connector = ({ color, completed }: { color: string; completed?: boolean }) => (
  <div className="flex flex-col items-center py-1" style={{ minHeight: 48 }}>
    <div
      style={{
        width: 2,
        flex: 1,
        background: completed
          ? `linear-gradient(to bottom, ${color}, ${color}88)`
          : `linear-gradient(to bottom, ${color}66, ${color}22)`,
        boxShadow: completed ? `0 0 8px ${color}` : "none",
        transition: "all 0.5s",
      }}
    />
    <svg width="12" height="10" viewBox="0 0 12 10">
      <path
        d="M6 10 L0 0 L12 0 Z"
        fill={completed ? color : `${color}44`}
        style={{ filter: completed ? `drop-shadow(0 0 4px ${color})` : "none" }}
      />
    </svg>
  </div>
);

// ── Stage node ────────────────────────────────────────────────────────────────

const StageNode = ({
  stage, palette, completed, isFirst,
}: {
  stage: RoadmapStage;
  palette: (typeof STAGE_PALETTE)[0];
  completed: boolean;
  isFirst: boolean;
}) => {
  const [expanded, setExpanded] = useState(isFirst);

  return (
    <div
      className="rounded-2xl transition-all duration-300 cursor-pointer"
      style={{
        background: completed ? "rgba(255,255,255,0.04)" : palette.bg,
        border: `1.5px solid ${completed ? palette.border + "44" : palette.border}`,
        boxShadow: completed ? "none" : `0 0 20px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        opacity: completed ? 0.7 : 1,
      }}
      onClick={() => setExpanded((p) => !p)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: completed ? "rgba(255,255,255,0.1)" : palette.bg,
            border: `2px solid ${palette.border}`,
            color: palette.text,
            boxShadow: completed ? "none" : `0 0 12px ${palette.glow}`,
          }}
        >
          {completed ? <CheckCircle2 className="w-5 h-5" /> : stage.id}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{stage.title}</h3>
            {completed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                Выполнено
              </span>
            )}
            {isFirst && !completed && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: palette.bg, color: palette.text, border: `1px solid ${palette.border}` }}
              >
                Сейчас
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3" style={{ color: palette.text }} />
            <span className="text-xs" style={{ color: palette.text }}>{stage.duration}</span>
          </div>
        </div>

        <button
          className="shrink-0 p-1 rounded-lg transition-colors"
          style={{ color: palette.text }}
          onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="w-full h-px" style={{ background: `${palette.border}33` }} />

          {/* Skills */}
          <div>
            <p className="text-xs mb-2" style={{ color: `${palette.text}99` }}>НАВЫКИ:</p>
            <div className="flex flex-wrap gap-1.5">
              {stage.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: `${palette.border}22`, color: palette.text, border: `1px solid ${palette.border}44` }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs mb-2" style={{ color: `${palette.text}99` }}>РЕСУРСЫ:</p>
            <div className="flex flex-wrap gap-2">
              {stage.resources.map((r) => (
                <a
                  key={r}
                  href={getResourceUrl(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {r} <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Start node ────────────────────────────────────────────────────────────────

const StartNode = ({ userName, currentRole, skills }: {
  userName: string; currentRole?: string; skills?: string[];
}) => (
  <div
    className="rounded-2xl p-5"
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1.5px solid rgba(255,255,255,0.12)",
    }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)" }}
      >
        <User className="w-5 h-5 text-white/60" />
      </div>
      <div>
        <p className="font-semibold text-white text-sm">{userName || "Вы сейчас"}</p>
        <p className="text-xs text-white/40">{currentRole || "Текущий уровень"}</p>
      </div>
    </div>
    {skills && skills.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 5).map((s) => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/40 border border-white/10">
            {s}
          </span>
        ))}
        {skills.length > 5 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/40">
            +{skills.length - 5}
          </span>
        )}
      </div>
    )}
  </div>
);

// ── Goal node ─────────────────────────────────────────────────────────────────

const GoalNode = ({ profession, summary, totalDuration }: {
  profession: string; summary?: string; totalDuration?: string;
}) => (
  <div
    className="rounded-2xl p-5 mb-2 text-center"
    style={{
      background: "linear-gradient(135deg, rgba(192,98,62,0.25), rgba(192,98,62,0.08))",
      border: "2px solid rgba(192,98,62,0.6)",
      boxShadow: "0 0 40px rgba(192,98,62,0.2), 0 0 80px rgba(192,98,62,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
    }}
  >
    <div className="flex items-center justify-center gap-2 mb-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(192,98,62,0.3)", border: "2px solid rgba(192,98,62,0.8)" }}
      >
        <Target className="w-5 h-5" style={{ color: "#e8855a" }} />
      </div>
      <div className="text-left">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Цель</p>
        <h2 className="text-lg font-bold text-white leading-tight">{profession}</h2>
      </div>
    </div>
    {totalDuration && (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-1"
        style={{ background: "rgba(192,98,62,0.2)", border: "1px solid rgba(192,98,62,0.4)" }}>
        <Clock className="w-3.5 h-3.5" style={{ color: "#e8855a" }} />
        <span className="text-xs font-medium" style={{ color: "#e8855a" }}>{totalDuration}</span>
      </div>
    )}
    {summary && (
      <p className="text-xs text-white/40 mt-3 leading-relaxed max-w-md mx-auto">{summary}</p>
    )}
  </div>
);

// ── Main dialog component ─────────────────────────────────────────────────────

export const RoadmapVisual = ({
  roadmapData, userName, targetProfession, currentRole, technicalSkills,
  completedStages = [], open, onClose,
}: RoadmapVisualProps) => {
  const profession = PROFESSION_LABELS[targetProfession] || targetProfession || "Цель";
  const stages = [...roadmapData.stages]; // top-down: stage 1 first

  const firstIncomplete = stages.findIndex((s) => !completedStages.includes(s.id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-transparent overflow-hidden">
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, #2d120800 0%, #0d0704 60%, #000000 100%)",
            backgroundColor: "#0d0704",
          }}
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(192,98,62,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,132,199,0.08) 0%, transparent 70%)" }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-xl transition-all hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-center py-4 px-16"
          style={{ background: "linear-gradient(to bottom, rgba(13,7,4,0.9), transparent)" }}>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: "#c0623e" }} />
            <span className="text-white/50 text-sm font-medium">Дорожная карта развития</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="min-h-full flex flex-col items-center pt-16 pb-24 px-4">
            <div className="w-full max-w-lg">

              {/* GOAL */}
              <GoalNode
                profession={profession}
                summary={roadmapData.summary}
                totalDuration={roadmapData.total_duration}
              />

              {/* Stages top-down */}
              {stages.map((stage, idx) => {
                const palette = STAGE_PALETTE[idx % STAGE_PALETTE.length];
                const done = completedStages.includes(stage.id);
                const isFirst = idx === firstIncomplete;
                return (
                  <div key={stage.id}>
                    <Connector color={palette.border} completed={done} />
                    <StageNode
                      stage={stage}
                      palette={palette}
                      completed={done}
                      isFirst={isFirst}
                    />
                  </div>
                );
              })}

              {/* START */}
              <Connector color="rgba(255,255,255,0.15)" />
              <StartNode
                userName={userName}
                currentRole={currentRole}
                skills={technicalSkills}
              />

              {/* Bottom hint */}
              <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.2)" }}>
                Нажмите на этап чтобы раскрыть навыки и ресурсы
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Trigger button ────────────────────────────────────────────────────────────

export const RoadmapVisualButton = ({ onClick, size = "default" }: {
  onClick: () => void;
  size?: "default" | "lg" | "sm";
}) => (
  <Button
    variant="outline"
    size={size}
    onClick={onClick}
    className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60"
  >
    <GitBranch className="w-4 h-4" />
    Карта развития
  </Button>
);
