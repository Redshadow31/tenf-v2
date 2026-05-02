"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Gift,
  HeartHandshake,
  LayoutDashboard,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductModal from "@/components/ProductModal";

const NAV_ITEMS = [
  { id: "boutique-hero", label: "Accueil" },
  { id: "boutique-why", label: "Pourquoi" },
  { id: "boutique-collections", label: "Collections" },
  { id: "boutique-popular", label: "Favoris" },
  { id: "boutique-creators", label: "Créateurs" },
  { id: "boutique-drops", label: "Drops" },
  { id: "boutique-goodies", label: "Goodies" },
  { id: "boutique-community", label: "Communauté" },
  { id: "boutique-catalog", label: "Catalogue" },
  { id: "boutique-faq", label: "FAQ" },
] as const;

const FAQ_ITEMS = [
  {
    q: "La boutique est-elle obligatoire pour être membre TENF ?",
    a: "Non. TENF reste une communauté d’entraide ; le merch est une façon optionnelle de soutenir les projets et de porter les couleurs de la New Family.",
  },
  {
    q: "Où va l’argent des achats ?",
    a: "Les produits listés renvoient vers la boutique opérationnelle (ex. Fourthwall). Les montants contribuent au financement du site, des outils, bots et événements — comme expliqué sur la page Soutenir TENF.",
  },
  {
    q: "Je suis membre : lien avec les points TENF ?",
    a: "Les points et la boutique « progression » (Spotlight, etc.) sont décrits dans le fonctionnement TENF. Cette page merch est distincte : pense à vérifier les deux selon ce que tu cherches.",
  },
  {
    q: "Comment trouver un article rapidement ?",
    a: "Utilise la recherche catalogue, les filtres par catégorie, ou touche une collection : la grille du bas se filtre automatiquement sur ces univers.",
  },
];

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
  { label: "Créateurs", value: "220", icon: "🎮" },
  { label: "Soutien communauté", value: "100%", icon: "💜" },
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
    name: "Collection Communauté",
    description: "Logo TENF et goodies communautaires",
    keywords: ["communaute", "community", "logo", "tenf"],
  },
  {
    id: "creators",
    emoji: "⭐",
    name: "Collection Créateurs",
    description: "Produits dédiés aux streamers TENF",
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

function matchesCatalogSearch(product: ShopProduct, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const blob = `${product.name} ${product.description} ${product.category?.name || ""}`.toLowerCase();
  return blob.includes(t);
}

function productMatchesCollection(product: ShopProduct, collectionId: string | null): boolean {
  if (!collectionId) return true;
  const col = COLLECTIONS.find((c) => c.id === collectionId);
  if (!col) return true;
  const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
  return includesAny(source, col.keywords);
}

export default function BoutiquePageClient() {
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
  const [audience, setAudience] = useState<"public" | "member">("public");
  const [activeNav, setActiveNav] = useState<string>(NAV_ITEMS[0].id);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [collectionFilterId, setCollectionFilterId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const skipSpyUntil = useRef(0);

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

  const displayCatalogProducts = useMemo(
    () =>
      filteredProducts.filter(
        (p) => matchesCatalogSearch(p, catalogSearch) && productMatchesCollection(p, collectionFilterId)
      ),
    [filteredProducts, catalogSearch, collectionFilterId]
  );

  const navIds = useMemo(() => NAV_ITEMS.map((n) => n.id), []);

  const updateSpy = useCallback(() => {
    if (typeof window === "undefined") return;
    if (Date.now() < skipSpyUntil.current) return;
    const marker = window.scrollY + 130;
    let current = navIds[0];
    for (const id of navIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = id;
    }
    setActiveNav(current);
  }, [navIds]);

  useEffect(() => {
    updateSpy();
    window.addEventListener("scroll", updateSpy, { passive: true });
    window.addEventListener("resize", updateSpy, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateSpy);
      window.removeEventListener("resize", updateSpy);
    };
  }, [updateSpy]);

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
    skipSpyUntil.current = Date.now() + 650;
    setActiveNav(sectionId);
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
    if (month === 11) return "🎄 Saison Noël TENF";
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
      { label: "Événements financés", value: String(communityCounters.eventsFunded) },
    ],
    [communityCounters]
  );

  const activeCollection = collectionFilterId ? COLLECTIONS.find((c) => c.id === collectionFilterId) : null;

  return (
    <main
      className="relative min-h-screen overflow-hidden p-4 sm:p-6"
      style={{
        background:
          "radial-gradient(circle at 18% 0%, rgba(139,92,246,0.2) 0%, rgba(10,10,13,0.96) 45%, rgba(6,6,8,1) 100%)",
      }}
    >
      <div className="boutique-bg-mesh pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="boutique-bg-glow boutique-bg-glow-a pointer-events-none absolute -left-32 top-40 -z-10 h-72 w-72 rounded-full blur-3xl opacity-40" aria-hidden />
      <div className="boutique-bg-glow boutique-bg-glow-b pointer-events-none absolute -right-24 bottom-32 -z-10 h-80 w-80 rounded-full blur-3xl opacity-35" aria-hidden />

      <div className="mx-auto max-w-7xl space-y-10">
        <section
          id="boutique-hero"
          className="scroll-mt-28 rounded-2xl border p-6 md:p-10 relative overflow-hidden reveal-card"
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
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border" style={{ color: "#f2e8ff", borderColor: "rgba(139,92,246,0.6)" }}>
                <ShoppingBag className="h-3.5 w-3.5 opacity-90" aria-hidden />
                BOUTIQUE TENF · Merch officiel
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight" style={{ color: "#f7f5ff" }}>
                Soutenir la communauté et porter les couleurs de la New Family.
              </h1>
              <p className="max-w-2xl text-base md:text-lg leading-relaxed" style={{ color: "#c9bddc" }}>
                Une vitrine vivante : collections, favoris, petits prix — pensée pour les curieux comme pour les membres qui veulent financer les projets TENF tout en s&apos;équipant.
              </p>
            </div>

            <div
              className="inline-flex rounded-xl border p-1"
              style={{ borderColor: "rgba(139,92,246,0.45)", backgroundColor: "rgba(8,8,14,0.65)" }}
              role="tablist"
              aria-label="Profil visiteur"
            >
              <button
                type="button"
                role="tab"
                aria-selected={audience === "public"}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: audience === "public" ? "#8B5CF6" : "transparent",
                  color: audience === "public" ? "white" : "#b9aacf",
                }}
                onClick={() => setAudience("public")}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Grand public
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === "member"}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: audience === "member" ? "#8B5CF6" : "transparent",
                  color: audience === "member" ? "white" : "#b9aacf",
                }}
                onClick={() => setAudience("member")}
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" aria-hidden />
                  Membre TENF
                </span>
              </button>
            </div>

            <div className="rounded-xl border px-4 py-3 md:px-5" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(12,12,18,0.75)" }}>
              {audience === "public" ? (
                <p className="text-sm leading-relaxed" style={{ color: "#cdc6de" }}>
                  <strong style={{ color: "#f7f5ff" }}>Tu découvres TENF :</strong> parcours les collections, ouvre une fiche produit pour les photos et le lien d&apos;achat sécurisé (boutique partenaire).
                </p>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "#cdc6de" }}>
                  <strong style={{ color: "#f7f5ff" }}>Tu es dans la commu :</strong> combine recherche + filtres catégorie ; les points &quot;boutique progression&quot; (Spotlight…) sont détaillés dans le fonctionnement TENF — lien ci-dessous.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToSection("boutique-collections")}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-transform min-h-[44px]"
                style={{ backgroundColor: "#8B5CF6" }}
              >
                <Gift className="h-4 w-4 shrink-0" aria-hidden />
                Découvrir les collections
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopularMode("newest");
                  scrollToSection("boutique-popular");
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-lg font-semibold border transition-transform min-h-[44px]"
                style={{ borderColor: "rgba(139,92,246,0.65)", color: "#e7d9ff" }}
              >
                Voir les nouveautés
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("boutique-catalog")}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold border min-h-[44px]"
                style={{ borderColor: "rgba(167,139,250,0.55)", color: "#e8ddff" }}
              >
                Catalogue complet
                <ArrowDown className="h-4 w-4 opacity-80" aria-hidden />
              </button>
              <Link
                href="/soutenir-tenf"
                className="w-full sm:w-auto px-5 py-3 rounded-lg font-semibold border transition-transform min-h-[44px] text-center flex flex-col items-center justify-center gap-0.5 leading-tight"
                style={{ borderColor: "rgba(167,139,250,0.65)", color: "#f0e8ff", backgroundColor: "rgba(139,92,246,0.18)" }}
              >
                <span className="inline-flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
                  Soutenir TENF
                </span>
                <span className="text-xs font-normal opacity-90">Don libre pour la communauté</span>
              </Link>
              {audience === "member" ? (
                <>
                  <Link
                    href="/member/dashboard"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold min-h-[44px] text-white"
                    style={{ backgroundColor: "#6d28d9" }}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                    Espace membre
                  </Link>
                  <Link
                    href="/fonctionnement-tenf/progression"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold border min-h-[44px]"
                    style={{ borderColor: "rgba(139,92,246,0.45)", color: "#dccbf5" }}
                  >
                    Points &amp; progression
                    <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
                  </Link>
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 gap-3">
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

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 gap-3">
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
            <div className="absolute right-4 top-6 z-20 hidden xl:flex flex-col gap-3">
              {floatingHeroProducts.map((product, index) => (
                <button
                  key={`hero-float-${product.id}`}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="w-52 rounded-xl border p-3 text-left backdrop-blur-sm hero-float-card transition-transform hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(139,92,246,0.45)",
                    backgroundColor: "rgba(14,14,20,0.82)",
                    animationDelay: `${index * 180}ms`,
                  }}
                >
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#c8b3ff" }}>
                    Aperçu — clic pour ouvrir
                  </p>
                  <p className="text-sm font-semibold mt-1 line-clamp-2" style={{ color: "#fff" }}>
                    {product.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#d7c9f8" }}>
                    €{product.price.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <nav
          className="sticky top-3 z-30 flex gap-1 overflow-x-auto rounded-2xl border px-2 py-2 shadow-lg backdrop-blur-md sm:top-4"
          style={{
            borderColor: "rgba(139,92,246,0.35)",
            backgroundColor: "rgba(12,12,18,0.82)",
          }}
          aria-label="Sections boutique"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm"
              style={{
                backgroundColor: activeNav === item.id ? "#8B5CF6" : "transparent",
                color: activeNav === item.id ? "white" : "#c4b5dc",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section
          id="boutique-why"
          className="scroll-mt-28 rounded-2xl border p-6 md:p-8 space-y-6 reveal-card"
          style={{ backgroundColor: "rgba(18,18,25,0.95)", borderColor: "rgba(139,92,246,0.4)" }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
              Pourquoi soutenir TENF avec le merch ?
            </h2>
            <p className="mt-3 text-base leading-relaxed max-w-3xl" style={{ color: "#cdc6de" }}>
              Quand tu portes un produit TENF, tu représentes la communauté, tu aides à financer événements et outils, et tu soutiens les créateurs visibles dans les collections dédiées.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Projets & infra",
                text: "Une partie du flux contribue au site, aux bots et aux temps forts organisés pour les membres.",
                emoji: "🛠️",
              },
              {
                title: "Visibilité créateurs",
                text: "Les lignes créateurs mettent en avant des streamers de la New Family — identité commune, pas une obligation d’achat.",
                emoji: "🎮",
              },
              {
                title: "100 % optionnel",
                text: "Rejoindre TENF ne passe pas par la caisse : le merch est un soutien supplémentaire pour celles et ceux qui le souhaitent.",
                emoji: "💜",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border p-5 hover-scale-soft"
                style={{ borderColor: "rgba(139,92,246,0.32)", backgroundColor: "rgba(14,14,22,0.9)" }}
              >
                <p className="text-2xl" aria-hidden>
                  {card.emoji}
                </p>
                <h3 className="mt-2 font-semibold" style={{ color: "#f7f5ff" }}>
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#b8afc7" }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="boutique-collections" className="scroll-mt-28 space-y-4 reveal-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                Collections
              </h2>
              <p className="mt-1 text-sm max-w-xl" style={{ color: "#a89bc4" }}>
                Touche une carte pour filtrer le catalogue du bas sur cet univers (combinable avec la recherche et les catégories).
              </p>
            </div>
            <button
              type="button"
              onClick={discoverRandomProduct}
              disabled={allProducts.length === 0}
              className="px-4 py-2 rounded-lg font-semibold border disabled:opacity-50 min-h-[44px]"
              style={{ borderColor: "rgba(139,92,246,0.5)", color: "#e8ddff" }}
            >
              🎲 Produit au hasard
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLLECTIONS.map((collection) => {
              const productsInCollection = filteredProducts.filter((product) => {
                const source = `${product.name} ${product.description} ${product.category?.name || ""}`;
                return includesAny(source, collection.keywords);
              });
              const selected = collectionFilterId === collection.id;

              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => {
                    setCollectionFilterId((prev) => (prev === collection.id ? null : collection.id));
                    scrollToSection("boutique-catalog");
                  }}
                  className="rounded-xl border p-5 min-h-[180px] flex flex-col justify-between text-left hover-scale-soft transition-shadow"
                  style={{
                    backgroundColor: selected ? "rgba(139,92,246,0.22)" : "rgba(17,17,24,0.95)",
                    borderColor: selected ? "rgba(167,139,250,0.85)" : "rgba(139,92,246,0.4)",
                    boxShadow: selected ? "0 0 0 2px rgba(139,92,246,0.35)" : undefined,
                  }}
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold" style={{ color: "#c8b3ff" }}>
                      {collection.emoji} {collection.name}
                    </p>
                    <p className="text-sm" style={{ color: "#c7bfd7" }}>
                      {collection.description}
                    </p>
                  </div>
                  <p className="text-lg font-bold mt-4 flex items-center justify-between gap-2" style={{ color: "#fff" }}>
                    <span>
                      {productsInCollection.length} produit{productsInCollection.length > 1 ? "s" : ""}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="boutique-popular" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Les favoris de la communauté
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>*]:snap-start sm:flex-wrap sm:overflow-visible">
            <SortButton label="Plus vus" active={popularMode === "mostViewed"} onClick={() => setPopularMode("mostViewed")} />
            <SortButton label="Plus cliqués" active={popularMode === "mostClicked"} onClick={() => setPopularMode("mostClicked")} />
            <SortButton label="Plus récents" active={popularMode === "newest"} onClick={() => setPopularMode("newest")} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="popular" />
            ))}
          </div>
        </section>

        <section id="boutique-creators" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Produits créateurs TENF
          </h2>
          {creatorProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {creatorProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="creator" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun produit créateur détecté pour le moment." />
          )}
        </section>

        <section id="boutique-drops" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Drops communautaires
          </h2>
          <p className="text-sm" style={{ color: "#b8b0ca" }}>
            Éditions limitées ou fenêtres courtes — détection automatique par mots-clés ou nouveautés récentes.
          </p>
          {drops.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {drops.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="drop" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun drop détecté dans le catalogue actuel." />
          )}
        </section>

        <section id="boutique-goodies" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Petits goodies TENF
          </h2>
          {affordableGoodies.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {affordableGoodies.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="community" />
              ))}
            </div>
          ) : (
            <EmptyState text="Pas de goodies sous 20 € pour l’instant." />
          )}
        </section>

        <section id="boutique-community" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Produits communauté
          </h2>
          {communityProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {communityProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} emphasis="community" />
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun produit « communauté » détecté pour le moment." />
          )}
        </section>

        <section className="rounded-2xl border p-6 reveal-card" style={{ backgroundColor: "rgba(21,15,21,0.9)", borderColor: "rgba(220,38,38,0.4)" }}>
          <h3 className="text-2xl font-bold" style={{ color: "#fff" }}>
            Collection anniversaire TENF
          </h3>
          <p className="mt-2" style={{ color: "#e0d7ea" }}>
            Collection spéciale événement : mug anniversaire, hoodie et éditions limitées selon les campagnes.
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
            Un pack simple pour soutenir TENF : mug + sticker + bougie (à composer depuis le catalogue selon disponibilités).
          </p>
          <div className="flex flex-wrap gap-2">
            <PackItem label="☕ Mug" />
            <PackItem label="🏷 Sticker" />
            <PackItem label="🕯 Bougie" />
          </div>
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <section id="boutique-discover" className="scroll-mt-28 space-y-3 reveal-card">
            <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>
              Filtrer par catégorie
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>button]:snap-start sm:flex-wrap sm:overflow-visible">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors min-h-[42px] ${selectedCategory === null ? "text-white" : ""}`}
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
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 min-h-[42px] ${selectedCategory === category.id ? "text-white" : ""}`}
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

        <section id="boutique-catalog" className="scroll-mt-28 space-y-5 reveal-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                Catalogue complet
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: "#a89bc4" }}>
                Recherche instantanée sur le nom, la description et la catégorie. Combine avec les filtres ci-dessus et une collection pour affiner.
              </p>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/70" aria-hidden />
              <input
                type="search"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                style={{
                  borderColor: "rgba(139,92,246,0.45)",
                  backgroundColor: "rgba(14,14,22,0.95)",
                  color: "#f7f5ff",
                }}
                aria-label="Recherche catalogue"
              />
              {catalogSearch ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2"
                  style={{ color: "#b9aacf" }}
                  aria-label="Effacer la recherche"
                  onClick={() => setCatalogSearch("")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {activeCollection ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(139,92,246,0.4)", backgroundColor: "rgba(139,92,246,0.12)" }}>
              <span className="text-sm font-medium" style={{ color: "#e8ddff" }}>
                Collection active : {activeCollection.emoji} {activeCollection.name}
              </span>
              <button
                type="button"
                className="ml-auto rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}
                onClick={() => setCollectionFilterId(null)}
              >
                Retirer le filtre
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#8B5CF6" }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState text="Aucun produit dans cette catégorie pour le moment." />
          ) : displayCatalogProducts.length === 0 ? (
            <div className="rounded-xl border p-8 text-center space-y-4" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(18,18,27,0.95)" }}>
              <p style={{ color: "#bfb7cf" }}>Aucun résultat pour cette recherche ou cette collection.</p>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#8B5CF6" }}
                onClick={() => {
                  setCatalogSearch("");
                  setCollectionFilterId(null);
                }}
              >
                Réinitialiser recherche &amp; collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-5 gap-5">
              {displayCatalogProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} onTrackClick={trackProductEvent} />
              ))}
            </div>
          )}
        </section>

        <section id="boutique-faq" className="scroll-mt-28 space-y-4 reveal-card">
          <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
            Questions fréquentes
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(16,16,24,0.92)" }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={open}
                    onClick={() => setOpenFaq((prev) => (prev === i ? null : i))}
                  >
                    <span className="font-semibold pr-2" style={{ color: "#f7f5ff" }}>
                      {item.q}
                    </span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 transition-transform"
                      style={{ color: "#c4b5dc", transform: open ? "rotate(180deg)" : undefined }}
                      aria-hidden
                    />
                  </button>
                  {open ? (
                    <div className="border-t px-5 pb-5 pt-0" style={{ borderColor: "rgba(139,92,246,0.25)" }}>
                      <p className="pt-4 text-sm leading-relaxed" style={{ color: "#c9bddc" }}>
                        {item.a}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="boutique-thanks"
          className="scroll-mt-28 rounded-2xl border p-8 text-center reveal-card"
          style={{ backgroundColor: "rgba(16,16,23,0.95)", borderColor: "rgba(139,92,246,0.35)" }}
        >
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
            Merci à celles et ceux qui soutiennent TENF
          </h2>
          <p className="mt-3 max-w-2xl mx-auto" style={{ color: "#ccc4de" }}>
            Chaque commande participe au développement des projets communautaires et aux prochains événements.
          </p>
          <div className="mt-5">
            <Link
              href="/soutenir-tenf"
              className="inline-flex flex-col items-center justify-center gap-1 px-5 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              <span>💜 Soutenir TENF</span>
              <span className="text-xs font-normal opacity-95">Don libre — page dédiée</span>
            </Link>
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
        .boutique-bg-mesh {
          opacity: 0.45;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(139, 92, 246, 0.15), transparent 42%),
            radial-gradient(circle at 85% 15%, rgba(220, 38, 38, 0.08), transparent 38%),
            radial-gradient(circle at 70% 85%, rgba(99, 102, 241, 0.1), transparent 40%);
        }

        .boutique-bg-glow {
          animation: boutiqueGlowFloat 10s ease-in-out infinite;
        }

        .boutique-bg-glow-b {
          animation-delay: 1.5s;
        }

        @keyframes boutiqueGlowFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

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

        @media (max-width: 768px) {
          .reveal-card,
          .hero-float-card {
            animation: none;
          }

          .hover-scale-soft {
            transition: none;
          }

          .hover-scale-soft:hover {
            transform: none;
            box-shadow: none;
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
      className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[42px]"
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
  if (emphasis === "creator") badges.push("🎮 Créateur");
  if (emphasis === "community") badges.push("💜 Communauté");
  return badges.slice(0, 2);
}

function ProductCard({ product, onClick, onTrackClick, emphasis }: ProductCardProps) {
  const categoryColor = product.category?.color || "#8B5CF6";
  const mainImage = product.images[0] || "";
  const priceLabel = `${product.isStartingPrice ? "À partir de " : ""}€${product.price.toFixed(2)}`;
  const badges = resolveBadges(product, emphasis);

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-xl transition-all md:hover:-translate-y-1"
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
            className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-110"
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
              💜 Soutien communauté
            </p>
          </div>

          <a
            href={product.buyUrl || "#"}
            target={product.buyUrl ? "_blank" : undefined}
            rel={product.buyUrl ? "noopener noreferrer" : undefined}
            className="min-h-[40px] min-w-[120px] rounded-lg px-3 py-2 text-center text-xs font-semibold text-white"
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
          Ce produit soutient directement les projets de la communauté TENF.
        </p>
      </div>
    </article>
  );
}