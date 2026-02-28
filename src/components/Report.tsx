"use client";

import { AnalysisReport } from "@/lib/types";
import ReportHeader from "./ReportHeader";
import ProductComparisonTable from "./ProductComparisonTable";
import PricingChart from "./PricingChart";
import RatingChart from "./RatingChart";
import SentimentBreakdown from "./SentimentBreakdown";
import RecommendationCards from "./RecommendationCards";

interface ReportProps {
  report: AnalysisReport;
  query: string;
}

export default function Report({ report, query }: ReportProps) {
  return (
    <div className="space-y-6 stagger-children">
      <ReportHeader
        query={query}
        summary={report.executiveSummary}
        productCount={report.products.length}
      />

      <RecommendationCards data={report.recommendations} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PricingChart data={report.priceComparison} />
        <RatingChart data={report.ratingComparison} />
      </div>

      <SentimentBreakdown data={report.sentimentBreakdown} />

      <ProductComparisonTable
        rows={report.comparisonMatrix}
        products={report.products}
      />

      {/* Product pros/cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {report.products.map((product) => (
          <div key={product.asin} className="card p-5">
            <h4
              className="text-sm font-semibold mb-1 line-clamp-2"
              style={{ color: "var(--text-primary)" }}
            >
              {product.title}
            </h4>
            <p
              className="text-xs mb-3"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {product.brand}
              {product.price != null && ` · $${product.price.toFixed(2)}`}
              {product.rating != null && ` · ${product.rating}★`}
            </p>

            {product.pros.length > 0 && (
              <div className="mb-2">
                <p
                  className="text-[10px] uppercase tracking-widest mb-1"
                  style={{
                    color: "var(--success)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Pros
                </p>
                <ul className="space-y-1">
                  {product.pros.map((pro, i) => (
                    <li
                      key={i}
                      className="text-xs flex items-start gap-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--success)" }}>+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.cons.length > 0 && (
              <div>
                <p
                  className="text-[10px] uppercase tracking-widest mb-1"
                  style={{
                    color: "var(--error)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Cons
                </p>
                <ul className="space-y-1">
                  {product.cons.map((con, i) => (
                    <li
                      key={i}
                      className="text-xs flex items-start gap-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--error)" }}>−</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
