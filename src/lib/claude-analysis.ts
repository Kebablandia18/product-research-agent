import Anthropic from "@anthropic-ai/sdk";
import { ProductWithReviews, AnalysisReport } from "./types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Argus, an expert Amazon product research analyst.
Analyze the provided product data and reviews to generate a comprehensive research report.
You MUST respond with valid JSON matching the exact schema specified. No markdown, no explanation—just JSON.`;

function buildUserPrompt(products: ProductWithReviews[], query: string): string {
  const productSummaries = products.map((p) => ({
    asin: p.asin,
    title: p.title,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    features: p.features,
    reviews: p.reviews.slice(0, 10).map((r) => ({
      rating: r.rating,
      title: r.title,
      body: r.body.slice(0, 300),
      verified: r.verifiedPurchase,
    })),
  }));

  return `Analyze these Amazon products for the search query: "${query}"

Product Data:
${JSON.stringify(productSummaries, null, 2)}

Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence overview of the market landscape for this product category",
  "products": [
    {
      "asin": "string",
      "title": "short product name (max 40 chars)",
      "brand": "string",
      "price": number or null,
      "rating": number or null,
      "reviewCount": number,
      "pros": ["up to 3 strengths"],
      "cons": ["up to 3 weaknesses"]
    }
  ],
  "priceComparison": [
    { "name": "short label (max 20 chars)", "price": number, "asin": "string" }
  ],
  "ratingComparison": [
    { "name": "short label", "rating": number, "reviewCount": number, "asin": "string" }
  ],
  "sentimentBreakdown": {
    "positiveThemes": [{ "theme": "string", "count": number }],
    "negativeThemes": [{ "theme": "string", "count": number }]
  },
  "recommendations": {
    "bestOverall": { "asin": "string", "title": "string", "reason": "1 sentence" },
    "bestBudget": { "asin": "string", "title": "string", "reason": "1 sentence" },
    "bestPremium": { "asin": "string", "title": "string", "reason": "1 sentence" }
  },
  "comparisonMatrix": [
    { "feature": "string", "ASIN1": "value", "ASIN2": "value" }
  ]
}

Important:
- Include only products that have price data in priceComparison
- For comparisonMatrix, use actual ASINs as keys and include 4-6 comparison features
- For sentimentBreakdown, identify 4-6 themes each from across ALL reviews
- Keep product names short for chart labels`;
}

export async function analyzeProducts(
  products: ProductWithReviews[],
  query: string
): Promise<AnalysisReport> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(products, query),
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonStr) as AnalysisReport;
}
