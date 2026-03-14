import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const SHOP_STORE = "tenf-shop";
const PRODUCTS_KEY = "products";
const CATEGORIES_KEY = "categories";
const METRICS_KEY = "product-metrics";

type PopularMode = "mostViewed" | "mostClicked" | "newest";

interface ProductMetricsMap {
  [productId: string]: {
    views?: number;
    clicks?: number;
    lastViewedAt?: string;
    lastClickedAt?: string;
  };
}

function toTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "mostViewed") as PopularMode;
    const categoryId = searchParams.get("categoryId");
    const limit = Math.max(1, Math.min(20, Number.parseInt(searchParams.get("limit") || "8", 10) || 8));

    const store = getStore(SHOP_STORE);
    const [productsJson, categoriesJson, metricsJson] = await Promise.all([
      store.get(PRODUCTS_KEY),
      store.get(CATEGORIES_KEY),
      store.get(METRICS_KEY),
    ]);

    let products: any[] = productsJson ? JSON.parse(productsJson) : [];
    const categories: any[] = categoriesJson ? JSON.parse(categoriesJson) : [];
    const metrics: ProductMetricsMap = metricsJson ? JSON.parse(metricsJson) : {};

    if (categoryId && categoryId !== "all") {
      products = products.filter((product) => product.categoryId === categoryId);
    }

    const enriched = products.map((product, index) => {
      const metric = metrics[product.id] || {};
      const category = categories.find((c) => c.id === product.categoryId) || null;
      return {
        ...product,
        category,
        __position: index,
        __views: Number(metric.views || 0),
        __clicks: Number(metric.clicks || 0),
      };
    });

    if (mode === "newest") {
      enriched.sort((a, b) => {
        const aTs = toTimestamp(a.createdAt || a.updatedAt);
        const bTs = toTimestamp(b.createdAt || b.updatedAt);
        return bTs - aTs || a.__position - b.__position;
      });
    } else if (mode === "mostClicked") {
      enriched.sort((a, b) => b.__clicks - a.__clicks || b.__views - a.__views || a.__position - b.__position);
    } else {
      enriched.sort((a, b) => b.__views - a.__views || b.__clicks - a.__clicks || a.__position - b.__position);
    }

    const productsOut = enriched.slice(0, limit).map(({ __position, __views, __clicks, ...rest }) => rest);
    return NextResponse.json({ products: productsOut });
  } catch (error) {
    console.error("Error fetching popular products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
