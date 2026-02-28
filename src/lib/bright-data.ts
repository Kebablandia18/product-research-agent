import { RawProduct, RawReview } from "./types";

const MCP_ENDPOINT = "https://mcp.brightdata.com/mcp";

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: { content?: Array<{ type: string; text: string }>; [key: string]: unknown };
  error?: { code: number; message: string };
}

let requestId = 0;
let sessionId: string | null = null;

function getEndpointUrl(): string {
  const token = process.env.BRIGHT_DATA_API_TOKEN;
  if (!token) throw new Error("BRIGHT_DATA_API_TOKEN is not set");
  return `${MCP_ENDPOINT}?token=${token}`;
}

async function ensureSession(): Promise<void> {
  if (sessionId) return;

  const url = getEndpointUrl();

  const initRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++requestId,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "argus", version: "1.0.0" },
      },
    }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`MCP initialize failed (${initRes.status}): ${text}`);
  }

  sessionId = initRes.headers.get("mcp-session-id");
  await initRes.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const notifRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });
  await notifRes.text();
}

function parseSSEResponse(text: string): JsonRpcResponse | null {
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      try {
        return JSON.parse(trimmed.slice(6));
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string | null> {
  await ensureSession();

  const url = getEndpointUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++requestId,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  if (!res.ok) {
    if (res.status === 404 && sessionId) {
      sessionId = null;
      return callMcpTool(toolName, args);
    }
    const text = await res.text();
    throw new Error(`Bright Data MCP error (${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  let json: JsonRpcResponse;

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const parsed = parseSSEResponse(text);
    if (!parsed) throw new Error("No JSON-RPC response in SSE stream");
    json = parsed;
  } else {
    json = await res.json();
  }

  if (json.error) {
    throw new Error(
      `MCP tool error [${json.error.code}]: ${json.error.message}`
    );
  }

  const content = json.result?.content;
  if (!content || !Array.isArray(content) || content.length === 0) return null;

  return content.find((c) => c.type === "text")?.text ?? null;
}

// ── Public API ───────────────────────────────────────────────────────
// Uses free-tier tools: search_engine + scrape_as_markdown
// Claude then extracts structured data from the markdown.

export async function searchAmazonProducts(
  query: string
): Promise<RawProduct[]> {
  // Use search_engine to find Amazon products
  const text = await callMcpTool("search_engine", {
    query: `site:amazon.com ${query}`,
    engine: "google",
    count: 8,
  });

  if (!text) return [];

  // Parse search results — search_engine returns JSON for Google
  let results: Array<{ title?: string; url?: string; description?: string }>;
  try {
    const parsed = JSON.parse(text);
    results = Array.isArray(parsed)
      ? parsed
      : parsed.organic || parsed.results || [];
  } catch {
    // If not JSON, try to extract URLs from markdown
    results = extractLinksFromMarkdown(text);
  }

  // Filter to actual Amazon product pages (contain /dp/)
  const productResults = results.filter(
    (r) => r.url && r.url.includes("amazon.com") && r.url.includes("/dp/")
  );

  return productResults.map((r) => {
    const asin = extractAsin(r.url || "") || "";
    return {
      asin,
      title: r.title || "Unknown Product",
      url: r.url || "",
      features: [],
    } as RawProduct;
  });
}

export async function getProductDetails(
  url: string
): Promise<RawProduct | null> {
  const text = await callMcpTool("scrape_as_markdown", { url });
  if (!text) return null;

  // Return raw markdown — Claude will do the heavy lifting in analysis
  const asin = extractAsin(url) || "";
  return {
    asin,
    title: extractFromMarkdown(text, "title") || "Unknown Product",
    price: extractPrice(text),
    rating: extractRating(text),
    reviews_count: extractReviewCount(text),
    brand: extractFromMarkdown(text, "brand") || "",
    url,
    features: extractFeatures(text),
    _raw_markdown: text, // Pass raw markdown for Claude to analyze
  } as RawProduct & { _raw_markdown: string };
}

export async function getProductReviews(
  url: string
): Promise<RawReview[]> {
  // Scrape the reviews page
  const reviewUrl = url.includes("/dp/")
    ? url.replace(/\/dp\//, "/product-reviews/").split("?")[0]
    : url;

  const text = await callMcpTool("scrape_as_markdown", { url: reviewUrl });
  if (!text) return [];

  // Extract review blocks from markdown
  return extractReviewsFromMarkdown(text);
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractAsin(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                url.match(/\/product-reviews\/([A-Z0-9]{10})/i) ||
                url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  return match ? match[1] : null;
}

function extractPrice(markdown: string): number | undefined {
  // Look for price patterns like $29.99, $129.00
  const match = markdown.match(/\$(\d{1,4}(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : undefined;
}

function extractRating(markdown: string): number | undefined {
  // Look for patterns like "4.5 out of 5" or "4.5/5"
  const match =
    markdown.match(/(\d(?:\.\d)?)\s*out of\s*5/i) ||
    markdown.match(/(\d(?:\.\d)?)\s*\/\s*5/);
  return match ? parseFloat(match[1]) : undefined;
}

function extractReviewCount(markdown: string): number | undefined {
  // Look for patterns like "12,345 ratings" or "1,234 reviews"
  const match = markdown.match(/([\d,]+)\s*(?:ratings?|reviews?|global)/i);
  return match ? parseInt(match[1].replace(/,/g, ""), 10) : undefined;
}

function extractFromMarkdown(
  markdown: string,
  field: "title" | "brand"
): string | null {
  if (field === "title") {
    // First heading or first bold text is often the title
    const match = markdown.match(/^#\s+(.+)$/m) ||
                  markdown.match(/\*\*(.{10,80})\*\*/);
    return match ? match[1].trim() : null;
  }
  if (field === "brand") {
    const match =
      markdown.match(/(?:Brand|by)\s*[:\s]*\[?([A-Za-z0-9][\w\s&.-]{1,30})/i);
    return match ? match[1].trim() : null;
  }
  return null;
}

function extractFeatures(markdown: string): string[] {
  // Look for "About this item" section with bullet points
  const aboutMatch = markdown.match(
    /About this item[\s\S]*?((?:[-*]\s+.+\n?){1,8})/i
  );
  if (aboutMatch) {
    return aboutMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[-*]\s+/, "").trim())
      .filter((l) => l.length > 5 && l.length < 200);
  }

  // Fallback: grab any bullet list items
  const bullets = markdown.match(/^[-*]\s+.{10,200}$/gm);
  return bullets ? bullets.slice(0, 6).map((b) => b.replace(/^[-*]\s+/, "").trim()) : [];
}

function extractReviewsFromMarkdown(markdown: string): RawReview[] {
  const reviews: RawReview[] = [];

  // Split by common review separators
  // Reviews often have rating + title + body patterns
  const reviewBlocks = markdown.split(/(?=\d(?:\.\d)?\s*out of\s*5)/i);

  for (const block of reviewBlocks.slice(0, 15)) {
    if (block.length < 30) continue;

    const ratingMatch = block.match(/(\d(?:\.\d)?)\s*out of\s*5/i);
    if (!ratingMatch) continue;

    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    const titleLine = lines.find(
      (l) =>
        l.length > 5 &&
        l.length < 150 &&
        !l.match(/out of 5/i) &&
        !l.match(/^\d/)
    );

    const bodyLines = lines.filter(
      (l) =>
        l.length > 20 &&
        !l.match(/out of 5/i) &&
        l !== titleLine
    );

    reviews.push({
      rating: parseFloat(ratingMatch[1]),
      title: titleLine?.replace(/^[#*]+\s*/, "").trim() || "",
      body: bodyLines.join(" ").slice(0, 500),
      verified_purchase: block.toLowerCase().includes("verified purchase"),
    });
  }

  return reviews;
}

function extractLinksFromMarkdown(
  markdown: string
): Array<{ title: string; url: string }> {
  const links: Array<{ title: string; url: string }> = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    links.push({ title: match[1], url: match[2] });
  }
  return links;
}
