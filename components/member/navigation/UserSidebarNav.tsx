"use client";

import { Link2, Search, X, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { SidebarNavSection } from "@/lib/navigation/memberSidebar";
import {
  isMemberSidebarNavItemActive,
  memberSidebarFooterLink,
  memberSidebarNavItemMatchesQuery,
  memberSidebarSections,
  normalizeMemberSidebarSearchText,
} from "@/lib/navigation/memberSidebar";
import { useMemberSidebarSearchOptional } from "@/contexts/MemberSidebarSearchContext";
import SidebarSection from "@/components/member/navigation/SidebarSection";
import UserSidebarNavLink from "@/components/member/navigation/UserSidebarNavLink";
import UserSidebarAdminBlock from "@/components/member/navigation/UserSidebarAdminBlock";

type InjectedItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  external?: boolean;
  keywords?: string[];
  activePrefixes?: string[];
  disabled?: boolean;
  disabledHint?: string;
};

type UserSidebarNavProps = {
  pathname: string;
  hasAdminAccess: boolean;
  twitchLinked: boolean | null;
  unreadNotifications: number;
  onNavigate?: () => void;
  /** Drawer mobile : champ de recherche local (header masqué). */
  showInlineSearch?: boolean;
};

export default function UserSidebarNav({
  pathname,
  hasAdminAccess,
  twitchLinked,
  unreadNotifications,
  onNavigate,
  showInlineSearch = false,
}: UserSidebarNavProps) {
  const sharedSearch = useMemberSidebarSearchOptional();
  const [localSearch, setLocalSearch] = useState("");

  const navSearch = showInlineSearch ? localSearch : (sharedSearch?.query ?? "");
  const normalizedQuery = useMemo(() => normalizeMemberSidebarSearchText(navSearch), [navSearch]);

  const filterItem = (item: { label: string; keywords?: string[] }, section: SidebarNavSection) =>
    memberSidebarNavItemMatchesQuery(navSearch, item, section);

  const sectionsToRender = memberSidebarSections;

  const safeCallbackPath =
    pathname && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/member/profil/completer";
  const directTwitchLinkHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(safeCallbackPath)}`;

  const footerLinkVisible = filterItem(memberSidebarFooterLink, { id: "learning", title: "Parcours", items: [] });

  const renderedSectionCount = sectionsToRender.reduce((count, section) => {
    let items: InjectedItem[] = [...section.items];
    if (section.id === "me") {
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
          keywords: ["twitch", "lier", "oauth", "stream"],
        },
      ];
    }
    return count + (items.filter((item) => filterItem(item, section)).length > 0 ? 1 : 0);
  }, 0);

  const hasVisibleResults = renderedSectionCount > 0 || footerLinkVisible || hasAdminAccess;

  function clearSearch() {
    if (showInlineSearch) {
      setLocalSearch("");
      return;
    }
    sharedSearch?.clearQuery();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showInlineSearch ? (
        <div
          className="shrink-0 rounded-xl border p-2.5"
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
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Ex. live, raids, formations…"
            autoComplete="off"
            className="w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
            style={{
              borderColor: "rgba(139, 92, 246, 0.3)",
              backgroundColor: "rgba(8,8,12,0.55)",
              color: "var(--color-text)",
            }}
          />
        </div>
      ) : normalizedQuery.length > 0 ? (
        <div className="shrink-0 flex items-center justify-between gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-xs text-violet-100/90">
          <span className="min-w-0 truncate">
            Filtre actif : <span className="font-semibold text-violet-50">« {navSearch.trim()} »</span>
          </span>
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-violet-200/90 transition hover:bg-violet-500/15 hover:text-white"
            aria-label="Effacer le filtre de recherche"
          >
            <X className="h-3 w-3" aria-hidden />
            Effacer
          </button>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div className="h-full min-h-0 overflow-y-auto pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent] xl:overscroll-y-contain">
          <nav className="space-y-3" aria-label="Navigation espace membre">
            {!hasVisibleResults && normalizedQuery.length > 0 ? (
              <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-400">
                Aucun lien pour « {navSearch.trim()} ». Essaie raids, profil, formations…
              </p>
            ) : null}

            {sectionsToRender.map((section, idx) => {
              let items: InjectedItem[] = [...section.items];

              if (section.id === "me") {
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

              const containsActive = filtered.some((item) => isMemberSidebarNavItemActive(pathname, item));
              const defaultOpen = containsActive || normalizedQuery.length > 0;

              return (
                <div key={section.id}>
                  {idx > 0 ? (
                    <div className="mb-3 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" aria-hidden />
                  ) : null}
                  <SidebarSection id={section.id} title={section.title} defaultOpen={defaultOpen}>
                    <ul className="m-0 list-none space-y-1 p-0">
                      {filtered.map((item) => {
                        const active = !item.disabled && isMemberSidebarNavItemActive(pathname, item);
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

            {footerLinkVisible ? (
              <div className="pt-0.5">
                <UserSidebarNavLink
                  href={memberSidebarFooterLink.href}
                  label={memberSidebarFooterLink.label}
                  active={isMemberSidebarNavItemActive(pathname, memberSidebarFooterLink)}
                  icon={memberSidebarFooterLink.icon}
                  onNavigate={onNavigate}
                  compact
                />
              </div>
            ) : null}

            {hasAdminAccess ? <UserSidebarAdminBlock onNavigate={onNavigate} /> : null}
          </nav>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[var(--color-sidebar-bg)] to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
