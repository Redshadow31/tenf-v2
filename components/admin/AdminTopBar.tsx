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
        const [advancedRes, user] = await Promise.all([
          fetch("/api/admin/advanced-access?check=1", { cache: "no-store" }),
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

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-[#0f111a]/90"
      style={{ borderColor: "var(--color-sidebar-border)", backgroundColor: "var(--color-bg)" }}
    >
      <div className="h-20 px-4 md:px-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text)" }}
          aria-label="Ouvrir le menu admin"
        >
          ☰
        </button>

        <Link href="/admin/pilotage" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="TENF"
            width={42}
            height={42}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="hidden sm:inline text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Espace Admin
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
          {navItems.map((hub) => {
            const isActive = activeHub?.href === hub.href;
            return (
              <Link
                key={hub.href}
                href={hub.href}
                className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border"
                style={{
                  backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                  borderColor: isActive ? "var(--color-primary)" : "var(--color-sidebar-border)",
                  color: isActive ? "white" : "var(--color-text-secondary)",
                }}
              >
                {hub.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {canAccessAdvanced &&
            (adminMode === "advanced" ? (
              <button
                type="button"
                onClick={() => {
                  document.cookie = `${ADMIN_MODE_COOKIE}=; path=/; max-age=0`;
                  setAdminMode("simple");
                  router.refresh();
                }}
                className="hidden md:inline-flex px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text-secondary)" }}
              >
                Mode simple
              </button>
            ) : (
              <Link
                href="/admin/avance"
                className="hidden md:inline-flex px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text-secondary)" }}
              >
                Mode avancé
              </Link>
            ))}
          <div
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text)" }}
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
