"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import { findActiveHub, getNavigationByMode, type AdminMode } from "@/lib/admin/navigation";

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
  "/admin/gestion-acces/accueil",
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

  const navItems = useMemo(() => getNavigationByMode(adminMode), [adminMode]);
  const activeHub = useMemo(() => findActiveHub(navItems, pathname), [navItems, pathname]);
  const orderedNavItems = useMemo(() => {
    return navItems.slice().sort((a, b) => {
      const rankA = getHubPriority(a.href);
      const rankB = getHubPriority(b.href);
      if (rankA !== rankB) return rankA - rankB;
      return a.label.localeCompare(b.label, "fr-FR");
    });
  }, [navItems]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/92 backdrop-blur-xl relative"
      style={{ borderColor: "var(--color-sidebar-border, rgba(63,63,70,0.55))" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent"
        aria-hidden
      />
      <div className="relative z-[2] flex w-full min-w-0 flex-col">
        {/* Rangée haute pleine largeur : deux bandeaux visuels (identité / actions), fluide au zoom */}
        <div className="flex w-full min-w-0 flex-col border-b border-zinc-800/40 sm:flex-row sm:items-stretch">
          <div className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-[clamp(0.5rem,1.2vw,1rem)] bg-[linear-gradient(105deg,rgba(76,29,149,0.26)_0%,rgba(24,24,27,0.4)_38%,#09090b_72%)] py-2 pl-[clamp(0.75rem,2.5vw,1.5rem)] pr-3 sm:min-h-0 sm:py-0 sm:pr-[clamp(0.75rem,2vw,1.25rem)] lg:min-h-[3.25rem]">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-800/40 bg-zinc-900/50 text-zinc-200 shadow-sm shadow-black/25 transition hover:border-violet-600/50 hover:bg-zinc-900/80 hover:text-white lg:hidden ${focusRing}`}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>

            <Link
              href="/admin/pilotage"
              className={`flex min-w-0 flex-1 items-center gap-[clamp(0.4rem,1vw,0.75rem)] rounded-xl py-1.5 pl-1 pr-2 ring-1 ring-violet-500/10 transition hover:bg-violet-950/15 hover:ring-violet-400/20 sm:min-w-0 sm:flex-initial sm:pr-3 ${focusRing}`}
            >
              <span className="flex shrink-0 rounded-lg bg-zinc-900/90 p-0.5 ring-1 ring-violet-900/40 shadow-inner shadow-black/40">
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
                <p className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-violet-200/90 bg-clip-text text-[length:clamp(0.8125rem,0.72rem+0.35vw,0.9375rem)] font-semibold tracking-tight text-transparent">
                  Espace admin
                </p>
                <p className="mt-0.5 text-[length:clamp(0.625rem,0.55rem+0.25vw,0.6875rem)] font-normal leading-snug text-zinc-500">
                  Tu gères le serveur depuis ici — les domaines sont regroupés pour toi.
                </p>
              </div>
            </Link>
          </div>

          <div className="flex min-h-[2.75rem] w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-[clamp(0.35rem,1vw,0.5rem)] border-t border-zinc-800/50 bg-gradient-to-l from-sky-950/20 via-zinc-950/50 to-[#09090b] py-2 pl-3 pr-[clamp(0.75rem,2.5vw,1.5rem)] sm:w-auto sm:min-h-0 sm:border-l sm:border-t-0 sm:border-zinc-700/40 sm:py-0 sm:pl-[clamp(0.75rem,2vw,1.25rem)] lg:min-h-[3.25rem]">
            <Link
              href="/admin/search"
              title="Rechercher un membre"
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700/40 bg-zinc-900/40 text-zinc-400 transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:text-zinc-100 sm:h-10 sm:w-10 ${focusRing}`}
            >
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
            </Link>

            {canAccessAdvanced &&
              (adminMode === "advanced" ? (
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = `${ADMIN_MODE_COOKIE}=; path=/; max-age=0`;
                    setAdminMode("simple");
                    router.refresh();
                  }}
                  className={`hidden shrink-0 rounded-full border border-zinc-600/60 bg-zinc-900/70 px-[clamp(0.65rem,1.5vw,0.85rem)] py-2 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-sky-600/40 hover:bg-sky-950/20 hover:text-zinc-50 md:inline-block ${focusRing}`}
                >
                  Revenir au mode simple
                </button>
              ) : (
                <Link
                  href="/admin/avance"
                  className={`hidden shrink-0 rounded-full border border-zinc-600/60 bg-zinc-900/70 px-[clamp(0.65rem,1.5vw,0.85rem)] py-2 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-medium text-zinc-200 shadow-sm shadow-black/30 transition hover:border-sky-600/40 hover:bg-sky-950/20 hover:text-zinc-50 md:inline-block ${focusRing}`}
                >
                  Passer en avancé
                </Link>
              ))}

            <div className="hidden h-[clamp(1.75rem,4vw,2rem)] w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-500/45 to-transparent sm:block" aria-hidden />

            <div className="min-w-0 max-w-[min(100%,11rem)] rounded-xl border border-sky-900/30 bg-gradient-to-br from-zinc-900/95 via-zinc-950/90 to-sky-950/15 px-2.5 py-1.5 shadow-sm shadow-black/25 sm:max-w-[min(20rem,28vw)] sm:px-3.5">
              <p className="truncate text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] leading-snug text-zinc-400">
                Tu es connecté : <span className="font-semibold text-zinc-100">{username}</span>
              </p>
            </div>
          </div>
        </div>

        <nav
          className="hidden w-full min-w-0 border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/35 to-transparent px-[clamp(0.75rem,2.5vw,1.5rem)] py-3 lg:block lg:py-4"
          aria-label="Navigation principale admin"
        >
          <div className="flex w-full min-w-0 flex-wrap items-stretch justify-center gap-[clamp(0.35rem,1vw,0.65rem)]">
            {orderedNavItems.map((hub) => {
              const isActive = activeHub?.href === hub.href;
              return (
                <Link
                  key={hub.href}
                  href={hub.href}
                  className={`max-w-[min(100%,11rem)] rounded-xl border px-[clamp(0.65rem,1.2vw,0.9rem)] py-[clamp(0.5rem,1.2vw,0.65rem)] text-center text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] font-medium leading-snug tracking-tight transition duration-200 sm:max-w-[min(100%,13rem)] sm:px-[clamp(0.75rem,1.4vw,1rem)] ${focusRing} ${
                    isActive
                      ? "border-violet-500/40 bg-gradient-to-br from-violet-600/20 via-zinc-900 to-zinc-950 text-zinc-50 shadow-md shadow-violet-950/25 ring-1 ring-violet-400/15 [text-shadow:0_1px_0_rgba(0,0,0,0.35)]"
                      : "border-zinc-800/90 bg-zinc-950/50 text-zinc-400 shadow-sm shadow-black/15 hover:-translate-y-px hover:border-zinc-600 hover:bg-zinc-900/80 hover:text-zinc-100 hover:shadow-md hover:shadow-black/25"
                  }`}
                >
                  {hub.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {(pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/pilotage")) && (
          <p className="hidden w-full border-t border-zinc-800/50 bg-gradient-to-r from-amber-950/20 via-zinc-950/40 to-violet-950/15 px-[clamp(0.75rem,2.5vw,1.5rem)] py-2.5 text-center text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] leading-relaxed text-zinc-500 lg:block">
            Merci pour ton investissement, <span className="font-medium text-zinc-300">{username}</span>. Clara, Nexou et Red te sont
            reconnaissants.
          </p>
        )}
      </div>
    </header>
  );
}
