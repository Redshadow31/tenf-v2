import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getStore } from '@netlify/blobs';

const SHOP_STORE = 'tenf-shop';
const PRODUCTS_KEY = 'products';
const CATEGORIES_KEY = 'categories';
const SETTINGS_KEY = 'settings';

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

export interface ShopCategory {
  id: string;
  name: string;
  color: string; // Hex color code
  createdAt: string;
  createdBy: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  isStartingPrice?: boolean; // Si true, afficher "A partir de"
  sortOrder?: number; // Ordre d'affichage dans la boutique
  description: string;
  categoryId: string;
  images: string[]; // Array of image URLs (up to 6)
  featured: boolean;
  buyUrl?: string; // URL personnalisée pour le bouton "Acheter" (optionnel)
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * GET - Récupère tous les produits
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

    let products: ShopProduct[] = productsJson ? JSON.parse(productsJson) : [];
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];
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

    return NextResponse.json({ products: enrichedProducts, categories, settings });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée un nouveau produit
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, description, categoryId, images, featured, buyUrl, isStartingPrice, sortOrder } = body;

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: "name, price et categoryId sont requis" },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Au moins une image est requise" },
        { status: 400 }
      );
    }

    if (images.length > 6) {
      return NextResponse.json(
        { error: "Maximum 6 images autorisées" },
        { status: 400 }
      );
    }

    const store = getStore(SHOP_STORE);
    const productsJson = await store.get(PRODUCTS_KEY);
    const products: ShopProduct[] = productsJson ? JSON.parse(productsJson) : [];

    // Vérifier que la catégorie existe
    const categoriesJson = await store.get(CATEGORIES_KEY);
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];
    
    if (!categories.find(c => c.id === categoryId)) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 400 }
      );
    }

    // Générer un ID unique
    const id = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const parsedSortOrder = Number.parseInt(String(sortOrder), 10);
    const maxSortOrder = products.reduce((max, product, index) => {
      const currentOrder =
        typeof product.sortOrder === "number" && Number.isFinite(product.sortOrder)
          ? product.sortOrder
          : index + 1;
      return Math.max(max, currentOrder);
    }, 0);

    const newProduct: ShopProduct = {
      id,
      name,
      price: parseFloat(price),
      isStartingPrice: isStartingPrice === true,
      sortOrder: Number.isFinite(parsedSortOrder) && parsedSortOrder > 0 ? parsedSortOrder : maxSortOrder + 1,
      description: description || '',
      categoryId,
      images,
      featured: featured === true,
      buyUrl: buyUrl || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: admin.discordId,
    };

    products.push(newProduct);

    // Sauvegarder
    await store.set(PRODUCTS_KEY, JSON.stringify(products, null, 2));

    return NextResponse.json({ 
      success: true,
      product: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour un produit
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, price, description, categoryId, images, featured, buyUrl, isStartingPrice, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id est requis" },
        { status: 400 }
      );
    }

    const store = getStore(SHOP_STORE);
    const productsJson = await store.get(PRODUCTS_KEY);
    const products: ShopProduct[] = productsJson ? JSON.parse(productsJson) : [];

    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la catégorie existe si elle est fournie
    if (categoryId) {
      const categoriesJson = await store.get(CATEGORIES_KEY);
      const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];
      
      if (!categories.find(c => c.id === categoryId)) {
        return NextResponse.json(
          { error: "Catégorie introuvable" },
          { status: 400 }
        );
      }
    }

    const parsedSortOrder = Number.parseInt(String(sortOrder), 10);

    // Mettre à jour le produit
    const updatedProduct: ShopProduct = {
      ...products[productIndex],
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && { categoryId }),
      ...(images !== undefined && { images: images.length > 6 ? images.slice(0, 6) : images }),
      ...(featured !== undefined && { featured }),
      ...(buyUrl !== undefined && { buyUrl: buyUrl || undefined }),
      ...(isStartingPrice !== undefined && { isStartingPrice: isStartingPrice === true }),
      ...(sortOrder !== undefined &&
        Number.isFinite(parsedSortOrder) &&
        parsedSortOrder > 0 && { sortOrder: parsedSortOrder }),
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;

    // Sauvegarder
    await store.set(PRODUCTS_KEY, JSON.stringify(products, null, 2));

    return NextResponse.json({ 
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un produit
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "id est requis" },
        { status: 400 }
      );
    }

    const store = getStore(SHOP_STORE);
    const productsJson = await store.get(PRODUCTS_KEY);
    const products: ShopProduct[] = productsJson ? JSON.parse(productsJson) : [];

    const filteredProducts = products.filter(p => p.id !== id);

    if (filteredProducts.length === products.length) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Sauvegarder
    await store.set(PRODUCTS_KEY, JSON.stringify(filteredProducts, null, 2));

    return NextResponse.json({ 
      success: true,
      message: 'Produit supprimé'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
