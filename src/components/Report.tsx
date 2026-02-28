"use client";

import { AnalysisReport } from "@/lib/types";

interface ReportProps {
  report: AnalysisReport;
  query: string;
}

// Stub — will be fully implemented in Batch 3
export default function Report({ report, query }: ReportProps) {
  return (
    <div className="space-y-8 stagger-children">
      <div
        className="card p-6 text-center"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <p style={{ color: "var(--text-muted)" }} className="text-xs uppercase tracking-widest mb-2">
          Report for
        </p>
        <p style={{ color: "var(--accent-bright)" }} className="text-lg font-semibold">
          &ldquo;{query}&rdquo;
        </p>
        <p style={{ color: "var(--text-secondary)" }} className="mt-4 text-sm">
          {report.executiveSummary}
        </p>
      </div>
    </div>
  );
}
