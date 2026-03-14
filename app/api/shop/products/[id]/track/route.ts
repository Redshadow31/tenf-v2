import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const SHOP_STORE = "tenf-shop";
const METRICS_KEY = "product-metrics";

type EventType = "view" | "click";

interface ProductMetricsMap {
  [productId: string]: {
    views?: number;
    clicks?: number;
    lastViewedAt?: string;
    lastClickedAt?: string;
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const eventType = String(body?.event || "view") as EventType;
    if (!id) {
      return NextResponse.json({ error: "Product id requis" }, { status: 400 });
    }

    if (eventType !== "view" && eventType !== "click") {
      return NextResponse.json({ error: "event invalide" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const store = getStore(SHOP_STORE);
    const metricsJson = await store.get(METRICS_KEY);
    const metrics: ProductMetricsMap = metricsJson ? JSON.parse(metricsJson) : {};

    const current = metrics[id] || {};
    if (eventType === "view") {
      current.views = Number(current.views || 0) + 1;
      current.lastViewedAt = nowIso;
    } else {
      current.clicks = Number(current.clicks || 0) + 1;
      current.lastClickedAt = nowIso;
    }

    metrics[id] = current;
    await store.set(METRICS_KEY, JSON.stringify(metrics, null, 2));

    return NextResponse.json({ success: true, metrics: current });
  } catch (error) {
    console.error("Error tracking product event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
