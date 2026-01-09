import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasAdminDashboardAccess } from '@/lib/adminRoles';
import { getStore } from '@netlify/blobs';
import type { ShopCategory } from '../products/route';

const SHOP_STORE = 'tenf-shop';
const CATEGORIES_KEY = 'categories';

/**
 * GET - Récupère toutes les catégories
 */
export async function GET() {
  try {
    const store = getStore(SHOP_STORE);
    const categoriesJson = await store.get(CATEGORIES_KEY);
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée une nouvelle catégorie
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "name et color sont requis" },
        { status: 400 }
      );
    }

    // Valider le format de couleur hexadécimal
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return NextResponse.json(
        { error: "Le format de couleur doit être hexadécimal (ex: #FF5733)" },
        { status: 400 }
      );
    }

    const store = getStore(SHOP_STORE);
    const categoriesJson = await store.get(CATEGORIES_KEY);
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];

    // Vérifier que le nom n'existe pas déjà
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: "Une catégorie avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Générer un ID unique
    const id = `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newCategory: ShopCategory = {
      id,
      name,
      color,
      createdAt: new Date().toISOString(),
      createdBy: admin.id,
    };

    categories.push(newCategory);

    // Sauvegarder
    await store.set(CATEGORIES_KEY, JSON.stringify(categories, null, 2));

    return NextResponse.json({ 
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour une catégorie
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id est requis" },
        { status: 400 }
      );
    }

    // Valider le format de couleur hexadécimal si fournie
    if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return NextResponse.json(
        { error: "Le format de couleur doit être hexadécimal (ex: #FF5733)" },
        { status: 400 }
      );
    }

    const store = getStore(SHOP_STORE);
    const categoriesJson = await store.get(CATEGORIES_KEY);
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];

    const categoryIndex = categories.findIndex(c => c.id === id);
    
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que le nom n'existe pas déjà (sauf pour cette catégorie)
    if (name && categories.find(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: "Une catégorie avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Mettre à jour la catégorie
    const updatedCategory: ShopCategory = {
      ...categories[categoryIndex],
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
    };

    categories[categoryIndex] = updatedCategory;

    // Sauvegarder
    await store.set(CATEGORIES_KEY, JSON.stringify(categories, null, 2));

    return NextResponse.json({ 
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une catégorie
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
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
    
    // Vérifier qu'aucun produit n'utilise cette catégorie
    const productsJson = await store.get('products');
    const products = productsJson ? JSON.parse(productsJson) : [];
    
    if (products.some((p: any) => p.categoryId === id)) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette catégorie car elle est utilisée par des produits" },
        { status: 400 }
      );
    }

    const categoriesJson = await store.get(CATEGORIES_KEY);
    const categories: ShopCategory[] = categoriesJson ? JSON.parse(categoriesJson) : [];

    const filteredCategories = categories.filter(c => c.id !== id);

    if (filteredCategories.length === categories.length) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    // Sauvegarder
    await store.set(CATEGORIES_KEY, JSON.stringify(filteredCategories, null, 2));

    return NextResponse.json({ 
      success: true,
      message: 'Catégorie supprimée'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
