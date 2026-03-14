import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

const SHOP_STORE = "tenf-shop";
const SETTINGS_KEY = "settings";

interface ShopSettings {
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

export async function GET() {
  try {
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
    console.error("Error fetching public shop settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
