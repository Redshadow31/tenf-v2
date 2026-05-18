"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getNavItemIcon, NAV_GROUP_THEME, type NavGroupTheme } from "@/lib/navigation/publicHeaderNavMeta";

export type NavDropdownItem = {
  href: string;
  label: string;
  description?: string;
};

export type NavDropdownGroup = {
  id: string;
  label: string;
  description: string;
  items: NavDropdownItem[];
};

type NavMenuItemProps = {
  item: NavDropdownItem;
  groupTheme: NavGroupTheme;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
};

export function NavMenuItemLink({ item, groupTheme, active, onNavigate, compact }: NavMenuItemProps) {
  const ItemIcon = getNavItemIcon(item.href);

  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      className={`group/nav-item flex items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45 ${
        compact ? "py-2" : ""
      }`}
      style={{
        backgroundColor: active ? `${groupTheme.accent}18` : "transparent",
        borderColor: active ? `${groupTheme.accent}44` : "transparent",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.backgroundColor = `${groupTheme.accent}12`;
        e.currentTarget.style.borderColor = `${groupTheme.accent}28`;
      }}
      onMouseLeave={(e) => {
        if (active) {
          e.currentTarget.style.backgroundColor = `${groupTheme.accent}18`;
          e.currentTarget.style.borderColor = `${groupTheme.accent}44`;
          return;
        }
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] transition-transform duration-200 group-hover/nav-item:scale-[1.03]"
        style={{
          backgroundColor: active ? `${groupTheme.accent}28` : `${groupTheme.accent}14`,
          color: groupTheme.accent,
        }}
      >
        <ItemIcon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
            {item.label}
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover/nav-item:translate-x-0.5 group-hover/nav-item:opacity-60"
            style={{ color: groupTheme.accent }}
            aria-hidden
          />
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

type NavDropdownPanelProps = {
  group: NavDropdownGroup;
  pathname: string | null;
  onClose: () => void;
};

function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}

export function NavDropdownPanel({ group, pathname, onClose }: NavDropdownPanelProps) {
  const theme = NAV_GROUP_THEME[group.id] ?? NAV_GROUP_THEME["tenf-plus"];
  const GroupIcon = theme.icon;
  const twoColumns = group.items.length > 6;
  const panelWidth = twoColumns ? "min(36rem, calc(100vw - 1.5rem))" : "min(22rem, calc(100vw - 1.5rem))";

  return (
    <div
      id={`nav-menu-${group.id}`}
      role="menu"
      aria-labelledby={`nav-trigger-${group.id}`}
      className="absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 overflow-hidden rounded-2xl border p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{
        width: panelWidth,
        borderColor: "rgba(255,255,255,0.08)",
        background:
          "linear-gradient(165deg, color-mix(in srgb, var(--color-card) 94%, transparent) 0%, color-mix(in srgb, var(--color-bg) 98%, transparent) 100%)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}88, transparent)` }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -left-12 -top-10 h-32 w-32 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${theme.accent}30, transparent 70%)` }}
        aria-hidden
      />

      <div className="relative mb-2 flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5"
        style={{ backgroundColor: `${theme.accent}10` }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
          style={{ backgroundColor: `${theme.accent}22`, color: theme.accent }}
        >
          <GroupIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
            {group.label}
          </p>
          <p className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
            {group.description}
          </p>
        </div>
      </div>

      <ul className={twoColumns ? "grid grid-cols-1 gap-0.5 sm:grid-cols-2" : "space-y-0.5"}>
        {group.items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href} role="none">
              <NavMenuItemLink item={item} groupTheme={theme} active={active} onNavigate={onClose} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
