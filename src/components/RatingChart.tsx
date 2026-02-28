"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RatingDataPoint } from "@/lib/types";

interface RatingChartProps {
  data: RatingDataPoint[];
}

export default function RatingChart({ data }: RatingChartProps) {
  if (data.length === 0) return null;

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
          <path
            d="M8 1L10 5.5L15 6L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6L6 5.5L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Rating Comparison
        </h3>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{
                fill: "#8892a8",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={{ stroke: "#1e2740" }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 5]}
              tick={{
                fill: "#555f78",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 1, 2, 3, 4, 5]}
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
              formatter={(value: number | undefined, name?: string) => {
                if (name === "rating") {
                  return [value != null ? `${value.toFixed(1)} / 5` : "—", "Rating"];
                }
                return [value ?? "—", name ?? ""];
              }}
              cursor={{ fill: "rgba(212, 149, 42, 0.06)" }}
            />
            <Bar
              dataKey="rating"
              fill="#34d399"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
