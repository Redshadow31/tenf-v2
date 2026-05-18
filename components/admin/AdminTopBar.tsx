"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import { findActiveHub, getNavigationByMode, type AdminMode } from "@/lib/admin/navigation";
import { useFilteredAdminNav, useAdminNavHrefAllowed } from "@/components/admin/AdminNavAccessContext";

const ADMIN_MODE_COOKIE = "admin_mode";

type AdminTopBarProps = {
  onOpenMobileMenu?: () => void;
};

const HUB_PRIORITY_ORDER = [
  "/admin/pilotage",
  "/admin/mon-compte",
  "/admin/membres",
  "/admin/onboarding",
  "/admin/communaute",
  "/admin/evaluation",
  "/admin/academy",
  "/admin/upa-event",
  "/admin/new-family-aventura",
  "/admin/interviews",
  "/admin/boutique",
  "/admin/gestion-acces",
  "/admin/moderation/staff",
  "/admin/search",
] as const;

function getHubPriority(href: string): number {
  const idx = HUB_PRIORITY_ORDER.findIndex((candidate) => href === candidate || href.startsWith(`${candidate}/`));
  return idx === -1 ? HUB_PRIORITY_ORDER.length + 1 : idx;
}

function getAdminModeCookie(): AdminMode {
  if (typeof document === "undefined") return "simple";
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_MODE_COOKIE}=([^;]*)`));
  const cookieValue = match ? decodeURIComponent(match[1]) : "simple";
  return cookieValue === "advanced" ? "advanced" : "simple";
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]";

export default function AdminTopBar({ onOpenMobileMenu }: AdminTopBarProps) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [adminMode, setAdminMode] = useState<AdminMode>("simple");
  const [canAccessAdvanced, setCanAccessAdvanced] = useState(false);
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    setAdminMode(getAdminModeCookie());
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    async function loadContext() {
      try {
        const [advancedRes, aliasRes, user] = await Promise.all([
          fetch("/api/admin/advanced-access?check=1", { cache: "no-store" }),
          fetch("/api/admin/access/self", { cache: "no-store" }),
          getDiscordUser(),
        ]);
        if (!mounted) return;
        if (advancedRes.ok) {
          const data = await advancedRes.json();
          setCanAccessAdvanced(data?.canAccessAdvanced === true);
        }
        if (user?.username) {
          setUsername(user.username);
        }
        if (aliasRes.ok) {
          const aliasData = await aliasRes.json();
          const alias = typeof aliasData?.adminAlias === "string" ? aliasData.adminAlias.trim() : "";
          if (alias) setUsername(alias);
        }
      } catch {
        // no-op
      }
    }
    loadContext();
    return () => {
      mounted = false;
    };
  }, []);

  const baseNavItems = useMemo(() => getNavigationByMode(adminMode), [adminMode]);
  const navItems = useFilteredAdminNav(baseNavItems);
  const activeHub = useMemo(() => findActiveHub(navItems, pathname), [navItems, pathname]);
  const orderedNavItems = useMemo(() => {
    return navItems.slice().sort((a, b) => {
      const rankA = getHubPriority(a.href);
      const rankB = getHubPriority(b.href);
      if (rankA !== rankB) return rankA - rankB;
      return a.label.localeCompare(b.label, "fr-FR");
    });
  }, [navItems]);

  const logoHomeHref = useMemo(() => {
    if (orderedNavItems.length > 0) return orderedNavItems[0].href;
    return "/admin/mon-compte";
  }, [orderedNavItems]);

  const canShowSearchShortcut = useAdminNavHrefAllowed("/admin/search");

  return (
    <header
      className="sticky top-0 z-40 border-b border-violet-400/10 bg-[#0b0b12]/92 backdrop-blur-xl relative"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
        aria-hidden
      />
      <div className="relative z-[2] flex w-full min-w-0 flex-col">
        {/* Rangée haute pleine largeur : identité (gauche, ton violet) + actions (droite, ton indigo) */}
        <div className="flex w-full min-w-0 flex-col border-b border-white/[0.04] sm:flex-row sm:items-stretch">
          <div className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-[clamp(0.5rem,1.2vw,1rem)] bg-[linear-gradient(105deg,rgba(76,29,149,0.14)_0%,rgba(24,24,27,0.35)_42%,#0b0b12_78%)] py-2 pl-[clamp(0.75rem,2.5vw,1.5rem)] pr-3 sm:min-h-0 sm:py-0 sm:pr-[clamp(0.75rem,2vw,1.25rem)] lg:min-h-[3.25rem]">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-500/[0.06] hover:text-white lg:hidden ${focusRing}`}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>

            <Link
              href={logoHomeHref}
              className={`flex min-w-0 flex-1 items-center gap-[clamp(0.4rem,1vw,0.75rem)] rounded-xl py-1.5 pl-1 pr-2 transition hover:bg-white/[0.035] sm:min-w-0 sm:flex-initial sm:pr-3 ${focusRing}`}
            >
              <span className="flex shrink-0 rounded-lg bg-zinc-900/85 p-0.5 ring-1 ring-violet-400/20 shadow-inner shadow-black/40">
                <Image
                  src="/logo.png"
                  alt="TENF"
                  width={40}
                  height={40}
                  className="h-[clamp(2rem,5vw,2.5rem)] w-[clamp(2rem,5vw,2.5rem)] object-contain"
                  priority
                />
              </span>
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="text-[length:clamp(0.8125rem,0.72rem+0.35vw,0.9375rem)] font-semibold tracking-tight text-zinc-100">
                  Espace admin
                </p>
                <p className="mt-0.5 text-[length:clamp(0.625rem,0.55rem+0.25vw,0.6875rem)] font-normal leading-snug text-zinc-500">
                  Back-office TENF — domaines regroupés par hub.
                </p>
              </div>
            </Link>
          </div>

          <div className="flex min-h-[2.75rem] w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-[clamp(0.35rem,1vw,0.5rem)] border-t border-white/[0.04] bg-gradient-to-l from-indigo-500/[0.06] via-zinc-950/40 to-[#0b0b12] py-2 pl-3 pr-[clamp(0.75rem,2.5vw,1.5rem)] sm:w-auto sm:min-h-0 sm:border-l sm:border-t-0 sm:border-white/[0.05] sm:py-0 sm:pl-[clamp(0.75rem,2vw,1.25rem)] lg:min-h-[3.25rem]">
            <Link
              href="/"
              title="Retour au site public"
              aria-label="Retour au site public"
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-500 transition hover:border-zinc-400/25 hover:bg-white/[0.04] hover:text-zinc-200 sm:h-10 sm:w-10 ${focusRing}`}
            >
              <span className="text-[1.05rem] leading-none text-zinc-400" aria-hidden>
                ↩
              </span>
            </Link>

            {canShowSearchShortcut && (
              <Link
                href="/admin/search"
                title="Rechercher un membre"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-400 transition hover:border-indigo-300/30 hover:bg-indigo-500/[0.06] hover:text-zinc-100 sm:h-10 sm:w-10 ${focusRing}`}
              >
                <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
              </Link>
            )}

            {canAccessAdvanced &&
              (adminMode === "advanced" ? (
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = `${ADMIN_MODE_COOKIE}=; path=/; max-age=0`;
                    setAdminMode("simple");
                    router.refresh();
                  }}
                  title="Revenir au mode simple"
                  className={`hidden shrink-0 items-center gap-1.5 rounded-full border border-rose-300/30 bg-rose-500/[0.06] px-[clamp(0.65rem,1.5vw,0.85rem)] py-1.5 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-semibold text-rose-100 transition hover:border-rose-300/45 hover:bg-rose-500/[0.10] hover:text-white md:inline-flex ${focusRing}`}
                >
                  <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-rose-300" />
                  Mode avancé
                </button>
              ) : (
                <Link
                  href="/admin/avance"
                  title="Activer le mode avancé"
                  className={`hidden shrink-0 items-center gap-1.5 rounded-full border border-indigo-300/20 bg-indigo-500/[0.04] px-[clamp(0.65rem,1.5vw,0.85rem)] py-1.5 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-medium text-indigo-100/90 transition hover:border-indigo-300/35 hover:bg-indigo-500/[0.10] hover:text-white md:inline-flex ${focusRing}`}
                >
                  Passer en avancé
                </Link>
              ))}

            <div className="hidden h-[clamp(1.75rem,4vw,2rem)] w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent sm:block" aria-hidden />

            <div className="min-w-0 max-w-[min(100%,11rem)] rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 sm:max-w-[min(20rem,28vw)] sm:px-3.5">
              <p className="truncate text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] leading-snug text-zinc-400">
                Connecté : <span className="font-semibold text-zinc-100">{username}</span>
              </p>
            </div>
          </div>
        </div>

        <nav
          className="hidden w-full min-w-0 border-t border-white/[0.04] bg-gradient-to-b from-white/[0.015] to-transparent px-[clamp(0.75rem,2.5vw,1.5rem)] py-3 lg:block lg:py-3.5"
          aria-label="Navigation principale admin"
        >
          <div className="flex w-full min-w-0 flex-wrap items-stretch justify-center gap-[clamp(0.25rem,0.8vw,0.5rem)]">
            {orderedNavItems.map((hub) => {
              const isActive = activeHub?.href === hub.href;
              return (
                <Link
                  key={hub.href}
                  href={hub.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative max-w-[min(100%,11rem)] rounded-lg px-[clamp(0.65rem,1.2vw,0.9rem)] py-[clamp(0.4rem,1vw,0.55rem)] text-center text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] font-medium leading-snug tracking-tight transition-colors duration-150 sm:max-w-[min(100%,13rem)] sm:px-[clamp(0.75rem,1.4vw,1rem)] ${focusRing} ${
                    isActive
                      ? "bg-violet-500/[0.10] text-zinc-50"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                  }`}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-[7px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-violet-300/85"
                    />
                  ) : null}
                  {hub.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {(pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/pilotage")) && (
          <p className="hidden w-full border-t border-white/[0.04] bg-gradient-to-r from-amber-500/[0.04] via-zinc-950/40 to-violet-500/[0.04] px-[clamp(0.75rem,2.5vw,1.5rem)] py-2 text-center text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] leading-relaxed text-zinc-500 lg:block">
            Merci pour ton investissement, <span className="font-medium text-zinc-300">{username}</span>. Clara, Nexou et Red te sont
            reconnaissants.
          </p>
        )}
      </div>
    </header>
  );
}
