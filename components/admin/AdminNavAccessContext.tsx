"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { filterNavTreeByAllowedHrefs } from "@/lib/admin/filterNavigationBySectionAccess";
import type { NavItem } from "@/lib/admin/navigation";
import { useAdminDevRolePreviewOptional } from "@/contexts/AdminDevRolePreviewContext";

export type AdminNavAccessState =
  | { status: "loading" }
  | { status: "ready"; bypass: true }
  | { status: "ready"; bypass: false; allowed: Set<string> };

const AdminNavAccessContext = createContext<AdminNavAccessState>({ status: "loading" });

export function AdminNavAccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminNavAccessState>({ status: "loading" });
  const previewCtx = useAdminDevRolePreviewOptional();
  const navRefreshKey = previewCtx?.navRefreshKey ?? 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ status: "loading" });
        const res = await fetch("/api/admin/nav-section-access", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "ready", bypass: true });
          return;
        }
        if (data.bypass === true) {
          setState({ status: "ready", bypass: true });
          return;
        }
        const list = Array.isArray(data.allowedHrefs) ? (data.allowedHrefs as string[]) : [];
        setState({ status: "ready", bypass: false, allowed: new Set(list) });
      } catch {
        if (!cancelled) setState({ status: "ready", bypass: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navRefreshKey]);

  return <AdminNavAccessContext.Provider value={state}>{children}</AdminNavAccessContext.Provider>;
}

export function useAdminNavAccess(): AdminNavAccessState {
  return useContext(AdminNavAccessContext);
}

export function useFilteredAdminNav(baseItems: NavItem[]): NavItem[] {
  const access = useAdminNavAccess();
  return useMemo(() => {
    if (access.status !== "ready") return baseItems;
    if (access.bypass) return baseItems;
    return filterNavTreeByAllowedHrefs(baseItems, access.allowed);
  }, [access, baseItems]);
}

export function useAdminNavHrefAllowed(href: string): boolean {
  const access = useAdminNavAccess();
  if (access.status !== "ready") return true;
  if (access.bypass) return true;
  return access.allowed.has(href);
}
