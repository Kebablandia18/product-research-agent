import {
  PipelineCallback,
  ProductWithReviews,
  AnalysisReport,
} from "./types";
import {
  searchAmazonProducts,
  getProductDetails,
  getProductReviews,
} from "./bright-data";
import {
  normalizeProducts,
  normalizeReviews,
  normalizeProduct,
  mergeProductWithReviews,
} from "./normalize";
import { analyzeProducts } from "./claude-analysis";

const MAX_PRODUCTS = 5; // Limit for demo speed

export async function runPipeline(
  query: string,
  onEvent: PipelineCallback
): Promise<AnalysisReport> {
  // ── Phase 1: Search ──────────────────────────────────────────────
  onEvent({
    phase: "searching",
    status: "started",
    message: `Searching Amazon for "${query}"...`,
  });

  const rawResults = await searchAmazonProducts(query);
  const products = normalizeProducts(rawResults).slice(0, MAX_PRODUCTS);

  if (products.length === 0) {
    throw new Error("No products found for this search query.");
  }

  onEvent({
    phase: "searching",
    status: "completed",
    message: `Found ${products.length} products`,
    data: { count: products.length },
  });

  // ── Phase 2: Scrape Details ──────────────────────────────────────
  onEvent({
    phase: "scraping",
    status: "started",
    message: `Fetching details for ${products.length} products...`,
  });

  const detailedProducts = await Promise.all(
    products.map(async (p, i) => {
      try {
        onEvent({
          phase: "scraping",
          status: "progress",
          message: `Scraping product ${i + 1}/${products.length}: ${p.title.slice(0, 50)}...`,
        });
        const details = await getProductDetails(p.url);
        return details ? normalizeProduct(details) : p;
      } catch {
        return p; // Fall back to search data
      }
    })
  );

  onEvent({
    phase: "scraping",
    status: "completed",
    message: `Scraped ${detailedProducts.length} product details`,
  });

  // ── Phase 3: Collect Reviews ─────────────────────────────────────
  onEvent({
    phase: "collecting_reviews",
    status: "started",
    message: "Collecting product reviews...",
  });

  const productsWithReviews: ProductWithReviews[] = await Promise.all(
    detailedProducts.map(async (p, i) => {
      try {
        onEvent({
          phase: "collecting_reviews",
          status: "progress",
          message: `Fetching reviews for product ${i + 1}/${detailedProducts.length}...`,
        });
        const rawReviews = await getProductReviews(p.url);
        const reviews = normalizeReviews(rawReviews);
        return mergeProductWithReviews(p, reviews);
      } catch {
        return mergeProductWithReviews(p, []);
      }
    })
  );

  onEvent({
    phase: "collecting_reviews",
    status: "completed",
    message: `Collected reviews for ${productsWithReviews.length} products`,
  });

  // ── Phase 4: Analyze with Claude ─────────────────────────────────
  onEvent({
    phase: "analyzing",
    status: "started",
    message: "Analyzing products with Claude...",
  });

  const report = await analyzeProducts(productsWithReviews, query);

  onEvent({
    phase: "analyzing",
    status: "completed",
    message: "Analysis complete",
  });

  // ── Phase 5: Complete ────────────────────────────────────────────
  onEvent({
    phase: "complete",
    status: "completed",
    message: "Research report ready",
    data: report,
  });

  return report;
}
