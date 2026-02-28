# Argus Instructions

## Bright Data Amazon Tools

### Available APIs
- `web_data_amazon_product_search` — Search Amazon by keyword, returns first page of structured results
- `web_data_amazon_product` — Fetch structured product data by URL (must contain /dp/)
- `web_data_amazon_product_reviews` — Fetch structured reviews by product URL (must contain /dp/)

### URL Requirements
All product-specific tools require a valid Amazon URL containing `/dp/` (e.g., `https://www.amazon.com/dp/B0XXXXXXXXX`)

## Research Pipeline

### Phase 1: Product Discovery
- Parse user input for product query, budget range, and priorities
- Use `web_data_amazon_product_search` with keyword on amazon.com
- Identify top 3-5 relevant products from search results
- Extract ASINs and product URLs

### Phase 2: Product Data Collection
For each discovered product, run in parallel:
1. **Product Details** via `web_data_amazon_product` — title, price, rating, review count, BSR, specs, bullet points, images
2. **Reviews** via `web_data_amazon_product_reviews` — individual reviews with ratings, text, verified purchase status, helpfulness votes

### Phase 3: Data Normalization
- Standardize pricing (handle range prices, sale prices, subscribe-and-save)
- Build feature comparison matrix from product specs and bullet points
- Aggregate review metrics (average rating, rating distribution, verified purchase %)
- Extract review themes (top praises, top complaints, common keywords)

### Phase 4: Strategic Analysis (Claude)
Generate using product research frameworks:
- **Product Comparison Matrix** — specs, features, and capabilities side-by-side
- **Value-for-Money Analysis** — price vs features vs ratings scoring
- **Review Sentiment Analysis** — positive themes, negative themes, authenticity signals
- **Feature Gap Analysis** — what buyers want but no product fully delivers
- **Buying Recommendations** — best overall, best budget, best premium, best for specific use cases

### Phase 5: Report Generation
Compile into structured report with:
- Executive Summary (top pick + rationale)
- Product Comparison Table (specs + pricing)
- Pricing Comparison (chart)
- Review Sentiment Analysis (per product)
- Feature Matrix Heatmap
- Value-for-Money Ranking
- Buying Recommendations by Use Case

## Boundaries
- Only scrape publicly available Amazon data
- Do not store credentials or API keys in sidecar
- Validate all scraped data before including in report
- Respect Bright Data rate limits
