"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, ExternalLink, LogIn, Menu, PanelLeftOpen, Search, UserCircle2, X } from "lucide-react";
import HeaderPrimaryCta from "@/components/header/HeaderPrimaryCta";
import { memberSidebarNavItemsForMobile } from "@/lib/navigation/memberSidebar";
import { DISCORD_INVITE_URL, socialLinks, type SocialLink } from "@/lib/socialLinks";
import { useMemberDesktopNavOptional } from "@/contexts/MemberDesktopNavContext";
import { NavDropdownPanel, NavMenuItemLink, type NavDropdownGroup } from "@/components/header/NavDropdownMenu";
import { NAV_GROUP_THEME } from "@/lib/navigation/publicHeaderNavMeta";
import TENFLogo from "./TENFLogo";
import ThemeToggle from "./ThemeToggle";

// ============================================================
// Types
// ============================================================
type NavLeaf = {
  href: string;
  label: string;
  description?: string;
};

// ============================================================
// Configuration de la navigation
// ============================================================
// URL Discord centralisée dans lib/socialLinks → DISCORD_INVITE_URL

const NAV_GROUPS: NavDropdownGroup[] = [
  {
    id: "decouvrir",
    label: "Découvrir",
    description: "Comprendre TENF",
    items: [
      { href: "/", label: "Accueil", description: "Page d'accueil" },
      { href: "/a-propos", label: "À propos", description: "Notre histoire et nos valeurs" },
      { href: "/fonctionnement-tenf/comment-ca-marche", label: "Comment ça marche", description: "Le projet en détail" },
      { href: "/charte", label: "Charte communautaire", description: "Les règles qui nous tiennent" },
      { href: "/fonctionnement-tenf/faq", label: "FAQ générale", description: "Tout ce qu'on nous demande souvent" },
      { href: "/changelog", label: "Nouveautés du site", description: "Évolutions récentes" },
    ],
  },
  {
    id: "communaute",
    label: "Communauté",
    description: "Les humains et l'activité",
    items: [
      { href: "/membres", label: "Membres", description: "Annuaire des créateurs" },
      { href: "/vip", label: "Membres VIP", description: "Les profils mis en avant ce mois-ci" },
      { href: "/lives", label: "Lives en cours", description: "Qui stream maintenant" },
      { href: "/lives/calendrier", label: "Calendrier des lives", description: "Planning hebdomadaire" },
      { href: "/evenements", label: "Événements", description: "Agenda complet & inscriptions" },
      { href: "/evenements-communautaires", label: "Proposer un événement", description: "Idées, propositions et votes communautaires" },
      { href: "/new-family-aventura", label: "New Family Aventura", description: "Le rendez-vous annuel" },
      { href: "/avis-tenf", label: "Témoignages", description: "Ce que disent les membres" },
      { href: "/interviews", label: "Interviews", description: "Portraits longs" },
      { href: "/decouvrir-createurs", label: "Clips à découvrir", description: "Sélection de clips" },
    ],
  },
  {
    id: "rejoindre",
    label: "Rejoindre",
    description: "S'intégrer & candidater",
    items: [
      { href: "/rejoindre", label: "Vue d'ensemble", description: "La page centrale pour rejoindre TENF" },
      { href: "/integration", label: "Réunion d'intégration", description: "Réserver son créneau & comprendre l'accueil" },
      { href: "/rejoindre/guide-integration", label: "Guide d'intégration", description: "Toutes les étapes en détail" },
      { href: "/rejoindre/faq", label: "FAQ — comment rejoindre", description: "Les questions sur le parcours d'entrée" },
      { href: "/guides/tenf", label: "Guide nouveau membre", description: "Tes premiers jours dans TENF" },
      { href: "/guides/espace-membre", label: "Guide espace membre", description: "Prendre en main ton compte" },
      { href: "/guides/partie-publique", label: "Guide site public", description: "Toutes les pages sans connexion" },
      { href: "/postuler", label: "Postuler au staff", description: "Candidature pour intégrer l'équipe" },
    ],
  },
  {
    id: "tenf-plus",
    label: "TENF+",
    description: "L'écosystème et les services",
    items: [
      { href: "/academy", label: "Academy", description: "Programme d'accompagnement" },
      { href: "/organisation-staff", label: "Staff & organisation", description: "Qui fait quoi" },
      { href: "/organisation-staff/organigramme", label: "Organigramme interactif", description: "Vue d'ensemble" },
      { href: "/partenariats", label: "Partenariats", description: "Nos collaborations" },
      { href: "/partenaire-tenf", label: "UPA × Ligue contre le cancer", description: "Partenariat caritatif phare" },
      { href: "/soutenir-tenf", label: "Soutenir TENF", description: "Aider le projet" },
      { href: "/boutique", label: "Boutique", description: "Goodies TENF" },
      { href: "/contact", label: "Contact", description: "Nous écrire" },
    ],
  },
];

