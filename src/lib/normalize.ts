import {
  RawProduct,
  RawReview,
  Product,
  Review,
  ProductWithReviews,
} from "./types";

export function normalizeProduct(raw: RawProduct): Product {
  return {
    asin: raw.asin || "",
    title: raw.title || "Unknown Product",
    price: typeof raw.price === "number" ? raw.price : null,
    currency: raw.currency || "USD",
    rating: typeof raw.rating === "number" ? raw.rating : null,
    reviewCount:
      typeof raw.reviews_count === "number" ? raw.reviews_count : 0,
    imageUrl: raw.image_url || null,
    url: raw.url || `https://amazon.com/dp/${raw.asin}`,
    brand: raw.brand || "Unknown",
    category: raw.category || "",
    features: Array.isArray(raw.features) ? raw.features : [],
  };
}

export function normalizeReview(raw: RawReview): Review {
  return {
    title: raw.title || "",
    body: raw.body || "",
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    author: raw.author || "Anonymous",
    date: raw.date || "",
    verifiedPurchase: raw.verified_purchase ?? false,
  };
}

export function normalizeProducts(raw: RawProduct[]): Product[] {
  return raw.map(normalizeProduct);
}

export function normalizeReviews(raw: RawReview[]): Review[] {
  return raw.map(normalizeReview);
}

export function mergeProductWithReviews(
  product: Product,
  reviews: Review[]
): ProductWithReviews {
  return { ...product, reviews };
}
