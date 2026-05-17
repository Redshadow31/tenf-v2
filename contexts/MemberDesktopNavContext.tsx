"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "tenf-member-sidebar-desktop-collapsed";

type MemberDesktopNavContextValue = {
  /** Collapsed uniquement pertinent sur l’espace membre / annuaire connecté. */
  isMemberArea: boolean;
  desktopCollapsed: boolean;
  /** Largeur sidebar = 0 sur desktop xl+ quand membre et replié. */
  effectiveDesktopCollapsed: boolean;
  prefersReducedMotion: boolean;
  setDesktopCollapsed: (next: boolean) => void;
  toggleDesktopCollapsed: () => void;
};

const MemberDesktopNavContext = createContext<MemberDesktopNavContextValue | null>(null);

export function MemberDesktopNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isMemberArea = pathname.startsWith("/member") || pathname.startsWith("/membres");

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

  const effectiveDesktopCollapsed = Boolean(hydrated && isMemberArea && desktopCollapsed);

  const value = useMemo(
    () => ({
      isMemberArea,
      desktopCollapsed,
      effectiveDesktopCollapsed,
      prefersReducedMotion,
      setDesktopCollapsed,
      toggleDesktopCollapsed,
    }),
    [
      desktopCollapsed,
      effectiveDesktopCollapsed,
      isMemberArea,
      prefersReducedMotion,
      setDesktopCollapsed,
      toggleDesktopCollapsed,
    ],
  );

  return <MemberDesktopNavContext.Provider value={value}>{children}</MemberDesktopNavContext.Provider>;
}

export function useMemberDesktopNav(): MemberDesktopNavContextValue {
  const ctx = useContext(MemberDesktopNavContext);
  if (!ctx) {
    throw new Error("useMemberDesktopNav doit être utilisé sous MemberDesktopNavProvider");
  }
  return ctx;
}

/** Pour le Header : pas d’erreur si le provider n’est pas monté (tests isolés). */
export function useMemberDesktopNavOptional(): MemberDesktopNavContextValue | null {
  return useContext(MemberDesktopNavContext);
}
