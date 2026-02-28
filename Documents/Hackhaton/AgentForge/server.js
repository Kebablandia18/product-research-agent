import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

dotenv.config();

// Bright Data MCP expects API_TOKEN — map from our named var at startup
if (process.env.BRIGHTDATA_API_TOKEN) {
  process.env.API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimax.io/v1',
});

// ── Bright Data MCP client ─────────────────────────────────────────────────────

let brightDataClient = null;

async function getBrightDataClient() {
  if (brightDataClient) return brightDataClient;

  if (!process.env.BRIGHTDATA_API_TOKEN) {
    throw new Error('BRIGHTDATA_API_TOKEN not configured');
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@brightdata/mcp'],
  });

  const mcpClient = new Client(
    { name: 'market-research-agent', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  brightDataClient = mcpClient;

  // Reset on close so the next request creates a fresh client
  transport.onclose = () => { brightDataClient = null; };

  console.log('Bright Data MCP client connected');
  return brightDataClient;
}

// ── Helper: extract text from MCP tool result ──────────────────────────────────

function extractText(result) {
  return result?.content?.find(c => c.type === 'text')?.text ?? null;
}

// ── Helper: safely parse JSON from MCP result text ────────────────────────────

function tryParseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// ── Amazon data gatherer ───────────────────────────────────────────────────────

/**
 * Uses three Bright Data Amazon tools to collect live marketplace data:
 *  1. web_data_amazon_product_search  — find competing products
 *  2. web_data_amazon_product         — detailed listing for top products
 *  3. web_data_amazon_product_reviews — customer reviews for the #1 result
 *
 * Returns a formatted string to inject into the Minimax prompt.
 * Falls back to '' (empty) if Bright Data is unavailable.
 */
async function gatherAmazonData(product) {
  let mcpClient;
  try {
    mcpClient = await getBrightDataClient();
  } catch (err) {
    console.warn('Bright Data MCP unavailable — proceeding without Amazon data:', err.message);
    return '';
  }

  const sections = [];

  // ── Step 1: Search Amazon for competing products ───────────────────────────
  let topProducts = [];
  try {
    console.log(`[amazon] Searching Amazon for: ${product}`);
    const searchResult = await mcpClient.callTool({
      name: 'web_data_amazon_product_search',
      arguments: { keyword: product, domain: 'amazon.com' },
    });

    const raw = extractText(searchResult);
    const parsed = tryParseJSON(raw);

    // The tool may return an array directly or wrap it in a key
    if (Array.isArray(parsed)) {
      topProducts = parsed;
    } else if (parsed?.results) {
      topProducts = parsed.results;
    } else if (parsed?.products) {
      topProducts = parsed.products;
    }

    if (topProducts.length > 0) {
      const rows = topProducts.slice(0, 8).map((p, i) => {
        const title   = p.title || p.name || 'Unknown';
        const brand   = p.brand ? ` (${p.brand})` : '';
        const price   = p.price != null ? ` — $${p.price}` : '';
        const rating  = p.rating != null ? ` — ⭐ ${p.rating}` : '';
        const reviews = p.reviews_count != null ? ` (${p.reviews_count} reviews)` : '';
        const asin    = p.asin ? ` — ASIN: ${p.asin}` : '';
        return `${i + 1}. ${title}${brand}${price}${rating}${reviews}${asin}`;
      }).join('\n');
      sections.push(`### Amazon Search Results for "${product}"\n${rows}`);
    } else if (raw) {
      // Fallback: use raw text if JSON parse failed
      sections.push(`### Amazon Search Results for "${product}"\n${raw.slice(0, 2500)}`);
    }
  } catch (err) {
    console.warn('[amazon] Product search failed:', err.message);
  }

  // ── Step 2: Fetch detailed listings for top 3 products ────────────────────
  const detailTargets = topProducts.slice(0, 3).filter(p => p.url || p.asin);
  for (const prod of detailTargets) {
    const url = prod.url || `https://www.amazon.com/dp/${prod.asin}`;
    try {
      console.log(`[amazon] Fetching product details: ${url}`);
      const detailResult = await mcpClient.callTool({
        name: 'web_data_amazon_product',
        arguments: { url },
      });

      const raw = extractText(detailResult);
      if (raw) {
        const label = prod.title || prod.name || prod.asin || url;
        sections.push(`### Product Details: ${label}\n${raw.slice(0, 1800)}`);
      }
    } catch (err) {
      console.warn(`[amazon] Product detail fetch failed (${url}):`, err.message);
    }
  }

  // ── Step 3: Fetch customer reviews for the top result ─────────────────────
  const top1 = topProducts[0];
  if (top1 && (top1.url || top1.asin)) {
    const url = top1.url || `https://www.amazon.com/dp/${top1.asin}`;
    try {
      console.log(`[amazon] Fetching reviews for: ${url}`);
      const reviewResult = await mcpClient.callTool({
        name: 'web_data_amazon_product_reviews',
        arguments: { url },
      });

      const raw = extractText(reviewResult);
      if (raw) {
        const label = top1.title || top1.name || top1.asin || url;
        sections.push(`### Customer Reviews — ${label}\n${raw.slice(0, 2500)}`);
      }
    } catch (err) {
      console.warn('[amazon] Review fetch failed:', err.message);
    }
  }

  if (sections.length === 0) return '';

  return sections.join('\n\n---\n\n');
}

// ── System prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MarketResearchAgent, an AI specialised in Amazon marketplace competitive intelligence.

When given an Amazon product category or product type, analyse the competitive landscape using the provided real-time Amazon data and return structured, strategic insights for a seller entering or competing in this market.

IMPORTANT: Real-time Amazon data (product listings, pricing, ratings, review counts, customer reviews) will be provided in the user message. Treat this as your PRIMARY source. Extract competitor names, prices, features, and customer sentiment directly from it. Fill remaining gaps with your training knowledge and mark those additions as "estimated".

Your Tasks:
- Identify the main competing products and brands on Amazon
- Analyse pricing strategies and the typical price range
- Compare product features, positioning, and differentiation
- Identify target customer segments and their buying motivations
- Summarise product strengths and weaknesses based on listing data and reviews
- Detect Amazon market trends (demand patterns, review velocity, feature adoption)
- Identify opportunity gaps and underserved niches
- Provide strategic recommendations specific to selling on Amazon

Amazon-Specific Guidance:
- Reference real product titles, brands, ASINs, and prices from the provided data
- Use ratings and review counts as proxies for market traction
- Derive customer pain points from negative review themes
- Note pricing clusters and any premium vs budget positioning split
- Flag any dominant brand with >30 % of top listings as a moat risk

Output Requirements:
- Return valid JSON only — no markdown, no text outside the JSON object
- Be analytical and data-driven; avoid vague generalities
- Label uncertain or estimated data as "estimated"
- Do not fabricate precise numbers not present in the provided data

JSON Schema:
{
  "product": "string",
  "analysisDate": "string (ISO date)",
  "marketOverview": {
    "summary": "string",
    "marketSize": "string",
    "growthRate": "string",
    "maturityStage": "string (emerging|growing|mature|declining)"
  },
  "competitors": [
    {
      "name": "string",
      "positioning": "string",
      "targetSegment": "string",
      "pricingModel": "string",
      "keyFeatures": ["string"],
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  ],
  "targetSegments": [
    {
      "segment": "string",
      "description": "string",
      "painPoints": ["string"],
      "willingnessToPay": "string"
    }
  ],
  "marketTrends": [
    {
      "trend": "string",
      "impact": "string (high|medium|low)",
      "description": "string"
    }
  ],
  "opportunityGaps": [
    {
      "gap": "string",
      "rationale": "string",
      "difficulty": "string (low|medium|high)"
    }
  ],
  "strategicRecommendations": [
    {
      "priority": "string (high|medium|low)",
      "recommendation": "string",
      "rationale": "string"
    }
  ],
  "swotAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  }
}`;

// ── Research endpoint ──────────────────────────────────────────────────────────

app.post('/api/research', async (req, res) => {
  const { product } = req.body;

  if (!product || !product.trim()) {
    return res.status(400).json({ error: 'Product description is required.' });
  }

  // Step 1 — gather live Amazon data via Bright Data MCP
  console.log(`[research] Gathering Amazon data for: ${product.trim()}`);
  const amazonData = await gatherAmazonData(product.trim());

  if (amazonData) {
    console.log(`[research] Amazon data gathered (${amazonData.length} chars)`);
  } else {
    console.log('[research] No Amazon data — falling back to AI training knowledge');
  }

  // Step 2 — build prompt, injecting Amazon data when available
  const userContent = amazonData
    ? `Perform a comprehensive Amazon market research analysis for: ${product.trim()}\n\nUse the following real-time Amazon marketplace data:\n\n${amazonData}`
    : `Perform a comprehensive Amazon market research analysis for: ${product.trim()}`;

  // Step 3 — call Minimax to synthesise the structured report
  try {
    const message = await client.chat.completions.create({
      model: 'MiniMax-M2.5',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
    });

    const raw = message.choices[0].message.content.trim();

    // Three-stage JSON extraction fallback
    let data;
    const candidates = [
      raw,
      raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(),
      (() => { const s = raw.indexOf('{'); const e = raw.lastIndexOf('}'); return s !== -1 && e > s ? raw.slice(s, e + 1) : null; })(),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      try { data = JSON.parse(candidate); break; } catch { /* try next */ }
    }

    if (!data) {
      console.error('Raw Minimax response:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response as JSON.', raw });
    }

    data._amazonDataUsed = !!amazonData;

    res.json(data);
  } catch (err) {
    console.error('Minimax API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MarketResearchAgent server running at http://localhost:${PORT}`);
});