/** Liste plate pour la recherche locale. */
const SEARCHABLE_PAGES: NavLeaf[] = NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ ...i, description: i.description ? `${g.label} · ${i.description}` : g.label }))
);

// ============================================================
// Helpers
// ============================================================
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isPublicContext(pathname: string | null): boolean {
  if (!pathname) return true;
  return !pathname.startsWith("/admin") && !pathname.startsWith("/member/");
}

// ============================================================
// Sociaux (icônes marque — tailles fluides au zoom)
// ============================================================
const SOCIAL_ICON_SIZES = {
  sm: "h-[clamp(0.85rem,0.75rem+0.35vw,1rem)] w-[clamp(0.85rem,0.75rem+0.35vw,1rem)]",
  md: "h-[clamp(1rem,0.85rem+0.45vw,1.25rem)] w-[clamp(1rem,0.85rem+0.45vw,1.25rem)]",
  lg: "h-[clamp(1.15rem,1rem+0.55vw,1.45rem)] w-[clamp(1.15rem,1rem+0.55vw,1.45rem)]",
} as const;

function SocialIcon({ icon, size = "md" }: { icon: SocialLink["icon"]; size?: keyof typeof SOCIAL_ICON_SIZES }) {
  const cls = `${SOCIAL_ICON_SIZES[size]} shrink-0`;
  switch (icon) {
    case "discord":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.766a8.16 8.16 0 0 0 4.77 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    default:
      return null;
  }
}

function socialAccent(icon: SocialLink["icon"]): { hoverBorder: string; hoverBg: string; hoverColor: string } {
  switch (icon) {
    case "discord":
      return { hoverBorder: "#5865F2", hoverBg: "rgba(88, 101, 242, 0.14)", hoverColor: "#5865F2" };
    case "twitter":
      return { hoverBorder: "rgba(255,255,255,0.35)", hoverBg: "rgba(255,255,255,0.08)", hoverColor: "var(--color-text)" };
    case "tiktok":
      return { hoverBorder: "#25f4ee", hoverBg: "rgba(37, 244, 238, 0.1)", hoverColor: "#fe2c55" };
    case "instagram":
      return { hoverBorder: "#f09433", hoverBg: "rgba(240, 148, 51, 0.12)", hoverColor: "#e1306c" };
    default:
      return { hoverBorder: "var(--color-primary)", hoverBg: "var(--color-surface)", hoverColor: "var(--color-text)" };
  }
}

