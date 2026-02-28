"use client";

interface ReportHeaderProps {
  query: string;
  summary: string;
  productCount: number;
}

export default function ReportHeader({
  query,
  summary,
  productCount,
}: ReportHeaderProps) {
  return (
    <div className="card p-8 relative overflow-hidden">
      {/* Decorative accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent), transparent)",
        }}
      />

      <div className="flex items-start gap-6">
        {/* Icon */}
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            style={{ color: "var(--accent-bright)" }}
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded"
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                border: "1px solid var(--border-accent)",
              }}
            >
              Intelligence Report
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                border: "1px solid var(--border-primary)",
              }}
            >
              {productCount} products analyzed
            </span>
          </div>

          {/* Query */}
          <h2
            className="text-xl font-bold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            &ldquo;{query}&rdquo;
          </h2>

          {/* Summary */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
