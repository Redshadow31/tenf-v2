"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductModal from "@/components/ProductModal";
import { ExternalLink, Search, ArrowUpDown, Sparkles, HeartHandshake } from "lucide-react";

interface ShopCategory {
  id: string;
  name: string;
  color: string;
}

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  images: string[];
  featured: boolean;
  buyUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: ShopCategory | null;
}

type SortMode = "relevance" | "price_asc" | "price_desc" | "newest";

const FOURTHWALL_ALL_PRODUCTS_URL =
  "https://twitch-entraide-new-family-shop.fourthwall.com/en-eur/collections/all";

function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - ts <= THIRTY_DAYS_MS;
}

export default function Boutique2Page() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/shop/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Erreur lors du chargement des produits");
        const data = await response.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur serveur");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const latestUpdateText = useMemo(() => {
    const dates = products
      .map((p) => p.updatedAt || p.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime())
      .filter((n) => !Number.isNaN(n));
    if (dates.length === 0) return "Mise a jour locale indisponible";
    const latest = new Date(Math.max(...dates));
    return `Mise a jour locale: ${latest.toLocaleDateString("fr-FR")} ${latest.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [products]);

  const catalogStats = useMemo(() => {
    const featuredCount = products.filter((p) => p.featured).length;
    const newCount = products.filter((p) => isNewProduct(p.createdAt)).length;
    return {
      productsCount: products.length,
      categoriesCount: categories.length,
      featuredCount,
      newCount,
    };
  }, [products, categories]);

  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => {
        const haystack = `${p.name} ${p.description} ${p.category?.name || ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    switch (sortMode) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }

    return list;
  }, [products, selectedCategory, query, sortMode]);

  const topHighlights = useMemo(() => {
    const featured = filteredAndSorted.filter((p) => p.featured).slice(0, 6);
    if (featured.length > 0) return featured;
    return filteredAndSorted.slice(0, 6);
  }, [filteredAndSorted]);

  function openProduct(product: ShopProduct) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--color-primary)" }}>
                BOUTIQUE2 - VERSION TEST
              </p>
              <h1 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--color-text)" }}>
                Boutique TENF
              </h1>
              <p className="text-base md:text-lg max-w-3xl" style={{ color: "var(--color-text-secondary)" }}>
                Cette boutique aide a financer le site, les bots, les outils du serveur et les projets communautaires.
              </p>
            </div>

            <a
              href={FOURTHWALL_ALL_PRODUCTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Voir le catalogue complet
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <KpiCard label="Produits visibles" value={String(catalogStats.productsCount)} />
            <KpiCard label="Categories" value={String(catalogStats.categoriesCount)} />
            <KpiCard label="Produits en avant" value={String(catalogStats.featuredCount)} />
            <KpiCard label="Nouveautes (30j)" value={String(catalogStats.newCount)} />
          </div>

          <div className="mt-4 text-xs md:text-sm flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
            <HeartHandshake className="w-4 h-4" />
            <span>{latestUpdateText}</span>
          </div>
        </header>

        <section className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit, une categorie..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <option value="relevance">Pertinence</option>
                <option value="newest">Nouveautes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
              label="Toutes les categories"
              color="var(--color-primary)"
            />
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                active={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                label={cat.name}
                color={cat.color}
              />
            ))}
          </div>
        </section>

        {!loading && topHighlights.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
              <Sparkles className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
              Selection rapide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topHighlights.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={openProduct} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Produits
            </h2>
            <a
              href={FOURTHWALL_ALL_PRODUCTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              Catalogue complet Fourthwall
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--color-primary)" }} />
            </div>
          ) : error ? (
            <div className="rounded-lg border p-4" style={{ borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,0.08)", color: "var(--color-text)" }}>
              {error}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="rounded-lg border p-8 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p style={{ color: "var(--color-text-secondary)" }}>Aucun produit ne correspond a tes filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {filteredAndSorted.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={openProduct} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
            Transparence et soutien
          </h3>
          <p className="text-sm md:text-base mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Les achats sont traites via la boutique officielle Fourthwall. Chaque commande contribue au financement des services TENF.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={FOURTHWALL_ALL_PRODUCTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Acheter sur la boutique officielle
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link href="/boutique" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Revenir a la boutique actuelle
            </Link>
          </div>
        </section>
      </div>

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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="text-xl font-bold mt-1" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity"
      style={{
        backgroundColor: active ? color : "var(--color-surface)",
        color: active ? "white" : "var(--color-text-secondary)",
        border: active ? "none" : `1px solid ${color}`,
      }}
    >
      {label}
    </button>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: ShopProduct;
  onOpen: (product: ShopProduct) => void;
}) {
  const mainImage = product.images[0];
  const categoryColor = product.category?.color || "#8B5CF6";
  const isNew = isNewProduct(product.createdAt);

  return (
    <article
      className="rounded-xl overflow-hidden border transition-transform hover:scale-[1.01]"
      style={{ backgroundColor: "var(--color-card)", borderColor: categoryColor }}
    >
      <button onClick={() => onOpen(product)} className="w-full text-left">
        <div className="aspect-square w-full" style={{ backgroundColor: "var(--color-surface)" }}>
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Image indisponible
            </div>
          )}
        </div>
      </button>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {product.featured && (
            <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
              En avant
            </span>
          )}
          {isNew && (
            <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#10b981", color: "white" }}>
              Nouveau
            </span>
          )}
          {product.category?.name && (
            <span
              className="text-[11px] px-2 py-1 rounded-full font-semibold"
              style={{ border: `1px solid ${categoryColor}`, color: "var(--color-text-secondary)" }}
            >
              {product.category.name}
            </span>
          )}
        </div>

        <button onClick={() => onOpen(product)} className="text-left w-full">
          <h3 className="text-base font-semibold line-clamp-2" style={{ color: "var(--color-text)" }}>
            {product.name}
          </h3>
        </button>

        <p className="text-sm line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
          {product.description || "Aucune description"}
        </p>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
            €{product.price.toFixed(2)}
          </p>
          <a
            href={product.buyUrl || FOURTHWALL_ALL_PRODUCTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Acheter
          </a>
        </div>
      </div>
    </article>
  );
}

