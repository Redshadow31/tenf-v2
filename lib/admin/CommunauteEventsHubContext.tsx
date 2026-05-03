"use client";

import { createContext, useContext } from "react";

const CommunauteEventsHubContext = createContext(false);

/** Actif pour toutes les routes sous `/admin/communaute/evenements/*`. */
export function CommunauteEventsHubProvider({ children }: { children: React.ReactNode }) {
  return <CommunauteEventsHubContext.Provider value={true}>{children}</CommunauteEventsHubContext.Provider>;
}

export function useCommunauteEventsHub(): boolean {
  return useContext(CommunauteEventsHubContext);
}
