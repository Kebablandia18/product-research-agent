// ── Raw Bright Data types ────────────────────────────────────────────

export interface RawProduct {
  asin: string;
  title: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviews_count?: number;
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  availability?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface RawReview {
  title?: string;
  body?: string;
  rating?: number;
  author?: string;
  date?: string;
  verified_purchase?: boolean;
  [key: string]: unknown;
}

// ── Normalized types ─────────────────────────────────────────────────

export interface Product {
  asin: string;
  title: string;
  price: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  url: string;
  brand: string;
  category: string;
  features: string[];
}

export interface Review {
  title: string;
  body: string;
  rating: number;
  author: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface ProductWithReviews extends Product {
  reviews: Review[];
}

// ── Analysis report ──────────────────────────────────────────────────

export interface AnalysisReport {
  executiveSummary: string;
  products: ProductSummary[];
  priceComparison: PriceDataPoint[];
  ratingComparison: RatingDataPoint[];
  sentimentBreakdown: SentimentData;
  recommendations: Recommendations;
  comparisonMatrix: ComparisonRow[];
}

export interface ProductSummary {
  asin: string;
  title: string;
  brand: string;
  price: number | null;
  rating: number | null;
  reviewCount: number;
  pros: string[];
  cons: string[];
}

export interface PriceDataPoint {
  name: string;
  price: number;
  asin: string;
}

export interface RatingDataPoint {
  name: string;
  rating: number;
  reviewCount: number;
  asin: string;
}

export interface SentimentData {
  positiveThemes: ThemeCount[];
  negativeThemes: ThemeCount[];
}

export interface ThemeCount {
  theme: string;
  count: number;
}

export interface Recommendations {
  bestOverall: Recommendation;
  bestBudget: Recommendation;
  bestPremium: Recommendation;
}

export interface Recommendation {
  asin: string;
  title: string;
  reason: string;
}

export interface ComparisonRow {
  feature: string;
  [asin: string]: string; // dynamic columns per product
}

// ── Pipeline events ──────────────────────────────────────────────────

export type PipelinePhase =
  | "searching"
  | "scraping"
  | "collecting_reviews"
  | "analyzing"
  | "complete";

export interface PipelineEvent {
  phase: PipelinePhase;
  status: "started" | "progress" | "completed" | "error";
  message: string;
  data?: unknown;
}

export type PipelineCallback = (event: PipelineEvent) => void;