/** Boutons réseaux : logos seuls, accessibles (nom en infobulle). */
function SocialLogoButtons({
  variant,
  className = "",
}: {
  variant: "toolbar-desktop" | "toolbar-mobile";
  className?: string;
}) {
  const box =
    variant === "toolbar-mobile"
      ? "h-9 w-9 min-h-9 min-w-9 rounded-lg sm:h-[clamp(2.15rem,1.85rem+1vw,2.5rem)] sm:w-[clamp(2.15rem,1.85rem+1vw,2.5rem)] sm:min-h-[2.15rem] sm:min-w-[2.15rem] sm:rounded-xl"
      : "h-[clamp(2.25rem,2rem+0.9vw,2.65rem)] w-[clamp(2.25rem,2rem+0.9vw,2.65rem)] min-h-[2.25rem] min-w-[2.25rem] rounded-xl";
  const iconSize = (variant === "toolbar-mobile" ? "sm" : "md") as keyof typeof SOCIAL_ICON_SIZES;

  return (
    <nav
      className={`flex flex-shrink-0 items-center gap-[clamp(0.25rem,0.5vw,0.45rem)] ${className}`}
      aria-label="Réseaux sociaux TENF"
    >
      {socialLinks.map((social) => {
        const a = socialAccent(social.icon);
        return (
          <a
            key={social.icon}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            aria-label={social.name}
            className={`group inline-flex ${box} items-center justify-center border transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/55 motion-safe:active:scale-[0.97]`}
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "color-mix(in srgb, var(--color-card) 82%, transparent)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = a.hoverBorder;
              e.currentTarget.style.backgroundColor = a.hoverBg;
              e.currentTarget.style.color = a.hoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-card) 82%, transparent)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            <SocialIcon icon={social.icon} size={iconSize} />
          </a>
        );
      })}
    </nav>
  );
}

