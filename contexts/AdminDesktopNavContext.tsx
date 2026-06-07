"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "tenf-admin-sidebar-desktop-collapsed";

type AdminDesktopNavContextValue = {
  isAdminArea: boolean;
  desktopCollapsed: boolean;
  effectiveDesktopCollapsed: boolean;
  prefersReducedMotion: boolean;
  setDesktopCollapsed: (next: boolean) => void;
  toggleDesktopCollapsed: () => void;
};

const AdminDesktopNavContext = createContext<AdminDesktopNavContextValue | null>(null);

export function AdminDesktopNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminArea = pathname.startsWith("/admin");

  const [desktopCollapsed, setDesktopCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setDesktopCollapsedState(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setDesktopCollapsed = useCallback((next: boolean) => {
    setDesktopCollapsedState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDesktopCollapsed = useCallback(() => {
    setDesktopCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const effectiveDesktopCollapsed = Boolean(hydrated && isAdminArea && desktopCollapsed);

  const value = useMemo(
    () => ({
      isAdminArea,
      desktopCollapsed,
      effectiveDesktopCollapsed,
      prefersReducedMotion,
      setDesktopCollapsed,
      toggleDesktopCollapsed,
    }),
    [
      desktopCollapsed,
      effectiveDesktopCollapsed,
      isAdminArea,
      prefersReducedMotion,
      setDesktopCollapsed,
      toggleDesktopCollapsed,
    ],
  );

  return <AdminDesktopNavContext.Provider value={value}>{children}</AdminDesktopNavContext.Provider>;
}

export function useAdminDesktopNav(): AdminDesktopNavContextValue {
  const ctx = useContext(AdminDesktopNavContext);
  if (!ctx) {
    throw new Error("useAdminDesktopNav doit être utilisé sous AdminDesktopNavProvider");
  }
  return ctx;
}

export function useAdminDesktopNavOptional(): AdminDesktopNavContextValue | null {
  return useContext(AdminDesktopNavContext);
}
