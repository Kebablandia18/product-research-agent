import { RawProduct, RawReview } from "./types";

const MCP_ENDPOINT = "https://mcp.brightdata.com/mcp";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: { content: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

let requestId = 0;

async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const token = process.env.BRIGHT_DATA_API_TOKEN;
  if (!token) throw new Error("BRIGHT_DATA_API_TOKEN is not set");

  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: ++requestId,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  const res = await fetch(`${MCP_ENDPOINT}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data MCP error (${res.status}): ${text}`);
  }

  const json: JsonRpcResponse = await res.json();

  if (json.error) {
    throw new Error(
      `MCP tool error [${json.error.code}]: ${json.error.message}`
    );
  }

  // MCP tools return content array; parse the text content
  const content = json.result?.content;
  if (!content || content.length === 0) return null;

  const text = content.find((c) => c.type === "text")?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function searchAmazonProducts(
  query: string
): Promise<RawProduct[]> {
  const result = await callMcpTool("web_data_amazon_product_search", {
    query,
    domain: "amazon.com",
    pages: 1,
  });

  // The response may be an array directly or nested
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "products" in (result as Record<string, unknown>)) {
    return (result as Record<string, unknown>).products as RawProduct[];
  }
  return [];
}

export async function getProductDetails(
  url: string
): Promise<RawProduct | null> {
  const result = await callMcpTool("web_data_amazon_product", { url });

  if (Array.isArray(result) && result.length > 0) return result[0];
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result as RawProduct;
  }
  return null;
}

export async function getProductReviews(
  url: string
): Promise<RawReview[]> {
  const result = await callMcpTool("web_data_amazon_product_reviews", {
    url,
    pages: 1,
  });

  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "reviews" in (result as Record<string, unknown>)) {
    return (result as Record<string, unknown>).reviews as RawReview[];
  }
  return [];
}
