"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  findActiveHub,
  getNavigationByMode,
  type AdminMode,
  type NavItem,
} from "@/lib/admin/navigation";

const ADMIN_MODE_COOKIE = "admin_mode";

type AdminSidebarProps = {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

function getAdminModeCookie(): AdminMode {
  if (typeof document === "undefined") return "simple";
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_MODE_COOKIE}=([^;]*)`));
  const cookieValue = match ? decodeURIComponent(match[1]) : "simple";
  return cookieValue === "advanced" ? "advanced" : "simple";
}

export default function AdminSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [canAccessAdvanced, setCanAccessAdvanced] = useState(false);
  const [adminMode, setAdminMode] = useState<AdminMode>("simple");
  const [navReady, setNavReady] = useState(false);

  const navItems = useMemo(() => getNavigationByMode(adminMode), [adminMode]);
  const activeHub = useMemo(
    () => findActiveHub(navItems, pathname || "/admin"),
    [navItems, pathname]
  );
  const displayedItems = useMemo(() => {
    if (!activeHub) return [];
    if (activeHub.children && activeHub.children.length > 0) return activeHub.children;
    return [activeHub];
  }, [activeHub]);

  useEffect(() => {
    async function loadAccess() {
      const modeFromCookie = getAdminModeCookie();
      try {
        const res = await fetch("/api/admin/advanced-access?check=1", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const hasAdvanced = !!data.canAccessAdvanced;
          setCanAccessAdvanced(hasAdvanced);
          if (!hasAdvanced && modeFromCookie === "advanced") {
            setAdminMode("simple");
          } else {
            setAdminMode(modeFromCookie);
          }
        } else {
          setAdminMode(modeFromCookie);
        }
      } catch (e) {
        console.error("[AdminSidebar] Erreur vérification accès avancé:", e);
        setAdminMode(modeFromCookie);
      }
      setNavReady(true);
    }
    loadAccess();
  }, []);

  useEffect(() => {
    if (!navReady) return;
    const newOpenMenus = new Set<string>();
    displayedItems.forEach((item) => {
      if (item.children && isParentActive(item)) {
        newOpenMenus.add(item.href);
        item.children?.forEach((child) => {
          if (child.children && isParentActive(child)) {
            newOpenMenus.add(child.href);
          }
        });
      }
    });
    setOpenMenus(newOpenMenus);
  }, [pathname, navReady, adminMode, displayedItems]);

  useEffect(() => {
    if (!isMobileOpen) return;
    onCloseMobile?.();
    // ferme automatiquement le drawer mobile après navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  /**
   * Vérifie si un élément de navigation est actif
   * Logique générique: un élément est actif si pathname === href OU pathname.startsWith(href + "/")
   */
  function isActive(item: NavItem): boolean {
    if (!pathname) return false;
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
    if (!item.children || item.children.length === 0) return false;
    return item.children.some((child) => isActive(child));
  }

  /**
   * Vérifie si un élément parent est actif (soit lui-même, soit un de ses enfants)
   * Logique générique: parent actif si pathname.startsWith(parent.href) OU si un child est actif
   */
  function isParentActive(item: NavItem): boolean {
    if (!pathname) return false;
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
    if (item.children) {
      return item.children.some(child => {
        if (child.children) return isParentActive(child);
        return isActive(child);
      });
    }
    return false;
  }

  function toggleMenu(href: string) {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  }

  function renderItem(item: NavItem, depth = 0): JSX.Element {
    const active = isActive(item);
    const parentActive = isParentActive(item);
    const hasChildren = !!item.children?.length;
    const isMenuOpen = openMenus.has(item.href);
    const depthClass =
      depth === 0
        ? "text-sm"
        : depth === 1
        ? "text-sm ml-3"
        : "text-xs ml-6";

    if (hasChildren) {
      return (
        <div key={item.href} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleMenu(item.href)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${depthClass}`}
            style={{
              backgroundColor: active
                ? "var(--color-primary)"
                : parentActive
                ? "var(--color-card-hover)"
                : "transparent",
              color: active ? "white" : "var(--color-text-secondary)",
            }}
          >
            <span className="font-medium flex-1 text-left">{item.label}</span>
            <span className={`text-xs transition-transform ${isMenuOpen ? "rotate-90" : ""}`}>▶</span>
          </button>
          {isMenuOpen && (
            <div className="space-y-1">
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${depthClass}`}
        style={{
          backgroundColor: active ? "var(--color-primary)" : "transparent",
          color: active ? "white" : "var(--color-text-secondary)",
          opacity: active || depth === 0 ? "1" : "0.85",
        }}
      >
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.18em] font-semibold uppercase px-1" style={{ color: "var(--color-text-secondary)", opacity: 0.75 }}>
          {activeHub?.label || "Navigation"}
        </p>
      </div>

      <nav className="space-y-2">
        {displayedItems.map((item) => renderItem(item, 0))}
      </nav>

      {navReady && adminMode === "advanced" && !canAccessAdvanced && (
        <div className="mt-4 px-3 py-2 rounded-lg text-xs border" style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text-secondary)" }}>
          Mode avancé désactivé (droits insuffisants), retour au mode simple appliqué.
        </div>
      )}

      <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--color-border)" }}>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span>←</span>
          <span>Retour au site</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside
        className="hidden lg:block admin-sidebar-scroll w-72 max-w-[88vw] border-r h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto p-4"
        style={{
          backgroundColor: "var(--color-sidebar-bg)",
          borderColor: "var(--color-sidebar-border)",
          scrollbarWidth: "thin",
          scrollbarColor: "#353544 transparent",
        }}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <aside
            className="relative admin-sidebar-scroll h-full w-[92vw] max-w-sm border-r overflow-y-auto p-4"
            style={{
              backgroundColor: "var(--color-sidebar-bg)",
              borderColor: "var(--color-sidebar-border)",
              scrollbarWidth: "thin",
              scrollbarColor: "#353544 transparent",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Navigation admin
              </p>
              <button
                type="button"
                onClick={onCloseMobile}
                className="h-8 w-8 rounded-lg border inline-flex items-center justify-center"
                style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text)" }}
                aria-label="Fermer le menu admin"
              >
                ✕
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <style jsx global>{`
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: #353544;
          border-radius: 999px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #4a4a60;
        }
      `}</style>
    </>
  );
}

