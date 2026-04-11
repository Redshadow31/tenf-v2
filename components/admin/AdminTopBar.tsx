"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
        // no-op: keep defaults
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
  const navRows = useMemo(() => {
    if (!orderedNavItems.length) return [] as typeof orderedNavItems[];
    const maxItemsPerRow = 6;
    const rows: typeof orderedNavItems[] = [];
    for (let i = 0; i < orderedNavItems.length; i += maxItemsPerRow) {
      rows.push(orderedNavItems.slice(i, i + maxItemsPerRow));
    }
    return rows;
  }, [orderedNavItems]);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-[#0f111a]/90"
      style={{ borderColor: "var(--color-sidebar-border)", backgroundColor: "var(--color-bg)" }}
    >
      <div className="px-4 py-3.5 md:px-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text)" }}
          aria-label="Ouvrir le menu admin"
        >
          ☰
        </button>

        <Link
          href="/admin/pilotage"
          className="flex items-center gap-3.5 shrink-0 rounded-2xl border px-3.5 py-2.5"
          style={{
            borderColor: "rgba(148,163,184,0.2)",
            background:
              "radial-gradient(circle at 20% -25%, rgba(124,58,237,0.2), rgba(15,17,26,0.97) 45%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.22)",
          }}
        >
          <Image
            src="/logo.png"
            alt="TENF"
            width={56}
            height={56}
            className="h-12 w-12 object-contain md:h-14 md:w-14"
            priority
          />
          <div className="hidden sm:block leading-tight">
            <p className="text-base md:text-lg font-semibold tracking-[0.01em]" style={{ color: "var(--color-text)" }}>
              Espace Admin
            </p>
            <p className="text-[11px] md:text-xs tracking-[0.08em] uppercase" style={{ color: "rgba(148,163,184,0.85)" }}>
              TENF Control Center
            </p>
          </div>
        </Link>

        <nav
          className="hidden lg:flex flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border px-4 py-3"
          style={{
            borderColor: "rgba(148,163,184,0.2)",
            background:
              "radial-gradient(circle at 20% -20%, rgba(124,58,237,0.22), rgba(15,17,26,0.96) 36%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 28px rgba(0,0,0,0.25)",
          }}
        >
          <p
            className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(148,163,184,0.8)" }}
          >
            Navigation principale
          </p>
          {navRows.map((row, rowIndex) => (
            <div key={`admin-nav-row-${rowIndex}`} className="flex flex-wrap items-center justify-center gap-2">
              {row.map((hub) => {
                const isActive = activeHub?.href === hub.href;
                return (
                  <Link
                    key={hub.href}
                    href={hub.href}
                    className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_18px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(37,99,235,0.16))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
                      borderColor: isActive ? "rgba(167,139,250,0.46)" : "rgba(148,163,184,0.26)",
                      color: isActive ? "#eef2ff" : "rgba(226,232,240,0.95)",
                      boxShadow: isActive
                        ? "inset 0 1px 0 rgba(255,255,255,0.12)"
                        : "inset 0 1px 0 rgba(255,255,255,0.08)",
                      textShadow: "none",
                    }}
                  >
                    {hub.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 self-center rounded-2xl border px-2.5 py-2" style={{ borderColor: "rgba(148,163,184,0.2)", background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          {canAccessAdvanced &&
            (adminMode === "advanced" ? (
              <button
                type="button"
                onClick={() => {
                  document.cookie = `${ADMIN_MODE_COOKIE}=; path=/; max-age=0`;
                  setAdminMode("simple");
                  router.refresh();
                }}
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderColor: "rgba(148,163,184,0.26)",
                  color: "rgba(226,232,240,0.95)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                Mode simple
              </button>
            ) : (
              <Link
                href="/admin/avance"
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderColor: "rgba(148,163,184,0.26)",
                  color: "rgba(226,232,240,0.95)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                Mode avancé
              </Link>
            ))}
          <div
            className="px-3 py-2 rounded-xl border"
            style={{
              borderColor: "rgba(148,163,184,0.26)",
              color: "var(--color-text)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-xs sm:text-sm">
              Bonjour, <span className="font-semibold">{username}</span>
            </p>
            {(pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/pilotage")) && (
              <p className="mt-1 max-w-[320px] text-[11px] leading-relaxed text-gray-300">
                Merci pour ton aide précieuse, <span className="font-semibold">{username}</span>. Au nom des fondateurs{" "}
                <span className="font-semibold text-[#e6c773]">Clara, Nexou et Red</span>.
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
