"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PriceDataPoint } from "@/lib/types";

interface PricingChartProps {
  data: PriceDataPoint[];
}

const BAR_COLORS = [
  "#d4952a",
  "#f0b445",
  "#a07020",
  "#e8a933",
  "#c7882a",
];

export default function PricingChart({ data }: PricingChartProps) {
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
            d="M8 1V15M4.5 4H2.5C1.67 4 1 4.67 1 5.5C1 6.33 1.67 7 2.5 7H5.5C6.33 7 7 7.67 7 8.5C7 9.33 6.33 10 5.5 10H1M11.5 4H13.5C14.33 4 15 4.67 15 5.5C15 6.33 14.33 7 13.5 7H10.5C9.67 7 9 7.67 9 8.5C9 9.33 9.67 10 10.5 10H15"
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
          Price Comparison
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
              tick={{
                fill: "#555f78",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
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
              formatter={(value: number | undefined) => [
                value != null ? `$${value.toFixed(2)}` : "—",
                "Price",
              ]}
              cursor={{ fill: "rgba(212, 149, 42, 0.06)" }}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
