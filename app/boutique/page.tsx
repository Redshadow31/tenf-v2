"use client";

import { useEffect, useMemo, useState } from "react";
import ProductModal from "@/components/ProductModal";

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  isStartingPrice?: boolean;
  sortOrder?: number;
  description: string;
  categoryId: string;
  images: string[];
  featured: boolean;
  buyUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

type PopularSortMode = "mostViewed" | "mostClicked" | "newest";

const COMMUNITY_STATS = [
  { label: "Membres", value: "560", icon: "👥" },
  { label: "Createurs", value: "220", icon: "🎮" },
  { label: "Soutien communaute", value: "100%", icon: "💜" },
];

interface ShopSettings {
  communityCounters?: {
    productsSold?: number;
    supporters?: number;
    eventsFunded?: number;
  };
  sections?: {
    creatorsProductIds?: string[];
    dropsProductIds?: string[];
    goodiesProductIds?: string[];
    communityProductIds?: string[];
  };
}

const DEFAULT_COUNTERS = {
  productsSold: 128,
  supporters: 42,
  eventsFunded: 3,
};

const DEFAULT_SECTIONS = {
  creatorsProductIds: [] as string[],
  dropsProductIds: [] as string[],
  goodiesProductIds: [] as string[],
  communityProductIds: [] as string[],
};
const DONATION_URL = "https://lydia-app.com/pots?id=10561-don-twitch-entraide";

const COLLECTIONS = [
  {
    id: "founders",
    emoji: "🔥",
    name: "Collection Fondateurs",
    description: "Red, Clara, Nexou",
    keywords: ["red", "clara", "nexou", "fondateur"],
  },
  {
    id: "community",
    emoji: "🎮",
    name: "Collection Communaute",
    description: "Logo TENF et goodies communautaires",
    keywords: ["communaute", "community", "logo", "tenf"],
  },
  {
    id: "creators",
    emoji: "⭐",
    name: "Collection Createurs",
    description: "Produits dedies aux streamers TENF",
    keywords: ["createur", "creator", "stream", "merch"],
  },
  {
    id: "goodies",
    emoji: "🎁",
    name: "Collection Goodies",
    description: "Bougies, stickers et petits objets",
    keywords: ["bougie", "sticker", "mug", "goodie"],
  },
];

function normalize(value: string): string {
  return value.toLowerCase();
}

function includesAny(haystack: string, keywords: string[]): boolean {
  const text = normalize(haystack);
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}

