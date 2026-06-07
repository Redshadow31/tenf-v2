"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type MemberSidebarSearchContextValue = {
  query: string;
  setQuery: (next: string) => void;
  clearQuery: () => void;
};

const MemberSidebarSearchContext = createContext<MemberSidebarSearchContextValue | null>(null);

export function MemberSidebarSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [query, setQueryState] = useState("");

  useEffect(() => {
    setQueryState("");
  }, [pathname]);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState("");
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      clearQuery,
    }),
    [clearQuery, query, setQuery],
  );

  return <MemberSidebarSearchContext.Provider value={value}>{children}</MemberSidebarSearchContext.Provider>;
}

export function useMemberSidebarSearch(): MemberSidebarSearchContextValue {
  const ctx = useContext(MemberSidebarSearchContext);
  if (!ctx) {
    throw new Error("useMemberSidebarSearch doit être utilisé sous MemberSidebarSearchProvider");
  }
  return ctx;
}

export function useMemberSidebarSearchOptional(): MemberSidebarSearchContextValue | null {
  return useContext(MemberSidebarSearchContext);
}
