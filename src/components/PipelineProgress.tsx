"use client";

import { PipelinePhase } from "@/lib/types";

const PHASES: { key: PipelinePhase; label: string; icon: string }[] = [
  { key: "searching", label: "Searching Amazon", icon: "01" },
  { key: "scraping", label: "Scraping Products", icon: "02" },
  { key: "collecting_reviews", label: "Collecting Reviews", icon: "03" },
  { key: "analyzing", label: "Analyzing with Claude", icon: "04" },
  { key: "complete", label: "Report Ready", icon: "05" },
];

interface PipelineProgressProps {
  currentPhase: PipelinePhase | null;
  completedPhases: PipelinePhase[];
  statusMessage: string;
  hasError: boolean;
}

export default function PipelineProgress({
  currentPhase,
  completedPhases,
  statusMessage,
  hasError,
}: PipelineProgressProps) {
  function getPhaseState(
    phase: PipelinePhase
  ): "idle" | "active" | "completed" | "error" {
    if (hasError && phase === currentPhase) return "error";
    if (completedPhases.includes(phase)) return "completed";
    if (phase === currentPhase) return "active";
    return "idle";
  }

  return (
    <div
      className="w-full max-w-md mx-auto animate-fade-in"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: hasError ? "var(--error)" : "var(--accent)",
            boxShadow: hasError
              ? "0 0 8px var(--error)"
              : "0 0 8px var(--accent)",
          }}
        />
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            color: hasError ? "var(--error)" : "var(--accent)",
          }}
        >
          {hasError ? "Pipeline Error" : "Pipeline Active"}
        </span>
      </div>

      <div className="space-y-1">
        {PHASES.map((phase) => {
          const state = getPhaseState(phase.key);
          return (
            <div
              key={phase.key}
              className="flex items-center gap-4 py-3 px-4 rounded-lg transition-all"
              style={{
                background:
                  state === "active"
                    ? "var(--bg-card)"
                    : state === "error"
                      ? "var(--error)08"
                      : "transparent",
                borderLeft:
                  state === "active"
                    ? "2px solid var(--accent)"
                    : state === "completed"
                      ? "2px solid var(--success)"
                      : state === "error"
                        ? "2px solid var(--error)"
                        : "2px solid var(--border-primary)",
              }}
            >
              {/* Phase number */}
              <span
                className="text-xs w-5 shrink-0"
                style={{
                  color:
                    state === "completed"
                      ? "var(--success)"
                      : state === "active"
                        ? "var(--accent)"
                        : state === "error"
                          ? "var(--error)"
                          : "var(--text-muted)",
                }}
              >
                {state === "completed" ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  phase.icon
                )}
              </span>

              {/* Label */}
              <span
                className="text-sm flex-1"
                style={{
                  color:
                    state === "completed"
                      ? "var(--text-secondary)"
                      : state === "active"
                        ? "var(--text-primary)"
                        : state === "error"
                          ? "var(--error)"
                          : "var(--text-muted)",
                }}
              >
                {phase.label}
              </span>

              {/* Spinner for active */}
              {state === "active" && (
                <span
                  className="inline-block w-3 h-3 border-[1.5px] rounded-full animate-spin"
                  style={{
                    borderColor: "var(--accent)",
                    borderTopColor: "transparent",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {statusMessage && (
        <p
          className="mt-4 text-xs px-4 truncate"
          style={{
            color: hasError ? "var(--error)" : "var(--text-muted)",
          }}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
