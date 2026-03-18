"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  findActiveHub,
  getNavigationByMode,
  type AdminMode,
  type NavItem,
} from "@/lib/admin/navigation";

const ADMIN_MODE_COOKIE = "admin_mode";
const EVALUATION_V2_ITEM_HREF = "/admin/evaluation/v2";

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

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
  const [evaluationV2Validated, setEvaluationV2Validated] = useState<boolean | null>(null);

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
    let mounted = true;
    async function loadV2ValidationStatus() {
      try {
        const month = getCurrentMonthKey();
        const res = await fetch(`/api/evaluations/v2/validation?month=${month}&system=new`, { cache: "no-store" });
        if (!res.ok) {
          if (mounted) setEvaluationV2Validated(null);
          return;
        }
        const payload = await res.json().catch(() => ({}));
        if (mounted) {
          setEvaluationV2Validated(payload?.validation?.validated === true);
        }
      } catch {
        if (mounted) setEvaluationV2Validated(null);
      }
    }
    loadV2ValidationStatus();
    return () => {
      mounted = false;
    };
  }, [pathname]);

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
    const isRoot = depth === 0;
    const depthWrapperClass =
      depth === 0 ? "pl-0" : depth === 1 ? "pl-3" : "pl-6";
    const textClass = depth <= 1 ? "text-sm" : "text-xs";
    const itemBaseClass = `group w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c773]/60 ${textClass}`;
    const itemStyle = active
      ? {
          background:
            "linear-gradient(135deg, rgba(230,199,115,0.26) 0%, rgba(145,70,255,0.24) 100%)",
          borderColor: "rgba(230,199,115,0.42)",
          color: "#ffffff",
          boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
        }
      : parentActive
        ? {
            backgroundColor: "rgba(255,255,255,0.04)",
            borderColor: "rgba(230,199,115,0.25)",
            color: "var(--color-text)",
          }
        : {
            backgroundColor: "transparent",
            borderColor: "rgba(255,255,255,0.06)",
            color: "var(--color-text-secondary)",
          };

    const showV2ValidationBadge = item.href === EVALUATION_V2_ITEM_HREF && evaluationV2Validated !== null;
    const v2Badge = showV2ValidationBadge ? (
      <span
        className="ml-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
        style={
          evaluationV2Validated
            ? {
                borderColor: "rgba(34,197,94,0.5)",
                backgroundColor: "rgba(34,197,94,0.15)",
                color: "#86efac",
              }
            : {
                borderColor: "rgba(245,158,11,0.5)",
                backgroundColor: "rgba(245,158,11,0.15)",
                color: "#fcd34d",
              }
        }
      >
        {evaluationV2Validated ? "Lot valide" : "A valider"}
      </span>
    ) : null;

    const rootGroupStyle =
      isRoot && hasChildren
        ? {
            borderColor: parentActive ? "rgba(230,199,115,0.24)" : "rgba(255,255,255,0.08)",
            backgroundColor: parentActive ? "rgba(230,199,115,0.06)" : "rgba(255,255,255,0.02)",
          }
        : undefined;

    if (hasChildren) {
      return (
        <div
          key={item.href}
          className={`space-y-2 ${depthWrapperClass} ${isRoot ? "rounded-2xl border p-2" : ""}`}
          style={rootGroupStyle}
        >
          <button
            type="button"
            onClick={() => toggleMenu(item.href)}
            className={itemBaseClass}
            style={itemStyle}
            aria-expanded={isMenuOpen}
            aria-current={active ? "page" : undefined}
          >
            {isRoot ? (
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.2)" : "rgba(145,70,255,0.15)",
                  borderColor: active ? "rgba(255,255,255,0.36)" : "rgba(145,70,255,0.28)",
                  color: active ? "#fff" : "#d6b8ff",
                }}
              >
                {item.icon || "•"}
              </span>
            ) : null}
            <span className="font-medium flex-1 text-left leading-tight">
              {item.label}
              {v2Badge}
            </span>
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-all ${isMenuOpen ? "rotate-90" : ""}`}
              style={{
                borderColor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)",
                backgroundColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.04)",
              }}
            >
              <ChevronRight size={12} />
            </span>
          </button>
          {isMenuOpen && (
            <div
              className="space-y-2 animate-[fadeIn_120ms_ease]"
              style={{
                borderLeft: "1px solid rgba(230,199,115,0.22)",
                marginLeft: depth === 0 ? "0.5rem" : "0.25rem",
                paddingLeft: "0.75rem",
              }}
            >
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.href} className={depthWrapperClass}>
        <Link
          href={item.href}
          className={`${itemBaseClass} ${!active && !parentActive ? "hover:border-white/20 hover:bg-white/5 hover:text-white" : ""}`}
          style={itemStyle}
          aria-current={active ? "page" : undefined}
        >
          {isRoot ? (
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs"
              style={{
                backgroundColor: active ? "rgba(255,255,255,0.2)" : "rgba(145,70,255,0.15)",
                borderColor: active ? "rgba(255,255,255,0.36)" : "rgba(145,70,255,0.28)",
                color: active ? "#fff" : "#d6b8ff",
              }}
            >
              {item.icon || "•"}
            </span>
          ) : null}
          <span className="font-medium leading-tight">
            {item.label}
            {v2Badge}
          </span>
        </Link>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div
        className="mb-5 rounded-2xl border p-4"
        style={{
          borderColor: "rgba(230,199,115,0.26)",
          background:
            "radial-gradient(circle at top left, rgba(230,199,115,0.16), rgba(20,20,27,0.95) 45%)",
        }}
      >
        <p
          className="text-[10px] tracking-[0.2em] font-semibold uppercase"
          style={{ color: "#e6c773" }}
        >
          Navigation active
        </p>
        <p className="mt-2 text-sm font-semibold text-white">{activeHub?.label || "Navigation admin"}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {adminMode === "advanced" ? "Mode avancé" : "Mode simple"}
        </p>
      </div>

      <nav className="space-y-3">
        {displayedItems.map((item) => renderItem(item, 0))}
      </nav>

      {navReady && adminMode === "advanced" && !canAccessAdvanced && (
        <div className="mt-4 px-3 py-2 rounded-lg text-xs border" style={{ borderColor: "var(--color-sidebar-border)", color: "var(--color-text-secondary)" }}>
          Mode avancé désactivé (droits insuffisants), retour au mode simple appliqué.
        </div>
      )}

      <div className="mt-6 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors"
          style={{
            color: "var(--color-text-secondary)",
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
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
          background:
            "linear-gradient(180deg, rgba(22,22,30,0.98) 0%, rgba(15,15,22,0.98) 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          scrollbarWidth: "thin",
          scrollbarColor: "#4b425b transparent",
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
              background:
                "linear-gradient(180deg, rgba(22,22,30,0.99) 0%, rgba(15,15,22,0.99) 100%)",
              borderColor: "rgba(255,255,255,0.08)",
              scrollbarWidth: "thin",
              scrollbarColor: "#4b425b transparent",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Navigation admin
              </p>
              <button
                type="button"
                onClick={onCloseMobile}
                className="h-8 w-8 rounded-lg border inline-flex items-center justify-center transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--color-text)", backgroundColor: "rgba(255,255,255,0.03)" }}
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-1px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: #4b425b;
          border-radius: 999px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #695f7a;
        }
      `}</style>
    </>
  );
}