// ============================================================
// Recherche globale (autocompletion + fallback Google)
// ============================================================
function HeaderSearch({
  variant = "desktop",
  onItemSelect,
}: {
  variant?: "desktop" | "mobile";
  onItemSelect?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo<NavLeaf[]>(() => {
    const q = normalize(query);
    if (!q) return [];
    return SEARCHABLE_PAGES.filter((item) => {
      const inLabel = normalize(item.label).includes(q);
      const inDesc = item.description ? normalize(item.description).includes(q) : false;
      const inHref = item.href.includes(q);
      return inLabel || inDesc || inHref;
    }).slice(0, 6);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigateTo(item: NavLeaf) {
    setOpen(false);
    setQuery("");
    onItemSelect?.();
    router.push(item.href);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (matches.length > 0) {
      navigateTo(matches[activeIndex] ?? matches[0]);
      return;
    }
    // Aucun match local → on ouvre une recherche site:tenf-community.com sur Google.
    const url = `https://www.google.com/search?q=${encodeURIComponent(`site:tenf-community.com ${trimmed}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (matches.length > 0) {
        setOpen(true);
        setActiveIndex((idx) => (idx + 1) % matches.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (matches.length > 0) {
        setOpen(true);
        setActiveIndex((idx) => (idx - 1 + matches.length) % matches.length);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const inputId = variant === "desktop" ? "header-search-desktop" : "header-search-mobile";

  return (
    <div ref={containerRef} className={variant === "desktop" ? "relative w-full max-w-[min(17rem,calc(100vw-26rem))]" : "relative w-full"}>
      <form onSubmit={handleSubmit} role="search" aria-label="Rechercher sur le site TENF">
        <label htmlFor={inputId} className="sr-only">
          Rechercher une page du site TENF
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-secondary)" }}
            aria-hidden
          />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            placeholder="Rechercher…"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
              color: "var(--color-text)",
            }}
            aria-autocomplete="list"
            aria-controls={`${inputId}-listbox`}
            aria-expanded={open && matches.length > 0}
            role="combobox"
          />
        </div>
      </form>

      {open && query.trim().length > 0 && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border shadow-xl"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          {matches.length > 0 ? (
            matches.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.href}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => navigateTo(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none"
                  style={{
                    backgroundColor: isActive ? "var(--color-card-hover)" : "transparent",
                    color: "var(--color-text)",
                  }}
                >
                  <span className="block font-semibold">{item.label}</span>
                  {item.description && (
                    <span
                      className="mt-0.5 block text-xs leading-snug"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {item.description}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <button
              type="button"
              onClick={() => {
                const url = `https://www.google.com/search?q=${encodeURIComponent(
                  `site:tenf-community.com ${query.trim()}`
                )}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <ExternalLink size={14} aria-hidden />
              <span>
                Chercher « {query.trim()} » sur Google <span className="opacity-70">(site:tenf-community.com)</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Bouton Connexion / Mon espace (selon session)
// ============================================================
function AccountButton({ compact = false }: { compact?: boolean }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  if (status === "loading") {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-24 animate-pulse rounded-lg border"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
      />
    );
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/member/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{
          color: "var(--color-text)",
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <UserCircle2 size={15} aria-hidden />
        <span>{compact ? "Espace" : "Mon espace"}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
      style={{
        color: "var(--color-text)",
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
      aria-label="Se connecter avec Discord"
    >
      <LogIn size={15} aria-hidden />
      <span>{compact ? "Connexion" : "Connexion"}</span>
    </Link>
  );
}

// ============================================================
// Sticky CTA Discord (mobile, hors zones privées)
// ============================================================
function DiscordStickyCta({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <a
      href={DISCORD_INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Rejoindre le Discord TENF"
      className="fixed bottom-4 right-4 z-40 inline-flex h-[clamp(3.25rem,3rem+1vw,3.75rem)] w-[clamp(3.25rem,3rem+1vw,3.75rem)] items-center justify-center rounded-full border text-white shadow-lg transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 motion-safe:active:scale-[0.96] xl:hidden"
      style={{
        backgroundColor: "#5865F2",
        borderColor: "rgba(255,255,255,0.18)",
        boxShadow: "0 10px 26px -8px rgba(88,101,242,0.55)",
      }}
    >
      <SocialIcon icon="discord" size="lg" />
    </a>
  );
}

// ============================================================
// Header principal
// ============================================================
type HeaderProps = {
  onOpenMemberSidebar?: () => void;
  memberAreaHref?: string;
  showMemberMenuInBurger?: boolean;
};

export default function Header({ onOpenMemberSidebar, memberAreaHref, showMemberMenuInBurger }: HeaderProps) {
  const pathname = usePathname();
  const memberDesktopNav = useMemberDesktopNavOptional();
  const headerMemberArea = Boolean(pathname?.startsWith("/member") || pathname?.startsWith("/membres"));
  const headerRef = useRef<HTMLElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Set<string>>(new Set());
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [memberUnreadNotifications, setMemberUnreadNotifications] = useState(0);

  const showStickyDiscord = isPublicContext(pathname);
  // CTA header (Rejoindre ou Lives) masqué sur /rejoindre et zones admin/member dédiées.
  const showJoinCta = showStickyDiscord && !pathname?.startsWith("/rejoindre");

  // Notifications membres (badge)
  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ count?: number }>;
      if (typeof ce.detail?.count === "number") setMemberUnreadNotifications(ce.detail.count);
    };
    window.addEventListener("member-notifications-count", handler);
    return () => window.removeEventListener("member-notifications-count", handler);
  }, []);

  // Fermer tous les menus au changement de route
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setMemberMenuOpen(false);
  }, [pathname]);

  // Verrou de scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (!mobileMenuOpen) return;
    if (!window.matchMedia("(max-width: 1279px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  // Clic en dehors + Escape pour fermer les menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!headerRef.current) return;
      if (!headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleMobileGroup(id: string) {
    setMobileOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full border-b backdrop-blur-xl motion-reduce:backdrop-blur-none relative"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-violet-500/45 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 90% at 50% -30%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 55%), radial-gradient(80% 70% at 100% 0%, rgba(167, 139, 250, 0.08), transparent 45%)",
          }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[min(96rem,calc(100vw-0.75rem))] items-center gap-[clamp(0.5rem,1.2vw,1rem)] px-[clamp(0.65rem,2vw,1.75rem)] py-[clamp(0.6rem,1vw,0.95rem)] sm:gap-[clamp(0.65rem,1.4vw,1.25rem)]">
          {/* Logo */}
          <div className="relative z-20 flex min-w-0 shrink-0 items-center gap-[clamp(0.35rem,1vw,0.75rem)]">
            <TENFLogo showTagline={true} size="xl" hideTaglineOnMobile />
            {headerMemberArea && memberDesktopNav?.effectiveDesktopCollapsed ? (
              <button
                type="button"
                onClick={() => memberDesktopNav.setDesktopCollapsed(false)}
                className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border xl:inline-flex"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface)",
                }}
                aria-label="Afficher le menu membre"
              >
                <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden />
              </button>
            ) : null}
          </div>

          {/* Navigation desktop */}
          <nav
            className="relative z-10 hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex"
            aria-label="Navigation principale"
          >
            {NAV_GROUPS.map((group) => {
              const isOpen = openDropdown === group.id;
              const theme = NAV_GROUP_THEME[group.id];
              return (
                <div key={group.id} className="relative">
                  <button
                    type="button"
                    id={`nav-trigger-${group.id}`}
                    onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={`nav-menu-${group.id}`}
                    className="inline-flex items-center gap-1 rounded-xl px-[clamp(0.45rem,0.6vw,0.65rem)] py-[clamp(0.45rem,0.55vw,0.55rem)] text-[clamp(0.8rem,0.72rem+0.25vw,0.95rem)] font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      color: isOpen && theme ? theme.accent : "var(--color-text)",
                      backgroundColor: isOpen ? `${theme?.accent ?? "var(--color-primary)"}14` : "transparent",
                      boxShadow: isOpen ? `inset 0 0 0 1px ${theme?.accent ?? "var(--color-primary)"}33` : undefined,
                    }}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      style={{ color: isOpen && theme ? theme.accent : "var(--color-text-secondary)" }}
                      aria-hidden
                    />
                  </button>

                  {isOpen ? <NavDropdownPanel group={group} pathname={pathname} onClose={() => setOpenDropdown(null)} /> : null}
                </div>
              );
            })}
          </nav>

          {/* Recherche desktop */}
          <div className="relative z-20 hidden xl:block">
            <HeaderSearch variant="desktop" />
          </div>

          <div className="relative z-20 hidden xl:flex">
            <SocialLogoButtons variant="toolbar-desktop" />
          </div>

          {/* Zone droite */}
          <div className="relative z-20 ml-auto flex shrink-0 items-center gap-[clamp(0.35rem,0.8vw,0.5rem)] sm:gap-[clamp(0.45rem,1vw,0.65rem)]">
            {/* CTA principal : Rejoindre TENF ou Lives (membre intégré) */}
            {showJoinCta ? <HeaderPrimaryCta variant="desktop" /> : null}

            {/* Compte (desktop : selon session ; mobile : selon contexte) */}
            <div className="hidden xl:block">
              <AccountButton />
            </div>

            <div className="flex xl:hidden">
              <SocialLogoButtons variant="toolbar-mobile" />
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Compte mobile (préserve l'API existante : sidebar membre / lien direct) */}
            {onOpenMemberSidebar ? (
              <button
                type="button"
                onClick={onOpenMemberSidebar}
                className="inline-flex items-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 xl:hidden"
                style={{ color: "var(--color-text)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                aria-label="Ouvrir le panneau membre"
              >
                Compte
              </button>
            ) : memberAreaHref ? (
              <Link
                href={memberAreaHref}
                className="inline-flex items-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 xl:hidden"
                style={{ color: "var(--color-text)", borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                aria-label="Accéder à mon espace membre"
              >
                Compte
              </Link>
            ) : (
              <div className="xl:hidden">
                <AccountButton compact />
              </div>
            )}

            {/* Burger mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 xl:hidden"
              style={{ color: "var(--color-text)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {mobileMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Menu mobile en overlay */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="absolute left-0 right-0 top-full border-t shadow-xl xl:hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          >
            <nav
              aria-label="Navigation mobile"
              className="flex max-h-[78dvh] flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {/* CTA principal */}
              {showJoinCta ? (
                <HeaderPrimaryCta variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
              ) : null}

              {/* Recherche mobile */}
              <HeaderSearch variant="mobile" onItemSelect={() => setMobileMenuOpen(false)} />

              {/* Sections principales */}
              {NAV_GROUPS.map((group) => {
                const opened = mobileOpenGroups.has(group.id);
                const theme = NAV_GROUP_THEME[group.id];
                const GroupIcon = theme?.icon;
                return (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-2xl border"
                    style={{
                      borderColor: opened ? `${theme?.accent ?? "var(--color-border)"}44` : "var(--color-border)",
                      backgroundColor: opened ? `${theme?.accent ?? "transparent"}08` : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMobileGroup(group.id)}
                      aria-expanded={opened}
                      aria-controls={`mobile-group-${group.id}`}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {theme ? (
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
                            style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}
                          >
                            <GroupIcon className="h-5 w-5" aria-hidden />
                          </span>
                        ) : null}
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                            {group.label}
                          </span>
                          <span className="mt-0.5 text-[11px] font-medium leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                            {group.description}
                          </span>
                        </span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${opened ? "rotate-180" : ""}`}
                        style={{ color: theme?.accent ?? "var(--color-text-secondary)" }}
                        aria-hidden
                      />
                    </button>
                    {opened && theme ? (
                      <ul
                        id={`mobile-group-${group.id}`}
                        className="space-y-0.5 border-t px-2 py-2"
                        style={{ borderColor: `${theme.accent}28` }}
                      >
                        {group.items.map((item) => {
                          const active =
                            pathname === item.href ||
                            (item.href !== "/" && Boolean(pathname?.startsWith(`${item.href}/`)));
                          return (
                            <li key={item.href}>
                              <NavMenuItemLink
                                item={item}
                                groupTheme={theme}
                                active={active}
                                compact
                                onNavigate={() => setMobileMenuOpen(false)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}

              {/* Compte mobile (espace membre dans le burger) */}
              {showMemberMenuInBurger && (
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setMemberMenuOpen((prev) => !prev)}
                    aria-expanded={memberMenuOpen}
                    aria-controls="mobile-member-menu"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    <span className="flex items-center gap-2">
                      Mon espace
                      {memberUnreadNotifications > 0 && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title="Notifications non lues" />
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform ${memberMenuOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {memberMenuOpen && (
                    <ul
                      id="mobile-member-menu"
                      className="border-t px-2 py-2"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {memberSidebarNavItemsForMobile.map((item, idx) => (
                        <li key={`member-${idx}-${item.href}`}>
                          {item.disabled ? (
                            <div
                              role="link"
                              aria-disabled="true"
                              tabIndex={-1}
                              title={`${item.label} — ${item.disabledHint ?? "bientôt disponible"}`}
                              className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm opacity-60 select-none"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              <span className="flex items-center gap-2">
                                {item.label}
                                <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-700/70 bg-zinc-800/50 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-zinc-400">
                                  {item.disabledHint ?? "Bientôt"}
                                </span>
                              </span>
                            </div>
                          ) : item.external ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                              style={{ color: "var(--color-text)" }}
                            >
                              <span className="flex items-center gap-2">
                                {item.label}
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              </span>
                            </a>
                          ) : (
                            <Link
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                              style={{ color: "var(--color-text)" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--color-card-hover)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <span className="flex items-center gap-2">
                                {item.label}
                                {item.href === "/member/notifications" && memberUnreadNotifications > 0 && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title="Non lu" />
                                )}
                              </span>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </nav>
          </div>
        )}
      </header>

      {/* Sticky CTA Discord mobile (hors zones membre/admin) */}
      <DiscordStickyCta visible={showStickyDiscord && !mobileMenuOpen} />
    </>
  );
}
