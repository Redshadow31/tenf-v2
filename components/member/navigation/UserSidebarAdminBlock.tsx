"use client";

import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import type { SidebarNavItem } from "@/lib/navigation/memberSidebar";
import UserSidebarNavLink from "@/components/member/navigation/UserSidebarNavLink";

type UserSidebarAdminBlockProps = {
  shortcuts: SidebarNavItem[];
  moreItems: SidebarNavItem[];
  pathname: string;
  onNavigate?: () => void;
};

export default function UserSidebarAdminBlock({ shortcuts, moreItems, pathname, onNavigate }: UserSidebarAdminBlockProps) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-3.5">
      <div className="flex items-start gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-200">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-200/90">Espace staff</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Ces liens ouvrent l’administration TENF (<span className="font-mono text-[11px]">/admin</span>) — hors espace membre classique.
          </p>
        </div>
      </div>

      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2.5 text-sm font-bold text-amber-50 transition-colors hover:bg-amber-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
      >
        Ouvrir l’espace admin
        <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      </Link>

      <ul className="m-0 mt-3 list-none space-y-1 p-0">
        {shortcuts.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <UserSidebarNavLink
                href={item.href}
                label={item.label}
                active={active}
                icon={item.icon}
                onNavigate={onNavigate}
              />
            </li>
          );
        })}
      </ul>

      <details className="mt-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-400">
        <summary className="cursor-pointer select-none font-semibold text-zinc-300 hover:text-white">Plus d’outils admin</summary>
        <ul className="m-0 mt-2 list-none space-y-1 p-0">
          {moreItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <UserSidebarNavLink
                  href={item.href}
                  label={item.label}
                  active={active}
                  icon={item.icon}
                  onNavigate={onNavigate}
                />
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
