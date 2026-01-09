"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductModal from "@/components/ProductModal";

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  images: string[];
  featured: boolean;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export default function BoutiquePage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/shop/products");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const featuredProducts = products.filter((p) => p.featured);
  const regularProducts = filteredProducts.filter((p) => !p.featured);

  function handleProductClick(product: ShopProduct) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>BOUTIQUE TENF</h1>
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-primary)' }}>MERCH OFFICIEL</p>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Soutiens la communauté et porte les couleurs de la New Family
          </p>
        </div>

        {/* Message "Pourquoi cette boutique existe ?" */}
        <div className="rounded-lg border p-6 space-y-4" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            💜 Pourquoi cette boutique existe ?
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Chaque achat soutient directement :
          </p>
          <ul className="list-disc list-inside space-y-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            <li>le projet New Family Aventura 2026</li>
            <li>le financement des bots et outils du serveur</li>
            <li>les futurs giveaways communautaires</li>
            <li>l'amélioration continue de notre espace TENF</li>
          </ul>
          <p className="text-base leading-relaxed pt-2" style={{ color: 'var(--color-text)' }}>
            Tout cela nous permet de continuer à construire une communauté vivante et dynamique.
          </p>
        </div>

        {/* Promotion */}
        <div className="rounded-lg border p-6 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: '#10b981' }}>
          <p className="text-xl font-semibold mb-2" style={{ color: '#10b981' }}>
            🎉 Promotion limitée !
          </p>
          <p className="text-lg" style={{ color: 'var(--color-text)' }}>
            5 produits pour 100€ avec le code <strong className="font-bold" style={{ color: 'var(--color-primary)' }}>TENF5</strong>
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === null ? "text-white" : ""
              }`}
              style={{
                backgroundColor: selectedCategory === null ? "var(--color-primary)" : "var(--color-surface)",
                color: selectedCategory === null ? "white" : "var(--color-text-secondary)",
              }}
            >
              Tous
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id ? "text-white" : ""
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : "var(--color-surface)",
                  color: selectedCategory === category.id ? "white" : "var(--color-text-secondary)",
                  border: selectedCategory !== category.id ? `2px solid ${category.color}` : "none",
                }}
              >
                <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedCategory === category.id ? "white" : category.color }} />
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          </div>
        ) : (
          <>
            {/* Section PRODUITS EN AVANT */}
            {featuredProducts.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>PRODUITS EN AVANT</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onClick={handleProductClick} featured />
                  ))}
                </div>
              </section>
            )}

            {/* Section PRODUITS */}
            {regularProducts.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>PRODUITS</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {regularProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onClick={handleProductClick} />
                  ))}
                </div>
              </section>
            )}

            {/* No Products */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  Aucun produit trouvé{selectedCategory ? " dans cette catégorie" : ""}.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </main>
  );
}

interface ProductCardProps {
  product: ShopProduct;
  onClick: (product: ShopProduct) => void;
  featured?: boolean;
}

function ProductCard({ product, onClick, featured = false }: ProductCardProps) {
  const categoryColor = product.category?.color || "#8B5CF6";
  const mainImage = product.images[0] || "";

  return (
    <div
      className="rounded-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: "var(--color-card)",
        border: `2px solid ${categoryColor}`,
      }}
      onClick={() => onClick(product)}
    >
      {/* Image du produit */}
      <div className="aspect-square w-full relative" style={{ backgroundColor: "var(--color-surface)" }}>
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
            <span className="text-sm">Aucune image</span>
          </div>
        )}
      </div>

      {/* Informations du produit */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold line-clamp-1" style={{ color: "var(--color-text)" }}>
          {product.name}
        </h3>
        {featured && (
          <p className="text-sm line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
            €{product.price.toFixed(2)}
          </span>
          <Link
            href={`/boutique/${product.id}`}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-colors text-center"
            style={{ backgroundColor: "var(--color-primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Acheter
          </Link>
        </div>
      </div>
    </div>
  );
}