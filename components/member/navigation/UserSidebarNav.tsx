"use client";

import { Link2, Search, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { SidebarNavSection } from "@/lib/navigation/memberSidebar";
import { memberSidebarAdminMoreItems, memberSidebarAdminShortcuts, memberSidebarSections } from "@/lib/navigation/memberSidebar";
import SidebarSection from "@/components/member/navigation/SidebarSection";
import UserSidebarNavLink from "@/components/member/navigation/UserSidebarNavLink";
import UserSidebarAdminBlock from "@/components/member/navigation/UserSidebarAdminBlock";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type InjectedItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  external?: boolean;
  keywords?: string[];
  disabled?: boolean;
  disabledHint?: string;
};

type UserSidebarNavProps = {
  pathname: string;
  hasAdminAccess: boolean;
  twitchLinked: boolean | null;
  unreadNotifications: number;
  onNavigate?: () => void;
  onRequestCollapseDesktop?: () => void;
  showDesktopCollapse?: boolean;
};

export default function UserSidebarNav({
  pathname,
  hasAdminAccess,
  twitchLinked,
  unreadNotifications,
  onNavigate,
  onRequestCollapseDesktop,
  showDesktopCollapse,
}: UserSidebarNavProps) {
  const [navSearch, setNavSearch] = useState("");

  const normalizedQuery = useMemo(() => normalizeText(navSearch), [navSearch]);

  const filterItem = (item: { label: string; keywords?: string[] }, section: SidebarNavSection) => {
    if (normalizedQuery.length === 0) return true;
    const q = normalizedQuery;
    if (normalizeText(item.label).includes(q)) return true;
    if (normalizeText(section.title).includes(q)) return true;
    if (normalizeText(section.id).includes(q)) return true;
    if (item.keywords?.some((k) => normalizeText(k).includes(q))) return true;
    return false;
  };

  const sectionsToRender = memberSidebarSections;

  const safeCallbackPath =
    pathname && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/member/profil/completer";
  const directTwitchLinkHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(safeCallbackPath)}`;

  return (
    <>
      <div
        className="rounded-xl border p-2.5"
        style={{ borderColor: "rgba(139, 92, 246, 0.28)", backgroundColor: "rgba(0,0,0,0.18)" }}
      >
        <label
          htmlFor="member-sidebar-search"
          className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-200/90"
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Recherche rapide
        </label>
        <input
          id="member-sidebar-search"
          value={navSearch}
          onChange={(e) => setNavSearch(e.target.value)}
          placeholder="Ex. live, raids, formations…"
          autoComplete="off"
          className="w-full min-h-[44px] rounded-lg border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
          style={{
            borderColor: "rgba(139, 92, 246, 0.3)",
            backgroundColor: "rgba(8,8,12,0.55)",
            color: "var(--color-text)",
          }}
        />
      </div>

      <nav className="space-y-4 pb-1" aria-label="Navigation espace membre">
        {sectionsToRender.map((section, idx) => {
          let items: InjectedItem[] = [...section.items];

          if (section.id === "home") {
            items = [
              ...items,
              {
                href: twitchLinked ? "/member/profil" : directTwitchLinkHref,
                label:
                  twitchLinked === null
                    ? "État de la liaison Twitch…"
                    : twitchLinked
                      ? "Chaîne Twitch liée (voir profil)"
                      : "Lier ma chaîne Twitch",
                icon: Link2,
                external: false,
                keywords: ["twitch", "lier", "oauth", "stream"],
              },
            ];
          }

          const filtered = items.filter((item) => filterItem(item, section));
          if (filtered.length === 0) return null;

          const sectionUnread = section.id === "home" && unreadNotifications > 0;

          // Une section est ouverte par défaut si elle contient l’URL active
          // OU si la recherche est active (utile de tout révéler).
          const containsActive = filtered.some(
            (item) => pathname === item.href || (item.href.startsWith("/") && item.href !== "/" && pathname.startsWith(`${item.href}/`)),
          );
          const defaultOpen = containsActive || normalizedQuery.length > 0 || section.id === "home";

          return (
            <div key={section.id}>
              {idx > 0 ? <div className="mb-4 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" aria-hidden /> : null}
              <SidebarSection
                id={section.id}
                title={section.title}
                showAttentionDot={sectionUnread}
                defaultOpen={defaultOpen}
                count={filtered.length}
              >
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {filtered.map((item) => {
                    const active =
                      !item.disabled &&
                      (pathname === item.href ||
                        (item.href.startsWith("/") && item.href !== "/" && pathname.startsWith(`${item.href}/`)));
                    return (
                      <li key={`${section.id}-${item.href}-${item.label}`}>
                        <UserSidebarNavLink
                          href={item.href}
                          label={item.label}
                          active={active}
                          icon={item.icon}
                          external={item.external}
                          disabled={item.disabled}
                          disabledHint={item.disabledHint}
                          showUnreadDot={item.href === "/member/notifications" && unreadNotifications > 0}
                          onNavigate={onNavigate}
                        />
                      </li>
                    );
                  })}
                </ul>
              </SidebarSection>
            </div>
          );
        })}

        {hasAdminAccess ? (
          <UserSidebarAdminBlock
            shortcuts={memberSidebarAdminShortcuts}
            moreItems={memberSidebarAdminMoreItems}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : null}
      </nav>

      {showDesktopCollapse ? (
        <div className="hidden pt-2 xl:block">
          <button
            type="button"
            onClick={onRequestCollapseDesktop}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
            style={{
              borderColor: "rgba(139, 92, 246, 0.28)",
              backgroundColor: "rgba(139, 92, 246, 0.08)",
              color: "var(--color-text)",
            }}
            aria-label="Masquer le menu membre"
          >
            Masquer le menu
          </button>
        </div>
      ) : null}
    </>
  );
}
