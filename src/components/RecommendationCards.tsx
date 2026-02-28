"use client";

import { Recommendations } from "@/lib/types";

interface RecommendationCardsProps {
  data: Recommendations;
}

const CARD_CONFIG = [
  {
    key: "bestOverall" as const,
    label: "Best Overall",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 1L12.5 6.5L18.5 7L14 11L15.5 17L10 14L4.5 17L6 11L1.5 7L7.5 6.5L10 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accentColor: "#d4952a",
    glowColor: "#d4952a22",
  },
  {
    key: "bestBudget" as const,
    label: "Best Budget",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 5V15M7 8H12C12.55 8 13 8.45 13 9C13 9.55 12.55 10 12 10H7M7 10H12.5C13.05 10 13.5 10.45 13.5 11C13.5 11.55 13.05 12 12.5 12H7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    accentColor: "#34d399",
    glowColor: "#34d39922",
  },
  {
    key: "bestPremium" as const,
    label: "Best Premium",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 7L7 3L10 6L13 3L17 7L10 17L3 7Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accentColor: "#a78bfa",
    glowColor: "#a78bfa22",
  },
];

export default function RecommendationCards({
  data,
}: RecommendationCardsProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: "var(--accent)" }}
        >
          <path
            d="M8 1V3M8 13V15M1 8H3M13 8H15M3 3L4.5 4.5M11.5 11.5L13 13M13 3L11.5 4.5M4.5 11.5L3 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Recommendations
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARD_CONFIG.map((cfg) => {
          const rec = data[cfg.key];
          if (!rec) return null;

          return (
            <div
              key={cfg.key}
              className="card p-5 transition-all hover:scale-[1.02]"
              style={{
                borderColor: `${cfg.accentColor}33`,
              }}
            >
              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: cfg.glowColor,
                    color: cfg.accentColor,
                    border: `1px solid ${cfg.accentColor}33`,
                  }}
                >
                  {cfg.icon}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.15em] font-semibold"
                  style={{
                    color: cfg.accentColor,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Product */}
              <p
                className="text-sm font-semibold mb-2 line-clamp-2"
                style={{ color: "var(--text-primary)" }}
              >
                {rec.title}
              </p>

              {/* Reason */}
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {rec.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
