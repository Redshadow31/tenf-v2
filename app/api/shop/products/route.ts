import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';

const SHOP_STORE = 'tenf-shop';
const PRODUCTS_KEY = 'products';
const CATEGORIES_KEY = 'categories';
const SETTINGS_KEY = 'settings';

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

/**
 * GET - Récupère tous les produits (publique)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');

    const store = getStore(SHOP_STORE);
    const productsJson = await store.get(PRODUCTS_KEY);
    const categoriesJson = await store.get(CATEGORIES_KEY);
    const settingsJson = await store.get(SETTINGS_KEY);

    let products: any[] = productsJson ? JSON.parse(productsJson) : [];
    const categories: any[] = categoriesJson ? JSON.parse(categoriesJson) : [];
    const parsedSettings = settingsJson ? JSON.parse(settingsJson) : null;
    const settings: ShopSettings = {
      ...DEFAULT_SHOP_SETTINGS,
      ...parsedSettings,
      communityCounters: {
        ...DEFAULT_SHOP_SETTINGS.communityCounters,
        ...(parsedSettings?.communityCounters || {}),
      },
      sections: {
        ...DEFAULT_SHOP_SETTINGS.sections,
        ...(parsedSettings?.sections || {}),
      },
    };

    // Filtrer par catégorie si spécifié
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    // Filtrer les produits en vedette si spécifié
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }

    // Enrichir avec les informations de catégorie
    const enrichedProducts = products.map(product => {
      const category = categories.find(c => c.id === product.categoryId);
      return {
        ...product,
        category: category || null,
      };
    });

    return NextResponse.json(
      { products: enrichedProducts, categories, settings },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
