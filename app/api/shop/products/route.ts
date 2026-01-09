import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';

const SHOP_STORE = 'tenf-shop';
const PRODUCTS_KEY = 'products';
const CATEGORIES_KEY = 'categories';

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

    let products: any[] = productsJson ? JSON.parse(productsJson) : [];
    const categories: any[] = categoriesJson ? JSON.parse(categoriesJson) : [];

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

    return NextResponse.json({ products: enrichedProducts, categories });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