function isRecentProduct(product: ShopProduct): boolean {
  const rawDate = product.createdAt || product.updatedAt;
  if (!rawDate) return false;
  const date = new Date(rawDate).getTime();
  if (Number.isNaN(date)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - date <= thirtyDaysMs;
}

export default function BoutiquePage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popularMode, setPopularMode] = useState<PopularSortMode>("mostViewed");
  const [communityCounters, setCommunityCounters] = useState(DEFAULT_COUNTERS);
  const [configuredSections, setConfiguredSections] = useState(DEFAULT_SECTIONS);
  const [popularProductsFromApi, setPopularProductsFromApi] = useState<ShopProduct[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const [productsResponse, settingsResponse] = await Promise.all([
        fetch("/api/shop/products", { cache: "no-store" }),
        fetch("/api/shop/settings", { cache: "no-store" }),
      ]);
      if (!productsResponse.ok) throw new Error("Erreur lors du chargement des produits");

      const productsData = await productsResponse.json();
      setProducts(productsData.products || []);
      setCategories(productsData.categories || []);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        const settings: ShopSettings | undefined = settingsData?.settings;
        setCommunityCounters({
          productsSold: Number(settings?.communityCounters?.productsSold ?? DEFAULT_COUNTERS.productsSold),
          supporters: Number(settings?.communityCounters?.supporters ?? DEFAULT_COUNTERS.supporters),
          eventsFunded: Number(settings?.communityCounters?.eventsFunded ?? DEFAULT_COUNTERS.eventsFunded),
        });
        setConfiguredSections({
          creatorsProductIds: settings?.sections?.creatorsProductIds || [],
          dropsProductIds: settings?.sections?.dropsProductIds || [],
          goodiesProductIds: settings?.sections?.goodiesProductIds || [],
          communityProductIds: settings?.sections?.communityProductIds || [],
        });
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  const orderedProducts = [...products]
    .map((product, index) => ({
      ...product,
      __resolvedSortOrder:
        typeof product.sortOrder === "number" && Number.isFinite(product.sortOrder)
          ? product.sortOrder
          : index + 1,
    }))
    .sort((a, b) => a.__resolvedSortOrder - b.__resolvedSortOrder);

  const allProducts = orderedProducts;

  const filteredProducts = selectedCategory
    ? orderedProducts.filter((p) => p.categoryId === selectedCategory)
    : orderedProducts;

  function handleProductClick(product: ShopProduct) {
    setSelectedProduct(product);
    setIsModalOpen(true);
    void trackProductEvent(product.id, "view");
  }

  async function trackProductEvent(productId: string, event: "view" | "click") {
    try {
      await fetch(`/api/shop/products/${encodeURIComponent(productId)}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
        keepalive: true,
      });
    } catch (error) {
      console.error("Tracking failed:", error);
    }
  }

  useEffect(() => {
    async function loadPopularProducts() {
      try {
        const params = new URLSearchParams({
          mode: popularMode,
          limit: "8",
        });
        if (selectedCategory) {
          params.set("categoryId", selectedCategory);
        }

        const response = await fetch(`/api/shop/popular?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setPopularProductsFromApi(data.products || []);
      } catch (error) {
        console.error("Error loading popular products:", error);
      }
    }

    void loadPopularProducts();
  }, [popularMode, selectedCategory]);

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function discoverRandomProduct() {
    if (allProducts.length === 0) return;
    const random = allProducts[Math.floor(Math.random() * allProducts.length)];
    handleProductClick(random);
  }

  const communityProductsFallback = useMemo(() => {
    return filteredProducts
      .filter((product) => {
        const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
        return includesAny(source, ["communaute", "community", "logo", "tenf"]);
      })
      .slice(0, 5);
  }, [filteredProducts]);

  const creatorProductsFallback = useMemo(() => {
    return filteredProducts
      .filter((product) => {
        const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
        return includesAny(source, ["nexou", "clara", "red", "createur", "creator", "stream"]);
      })
      .slice(0, 5);
  }, [filteredProducts]);

  const dropsFallback = useMemo(() => {
    const filtered = filteredProducts.filter((product) => {
      const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
      return includesAny(source, ["drop", "anniversaire", "event", "edition", "limited", "hoodie"]);
    });

    if (filtered.length > 0) return filtered.slice(0, 3);
    return filteredProducts.filter((product) => isRecentProduct(product)).slice(0, 3);
  }, [filteredProducts]);

  const affordableGoodiesFallback = useMemo(() => {
    return filteredProducts.filter((product) => product.price <= 20).slice(0, 6);
  }, [filteredProducts]);

  const productsById = useMemo(() => {
    const map = new Map<string, ShopProduct>();
    for (const product of orderedProducts) map.set(product.id, product);
    return map;
  }, [orderedProducts]);

  function resolveConfiguredList(ids: string[] | undefined, fallback: ShopProduct[], limit: number) {
    const sourceIds = ids || [];
    const configured = sourceIds
      .map((id) => productsById.get(id))
      .filter((product): product is ShopProduct => Boolean(product))
      .filter((product) => !selectedCategory || product.categoryId === selectedCategory);
    if (configured.length > 0) return configured.slice(0, limit);
    return fallback.slice(0, limit);
  }

  const creatorProducts = useMemo(
    () => resolveConfiguredList(configuredSections.creatorsProductIds, creatorProductsFallback, 5),
    [configuredSections.creatorsProductIds, creatorProductsFallback, selectedCategory, productsById]
  );

  const drops = useMemo(
    () => resolveConfiguredList(configuredSections.dropsProductIds, dropsFallback, 3),
    [configuredSections.dropsProductIds, dropsFallback, selectedCategory, productsById]
  );

  const affordableGoodies = useMemo(
    () => resolveConfiguredList(configuredSections.goodiesProductIds, affordableGoodiesFallback, 6),
    [configuredSections.goodiesProductIds, affordableGoodiesFallback, selectedCategory, productsById]
  );

  const communityProducts = useMemo(
    () => resolveConfiguredList(configuredSections.communityProductIds, communityProductsFallback, 5),
    [configuredSections.communityProductIds, communityProductsFallback, selectedCategory, productsById]
  );

  const popularProducts = popularProductsFromApi.length > 0 ? popularProductsFromApi : filteredProducts.slice(0, 8);

  const seasonalLabel = useMemo(() => {
    const month = new Date().getMonth();
    if (month === 9) return "🎃 Saison Halloween TENF";
    if (month === 11) return "🎄 Saison Noel TENF";
    return "🎉 Saison anniversaire serveur";
  }, []);

  const floatingHeroProducts = useMemo(() => {
    if (allProducts.length === 0) return [];
    return allProducts.slice(0, 3);
  }, [allProducts]);

  const impactCounters = useMemo(
    () => [
      { label: "Produits vendus", value: String(communityCounters.productsSold) },
      { label: "Membres soutiens", value: String(communityCounters.supporters) },
      { label: "Evenements finances", value: String(communityCounters.eventsFunded) },
    ],
    [communityCounters]
  );

  return (
    <main
      className="p-6 min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, rgba(139,92,246,0.22) 0%, rgba(10,10,13,0.95) 40%, rgba(6,6,8,1) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-10">
        <section
          className="rounded-2xl border p-6 md:p-10 relative overflow-hidden reveal-card"
          style={{ borderColor: "rgba(139,92,246,0.55)", backgroundColor: "rgba(14,14,20,0.9)" }}
        >
          <div
            className="absolute -top-16 -right-10 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(139,92,246,0.24)" }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(220,38,38,0.18)" }}
          />

          <div className="relative z-10 space-y-6 xl:pr-64 2xl:pr-72">
            <div className="space-y-3">
              <p className="inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wide border" style={{ color: "#f2e8ff", borderColor: "rgba(139,92,246,0.6)" }}>
                BOUTIQUE TENF
              </p>
              <h1 className="text-4xl md:text-6xl font-bold" style={{ color: "#f7f5ff" }}>
                Soutenir la communaute et porter les couleurs de New Family.
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollToSection("collections")}
                className="px-5 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-[1.03]"
                style={{ backgroundColor: "#8B5CF6" }}
              >
                🛍 Decouvrir les collections
              </button>
              <button
                onClick={() => setPopularMode("newest")}
                className="px-5 py-3 rounded-lg font-semibold border transition-transform hover:scale-[1.03]"
                style={{ borderColor: "rgba(139,92,246,0.65)", color: "#e7d9ff" }}
              >
                🎁 Voir les nouveautes
              </button>
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg font-semibold border transition-transform hover:scale-[1.03]"
                style={{ borderColor: "rgba(220,38,38,0.7)", color: "#ffd7e0", backgroundColor: "rgba(220,38,38,0.14)" }}
              >
                💜 Soutenir TENF (don)
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COMMUNITY_STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border p-4 hover-scale-soft min-h-[96px]" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(20,20,28,0.9)" }}>
                  <p className="text-sm" style={{ color: "#cab7ff" }}>
                    {stat.icon} {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#ffffff" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {impactCounters.map((item) => (
                <div key={item.label} className="rounded-lg border p-3 hover-scale-soft min-h-[92px]" style={{ borderColor: "rgba(220,38,38,0.25)", backgroundColor: "rgba(30,16,20,0.65)" }}>
                  <p className="text-sm leading-snug" style={{ color: "#f5d5db" }}>
                    {item.label}
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#ffffff" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {floatingHeroProducts.length > 0 && (
            <div className="absolute right-4 top-6 z-20 hidden xl:flex flex-col gap-3 pointer-events-none">
              {floatingHeroProducts.map((product, index) => (
                <div
                  key={`hero-float-${product.id}`}
                  className="w-52 rounded-xl border p-3 backdrop-blur-sm hero-float-card"
                  style={{
                    borderColor: "rgba(139,92,246,0.45)",
                    backgroundColor: "rgba(14,14,20,0.78)",
                    animationDelay: `${index * 180}ms`,
                  }}
                >
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#c8b3ff" }}>
                    Produit soutien
                  </p>
                  <p className="text-sm font-semibold mt-1 line-clamp-2" style={{ color: "#fff" }}>
                    {product.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#d7c9f8" }}>
                    €{product.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border p-6 md:p-8 space-y-4 reveal-card" style={{ backgroundColor: "rgba(18,18,25,0.95)", borderColor: "rgba(139,92,246,0.4)" }}>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
            💜 Pourquoi soutenir TENF ?
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#cdc6de" }}>
            Quand tu portes un produit TENF, tu representes la communaute, tu aides a financer les evenements et tu soutiens les createurs.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "#cdc6de" }}>
            Chaque achat aide la communaute a grandir.
          </p>
        </section>

        <section id="collections" className="space-y-4 reveal-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
              Collections
            </h2>
            <button
              onClick={discoverRandomProduct}
              disabled={allProducts.length === 0}
              className="px-4 py-2 rounded-lg font-semibold border disabled:opacity-50"
              style={{ borderColor: "rgba(139,92,246,0.5)", color: "#e8ddff" }}
            >
              🎲 Decouvrir un produit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLLECTIONS.map((collection) => {
              const productsInCollection = filteredProducts.filter((product) => {
                const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
                return includesAny(source, collection.keywords);
              });

              return (
                <div
                  key={collection.id}
                  className="rounded-xl border p-5 min-h-[180px] flex flex-col justify-between hover-scale-soft"
                  style={{ backgroundColor: "rgba(17,17,24,0.95)", borderColor: "rgba(139,92,246,0.4)" }}
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold" style={{ color: "#c8b3ff" }}>
                      {collection.emoji} {collection.name}
                    </p>
                    <p className="text-sm" style={{ color: "#c7bfd7" }}>
                      {collection.description}
                    </p>
                  </div>
                  <p className="text-lg font-bold mt-4" style={{ color: "#fff" }}>
                    {productsInCollection.length} produit{productsInCollection.length > 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            ⭐ Les favoris de la communaute
          </h2>
          <div className="flex gap-2 flex-wrap">
            <SortButton label="Plus vus" active={popularMode === "mostViewed"} onClick={() => setPopularMode("mostViewed")} />
            <SortButton label="Plus cliques" active={popularMode === "mostClicked"} onClick={() => setPopularMode("mostClicked")} />
            <SortButton label="Plus recents" active={popularMode === "newest"} onClick={() => setPopularMode("newest")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="popular" />
            ))}
          </div>
        </section>

        <section className="space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            🎮 Produits createurs TENF
          </h2>
          {creatorProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {creatorProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="creator" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun produit createur detecte pour le moment." />
          )}
        </section>

        <section className="space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            ✨ Drops communautaires
          </h2>
          <p className="text-sm" style={{ color: "#b8b0ca" }}>
            Produits disponibles pour une duree limitee (30 jours max).
          </p>
          {drops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {drops.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="drop" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun drop detecte dans le catalogue actuel." />
          )}
        </section>

        <section className="space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            🎁 Petits goodies TENF
          </h2>
          {affordableGoodies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {affordableGoodies.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="community" />
              ))}
            </div>
          ) : (
            <EmptyState text="Pas de goodies sous 20EUR actuellement." />
          )}
        </section>

        <section className="space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Produits communaute
          </h2>
          {communityProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {communityProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="community" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun produit communaute detecte pour le moment." />
          )}
        </section>

        <section className="rounded-2xl border p-6 reveal-card" style={{ backgroundColor: "rgba(21,15,21,0.9)", borderColor: "rgba(220,38,38,0.4)" }}>
          <h3 className="text-2xl font-bold" style={{ color: "#fff" }}>
            🎉 Collection anniversaire TENF
          </h3>
          <p className="mt-2" style={{ color: "#e0d7ea" }}>
            Collection speciale evenement: mug anniversaire, hoodie evenement et editions limitees.
          </p>
          <p className="mt-3 text-sm" style={{ color: "#f2c9d4" }}>
            {seasonalLabel}
          </p>
        </section>

        <section className="rounded-2xl border p-6 space-y-4 reveal-card" style={{ backgroundColor: "rgba(16,16,24,0.95)", borderColor: "rgba(139,92,246,0.35)" }}>
          <h3 className="text-2xl font-bold" style={{ color: "#fff" }}>
            Pack fondateur
          </h3>
          <p style={{ color: "#c9c0dc" }}>
            Un pack simple pour soutenir TENF: mug + sticker + bougie.
          </p>
          <div className="flex flex-wrap gap-2">
            <PackItem label="☕ Mug" />
            <PackItem label="🏷 Sticker" />
            <PackItem label="🕯 Bougie" />
          </div>
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <section className="space-y-3 reveal-card">
            <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>
              Decouvrir
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === null ? "text-white" : ""}`}
                style={{
                  backgroundColor: selectedCategory === null ? "#8B5CF6" : "rgba(24,24,35,0.95)",
                  color: selectedCategory === null ? "white" : "#ccc2e4",
                }}
              >
                Tous
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedCategory === category.id ? "text-white" : ""}`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : "rgba(24,24,35,0.95)",
                    color: selectedCategory === category.id ? "white" : "#ccc2e4",
                    border: selectedCategory !== category.id ? `1px solid ${category.color}` : "none",
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCategory === category.id ? "white" : category.color }} />
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#8B5CF6" }} />
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className="space-y-4 reveal-card">
            <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
              Participer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState text="Aucun produit trouve dans cette categorie." />
        )}

        <section className="rounded-2xl border p-8 text-center reveal-card" style={{ backgroundColor: "rgba(16,16,23,0.95)", borderColor: "rgba(139,92,246,0.35)" }}>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
            💜 Merci a ceux qui soutiennent TENF
          </h2>
          <p className="mt-3 max-w-2xl mx-auto" style={{ color: "#ccc4de" }}>
            Chaque commande participe au developpement des projets communautaires et aux prochains evenements.
          </p>
          <div className="mt-5">
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "#dc2626" }}
            >
              💜 Faire un don TENF
            </a>
          </div>
        </section>
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

      <style jsx>{`
        .reveal-card {
          animation: revealUp 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero-float-card {
          animation: heroFloat 6s ease-in-out infinite;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.22);
        }

        .hover-scale-soft {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .hover-scale-soft:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
        }

        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </main>
  );
}

function SortButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
      style={{
        backgroundColor: active ? "#8B5CF6" : "rgba(25,25,34,0.95)",
        color: active ? "white" : "#cbc3df",
        border: active ? "1px solid #8B5CF6" : "1px solid rgba(139,92,246,0.4)",
      }}
    >
      {label}
    </button>
  );
}

function PackItem({ label }: { label: string }) {
  return (
    <span
      className="px-3 py-2 rounded-lg text-sm font-semibold"
      style={{ backgroundColor: "rgba(29,22,38,0.95)", border: "1px solid rgba(139,92,246,0.4)", color: "#ddd1f8" }}
    >
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border p-8 text-center" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(18,18,27,0.95)" }}>
      <p style={{ color: "#bfb7cf" }}>{text}</p>
    </div>
  );
}

type ProductCardEmphasis = "popular" | "creator" | "community" | "drop";

interface ProductCardProps {
  product: ShopProduct;
  onClick: (product: ShopProduct) => void;
  onTrackClick?: (productId: string, event: "view" | "click") => Promise<void> | void;
  emphasis?: ProductCardEmphasis;
}

function resolveBadges(product: ShopProduct, emphasis?: ProductCardEmphasis): string[] {
  const badges: string[] = [];
  if (product.featured || emphasis === "popular") badges.push("⭐ Favori");
  if (emphasis === "drop" || isRecentProduct(product)) badges.push("🔥 Populaire");
  if (emphasis === "creator") badges.push("🎮 Createur");
  if (emphasis === "community") badges.push("💜 Communaute");
  return badges.slice(0, 2);
}

function ProductCard({ product, onClick, onTrackClick, emphasis }: ProductCardProps) {
  const categoryColor = product.category?.color || "#8B5CF6";
  const mainImage = product.images[0] || "";
  const priceLabel = `${product.isStartingPrice ? "A partir de " : ""}€${product.price.toFixed(2)}`;
  const badges = resolveBadges(product, emphasis);

  return (
    <article
      className="group rounded-xl overflow-hidden transition-all cursor-pointer hover:-translate-y-1"
      style={{
        backgroundColor: "rgba(18,18,26,0.98)",
        border: `1px solid ${categoryColor}`,
        boxShadow: "0 0 0 rgba(139,92,246,0)",
      }}
      onClick={() => onClick(product)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 24px rgba(139,92,246,0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 rgba(139,92,246,0)";
      }}
    >
      <div className="aspect-square w-full relative overflow-hidden" style={{ backgroundColor: "rgba(26,26,36,0.95)" }}>
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "#aaa0be" }}>
            <span className="text-sm">Aucune image</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {badges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {badges.map((badge) => (
              <span key={`${product.id}-${badge}`} className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "rgba(139,92,246,0.2)", color: "#dfd3ff" }}>
                {badge}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-base font-semibold line-clamp-2" style={{ color: "#ffffff" }}>
          {product.name}
        </h3>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-lg font-bold" style={{ color: "#c7adff" }}>
              {priceLabel}
            </p>
            <p className="text-xs font-semibold" style={{ color: "#eec7d2" }}>
              💜 Soutien communaute
            </p>
          </div>

          <a
            href={product.buyUrl || "#"}
            target={product.buyUrl ? "_blank" : undefined}
            rel={product.buyUrl ? "noopener noreferrer" : undefined}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white text-center min-w-[120px]"
            style={{ backgroundColor: "#8B5CF6" }}
            onClick={(e) => {
              e.stopPropagation();
              void onTrackClick?.(product.id, "click");
              if (!product.buyUrl) onClick(product);
            }}
          >
            <span className="inline group-hover:hidden">🛍 Ajouter</span>
            <span className="hidden group-hover:inline">🛍 Soutenir TENF</span>
          </a>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "#b8afcc" }}>
          Ce produit soutient directement les projets de la communaute TENF.
        </p>
      </div>
    </article>
  );
}