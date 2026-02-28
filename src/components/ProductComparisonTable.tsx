"use client";

import { ComparisonRow, ProductSummary } from "@/lib/types";

interface ProductComparisonTableProps {
  rows: ComparisonRow[];
  products: ProductSummary[];
}

export default function ProductComparisonTable({
  rows,
  products,
}: ProductComparisonTableProps) {
  if (rows.length === 0 || products.length === 0) return null;

  // Get product ASINs from the first row (excluding "feature" key)
  const asins = Object.keys(rows[0]).filter((k) => k !== "feature");

  // Build a lookup for product names
  const nameMap: Record<string, string> = {};
  for (const p of products) {
    nameMap[p.asin] = p.title;
  }

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div
        className="px-6 py-4 flex items-center gap-2"
        style={{
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: "var(--accent)" }}
        >
          <rect
            x="1"
            y="1"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="9"
            y="1"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="1"
            y="9"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="9"
            y="9"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
        >
          Feature Comparison
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wider"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  background: "var(--bg-secondary)",
                }}
              >
                Feature
              </th>
              {asins.map((asin) => (
                <th
                  key={asin}
                  className="text-left px-6 py-3 text-xs uppercase tracking-wider"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg-secondary)",
                    maxWidth: "200px",
                  }}
                >
                  <span className="block truncate">
                    {nameMap[asin] || asin}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < rows.length - 1
                      ? "1px solid var(--border-primary)"
                      : undefined,
                }}
              >
                <td
                  className="px-6 py-3 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.feature}
                </td>
                {asins.map((asin) => (
                  <td
                    key={asin}
                    className="px-6 py-3"
                    style={{
                      color: "var(--text-secondary)",
                      maxWidth: "200px",
                    }}
                  >
                    {row[asin] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
