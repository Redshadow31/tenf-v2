import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { requireAdmin } from "@/lib/requireAdmin";

const SHOP_STORE = "tenf-shop";
const SETTINGS_KEY = "settings";

export interface ShopSettings {
  communityCounters: {
    productsSold: number;
    supporters: number;
    eventsFunded: number;
  };
  sections: {
    creatorsProductIds: string[];
    dropsProductIds: string[];
    goodiesProductIds: string[];
    communityProductIds: string[];
  };
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  communityCounters: {
    productsSold: 128,
    supporters: 42,
    eventsFunded: 3,
  },
  sections: {
    creatorsProductIds: [],
    dropsProductIds: [],
    goodiesProductIds: [],
    communityProductIds: [],
  },
  updatedAt: new Date(0).toISOString(),
};

function sanitizePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie ou acces refuse" }, { status: 401 });
    }

    const store = getStore(SHOP_STORE);
    const settingsJson = await store.get(SETTINGS_KEY);
    const parsed = settingsJson ? JSON.parse(settingsJson) : null;
    const settings: ShopSettings = {
      ...DEFAULT_SHOP_SETTINGS,
      ...parsed,
      communityCounters: {
        ...DEFAULT_SHOP_SETTINGS.communityCounters,
        ...(parsed?.communityCounters || {}),
      },
      sections: {
        ...DEFAULT_SHOP_SETTINGS.sections,
        ...(parsed?.sections || {}),
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching shop settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie ou acces refuse" }, { status: 401 });
    }

    const body = await request.json();
    const counters = body?.communityCounters || {};
    const sections = body?.sections || {};

    const store = getStore(SHOP_STORE);
    const existingSettingsJson = await store.get(SETTINGS_KEY);
    const existingParsed = existingSettingsJson ? JSON.parse(existingSettingsJson) : null;
    const previousSettings: ShopSettings = {
      ...DEFAULT_SHOP_SETTINGS,
      ...existingParsed,
      communityCounters: {
        ...DEFAULT_SHOP_SETTINGS.communityCounters,
        ...(existingParsed?.communityCounters || {}),
      },
      sections: {
        ...DEFAULT_SHOP_SETTINGS.sections,
        ...(existingParsed?.sections || {}),
      },
    };

    const settings: ShopSettings = {
      communityCounters: {
        productsSold: sanitizePositiveInt(counters.productsSold, previousSettings.communityCounters.productsSold),
        supporters: sanitizePositiveInt(counters.supporters, previousSettings.communityCounters.supporters),
        eventsFunded: sanitizePositiveInt(counters.eventsFunded, previousSettings.communityCounters.eventsFunded),
      },
      sections: {
        creatorsProductIds: sanitizeIds(sections.creatorsProductIds ?? previousSettings.sections.creatorsProductIds),
        dropsProductIds: sanitizeIds(sections.dropsProductIds ?? previousSettings.sections.dropsProductIds),
        goodiesProductIds: sanitizeIds(sections.goodiesProductIds ?? previousSettings.sections.goodiesProductIds),
        communityProductIds: sanitizeIds(sections.communityProductIds ?? previousSettings.sections.communityProductIds),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: admin.discordId,
    };

    await store.set(SETTINGS_KEY, JSON.stringify(settings, null, 2));

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating shop settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
