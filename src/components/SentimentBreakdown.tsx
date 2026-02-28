"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SentimentData } from "@/lib/types";

interface SentimentBreakdownProps {
  data: SentimentData;
}

export default function SentimentBreakdown({ data }: SentimentBreakdownProps) {
  const hasPositive = data.positiveThemes.length > 0;
  const hasNegative = data.negativeThemes.length > 0;
  if (!hasPositive && !hasNegative) return null;

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div
        className="px-6 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--border-primary)" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: "var(--accent)" }}
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 10C5.83 11.17 7.17 12 8.5 12C9.83 12 11 11.17 11.5 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
          <circle cx="10.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Review Sentiment
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Positive themes */}
        {hasPositive && (
          <div
            className="p-6"
            style={{
              borderRight: hasNegative ? "1px solid var(--border-primary)" : undefined,
            }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{
                color: "var(--success)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: "var(--success)" }}
              />
              Positive Themes
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={data.positiveThemes}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{
                    fill: "#555f78",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="theme"
                  width={100}
                  tick={{
                    fill: "#8892a8",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#131926",
                    border: "1px solid #1e2740",
                    borderRadius: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#e2e6f0",
                  }}
                  cursor={{ fill: "rgba(52, 211, 153, 0.06)" }}
                />
                <Bar
                  dataKey="count"
                  fill="#34d399"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Negative themes */}
        {hasNegative && (
          <div className="p-6">
            <p
              className="text-xs uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{
                color: "var(--error)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: "var(--error)" }}
              />
              Negative Themes
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={data.negativeThemes}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{
                    fill: "#555f78",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="theme"
                  width={100}
                  tick={{
                    fill: "#8892a8",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#131926",
                    border: "1px solid #1e2740",
                    borderRadius: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#e2e6f0",
                  }}
                  cursor={{ fill: "rgba(248, 113, 113, 0.06)" }}
                />
                <Bar
                  dataKey="count"
                  fill="#f87171"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
