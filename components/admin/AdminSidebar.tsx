"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PanelLeftClose, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useMobileAdminViewport } from "@/lib/hooks/useMobileViewport";
import { useAdminDesktopNav } from "@/contexts/AdminDesktopNavContext";
import {
  findActiveHub,
  getNavigationByMode,
  type AdminMode,
  type NavItem,
} from "@/lib/admin/navigation";
import { useFilteredAdminNav } from "@/components/admin/AdminNavAccessContext";
import AdminHubContextCard from "@/components/admin/sidebar/AdminHubContextCard";
import AdminSidebarSection from "@/components/admin/sidebar/AdminSidebarSection";
import AdminSidebarItem from "@/components/admin/sidebar/AdminSidebarItem";
import { getAdminHubDescription } from "@/components/admin/sidebar/hubDescriptions";

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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Compte récursivement les liens "feuille" (pages réelles) dans un hub. */
function countLeafPages(items: NavItem[]): number {
  let total = 0;
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      total += countLeafPages(item.children);
    } else {
      total += 1;
    }
  }
  return total;
}

export default function AdminSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const isMobileViewport = useMobileAdminViewport();
  const { effectiveDesktopCollapsed, prefersReducedMotion, setDesktopCollapsed } = useAdminDesktopNav();
  useBodyScrollLock(isMobileOpen && isMobileViewport);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [canAccessAdvanced, setCanAccessAdvanced] = useState(false);
  const [adminMode, setAdminMode] = useState<AdminMode>("simple");
  const [navReady, setNavReady] = useState(false);
  const [evaluationV2Validated, setEvaluationV2Validated] = useState<boolean | null>(null);

  const baseNavItems = useMemo(() => getNavigationByMode(adminMode), [adminMode]);
  const navItems = useFilteredAdminNav(baseNavItems);
  const activeHub = useMemo(
    () => findActiveHub(navItems, pathname || "/admin"),
    [navItems, pathname]
  );
  const hubChildren = useMemo<NavItem[]>(() => {
    if (!activeHub) return [];
    if (activeHub.children && activeHub.children.length > 0) return activeHub.children;
    return [activeHub];
  }, [activeHub]);

  /**
   * Tri visuel des enfants directs : items simples en haut (regroupés sous
   * "Accès rapide"), catégories (avec enfants) en dessous.
   */
  const { quickAccess, categories } = useMemo(() => {
    const quick: NavItem[] = [];
    const cats: NavItem[] = [];
    for (const child of hubChildren) {
      if (child.children && child.children.length > 0) cats.push(child);
      else quick.push(child);
    }
    return { quickAccess: quick, categories: cats };
  }, [hubChildren]);

  const hubDescription = useMemo(
    () => getAdminHubDescription(activeHub?.href),
    [activeHub]
  );
  const totalPages = useMemo(
    () => (activeHub ? countLeafPages(hubChildren) : 0),
    [activeHub, hubChildren]
  );

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
        const res = await fetch(
          `/api/evaluations/v2/validation?month=${month}&system=new`,
          { cache: "no-store" }
        );
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
    hubChildren.forEach((item) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navReady, adminMode, hubChildren]);

  useEffect(() => {
    if (!isMobileOpen) return;
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isMobileViewport && isMobileOpen) {
      onCloseMobile?.();
    }
  }, [isMobileViewport, isMobileOpen, onCloseMobile]);

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

  function isActive(item: NavItem): boolean {
    if (!pathname) return false;
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
    if (!item.children || item.children.length === 0) return false;
    return item.children.some((child) => isActive(child));
  }

  function isParentActive(item: NavItem): boolean {
    if (!pathname) return false;
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
    if (item.children) {
      return item.children.some((child) => {
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

  function renderV2Badge(item: NavItem) {
    const showV2ValidationBadge =
      item.href === EVALUATION_V2_ITEM_HREF && evaluationV2Validated !== null;
    if (!showV2ValidationBadge) return null;
    return (
      <span
        className={
          "inline-flex items-center rounded-full border px-1.5 py-[1px] text-[10px] font-semibold " +
          (evaluationV2Validated
            ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
            : "border-amber-400/35 bg-amber-500/10 text-amber-200")
        }
      >
        {evaluationV2Validated ? "Valide" : "À valider"}
      </span>
    );
  }

  /** Rendu récursif d'un sous-item (depth ≥ 1). */
  function renderSubItem(item: NavItem, depth: 1 | 2 = 1): JSX.Element {
    const active = isActive(item);
    const parentActive = isParentActive(item);
    const hasChildren = !!item.children?.length;
    const open = openMenus.has(item.href);
    const badge = renderV2Badge(item);
    const iconChar = typeof item.icon === "string" ? item.icon : null;

    if (hasChildren) {
      return (
        <AdminSidebarItem
          key={item.href}
          href={item.href}
          label={item.label}
          depth={depth}
          active={active}
          parentActive={parentActive}
          badge={badge}
          iconChar={iconChar}
          expandable
          open={open}
          onToggle={() => toggleMenu(item.href)}
        >
          {item.children!.map((child) =>
            renderSubItem(child, (depth === 1 ? 2 : 2) as 2)
          )}
        </AdminSidebarItem>
      );
    }

    return (
      <AdminSidebarItem
        key={item.href}
        href={item.href}
        label={item.label}
        depth={depth}
        active={active}
        parentActive={parentActive}
        badge={badge}
        iconChar={iconChar}
      />
    );
  }

  const sectionsHaveContent = quickAccess.length > 0 || categories.length > 0;

  const renderSidebarContent = (showDesktopCollapse: boolean) => (
    <>
      <div className="relative">
        {showDesktopCollapse ? (
          <button
            type="button"
            onClick={() => setDesktopCollapsed(true)}
            className="absolute right-0 top-0 z-10 hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-zinc-400 transition hover:border-violet-400/35 hover:text-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/55 lg:inline-flex"
            aria-label="Masquer le menu admin"
            title="Masquer le menu"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <AdminHubContextCard
          hubLabel={activeHub?.label ?? null}
          hubIcon={activeHub?.icon ?? null}
          description={hubDescription}
          mode={adminMode}
          itemsCount={totalPages}
        />
      </div>

      {sectionsHaveContent ? (
        <nav
          className="mt-4 space-y-3 rounded-2xl border border-white/[0.05] bg-gradient-to-b from-violet-500/[0.03] via-transparent to-indigo-500/[0.04] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          aria-label="Navigation du hub admin"
        >
          {quickAccess.length > 0 ? (
            <AdminSidebarSection
              id="quick-access"
              label="Accès rapide"
              defaultOpen
              count={quickAccess.length}
            >
              {quickAccess.map((item) => renderSubItem(item, 1))}
            </AdminSidebarSection>
          ) : null}

          {categories.map((category, idx) => {
            const sectionId = slugify(category.href || category.label) || `cat-${idx}`;
            const childCount = category.children?.length ?? 0;
            const containsActive = isParentActive(category);
            const iconChar = typeof category.icon === "string" ? category.icon : undefined;

            return (
              <AdminSidebarSection
                key={category.href}
                id={sectionId}
                label={category.label}
                icon={iconChar}
                count={childCount}
                defaultOpen={containsActive || idx === 0}
              >
                {category.children!.map((child) => renderSubItem(child, 1))}
              </AdminSidebarSection>
            );
          })}
        </nav>
      ) : (
        <p className="mt-3.5 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-[11px] leading-snug text-zinc-500">
          Aucun module accessible dans ce hub avec ton profil actuel.
        </p>
      )}

      {navReady && adminMode === "advanced" && !canAccessAdvanced && (
        <div
          className="mt-4 rounded-lg border border-rose-300/20 bg-rose-500/[0.04] px-3 py-2 text-xs leading-snug text-rose-100/85"
          role="status"
        >
          Mode avancé désactivé (droits insuffisants). Retour au mode simple appliqué.
        </div>
      )}

      <div className="mt-5 pt-4">
        <div
          className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-violet-400/30 via-indigo-400/20 to-transparent"
          aria-hidden
        />
        <Link
          href="/"
          className="group inline-flex w-full items-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-transparent via-white/[0.02] to-transparent px-3 py-2 text-[13px] font-medium text-zinc-400 transition-all duration-200 hover:border-violet-400/15 hover:from-violet-500/[0.06] hover:via-indigo-500/[0.04] hover:to-transparent hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:-translate-x-0.5 group-hover:text-violet-300"
            aria-hidden
          />
          Retour au site
        </Link>
      </div>
    </>
  );

  const desktopBackground = {
    background:
      "linear-gradient(180deg, rgba(17,18,28,0.96) 0%, rgba(11,11,18,0.985) 60%, rgba(9,9,14,0.99) 100%)",
    borderColor: "rgba(99,102,241,0.10)",
    scrollbarWidth: "thin" as const,
    scrollbarColor: "#3b3650 transparent",
  };

  const desktopAsideClass =
    "hidden lg:block admin-sidebar-scroll border-r h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto px-4 py-4 " +
    (effectiveDesktopCollapsed
      ? "w-0 min-w-0 max-w-0 border-transparent px-0 opacity-0 pointer-events-none overflow-hidden"
      : "w-80 min-w-[17.5rem] max-w-[min(22rem,92vw)] opacity-100") +
    (prefersReducedMotion ? "" : " transition-[width,opacity,padding] duration-200 ease-out");

  return (
    <>
      <aside className={desktopAsideClass} style={desktopBackground}>
        {renderSidebarContent(true)}
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation admin"
        >
          <button
            type="button"
            className="absolute inset-0 animate-[admin-sidebar-backdrop-fade_0.2s_ease-out] bg-black/65 backdrop-blur-sm motion-reduce:animate-none"
            onClick={onCloseMobile}
            aria-label="Fermer le menu admin"
          />
          <aside
            className="relative admin-sidebar-scroll h-full w-[min(20rem,92vw)] max-w-sm overflow-y-auto border-r px-3.5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl motion-reduce:animate-none animate-[admin-sidebar-slide-in_0.25s_ease-out]"
            style={desktopBackground}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200/85">
                Navigation admin
              </p>
              <button
                type="button"
                onClick={onCloseMobile}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/55"
                aria-label="Fermer le menu admin"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      <style jsx global>{`
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.20);
          border-radius: 999px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.32);
        }
      `}</style>
    </>
  );
}
