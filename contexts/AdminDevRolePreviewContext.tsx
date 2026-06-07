"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/adminRoles";
import { DEV_ADMIN_ROLE_PREVIEW_OPTIONS } from "@/lib/admin/devRolePreviewLabels";
import {
  isLocalDevAdminToolsEnabled,
  readDevAdminRolePreviewCookie,
  writeDevAdminRolePreviewCookie,
} from "@/lib/admin/devRolePreviewClient";

type AdminDevRolePreviewContextValue = {
  enabled: boolean;
  previewRole: AdminRole | "";
  options: typeof DEV_ADMIN_ROLE_PREVIEW_OPTIONS;
  setPreviewRole: (role: AdminRole | "") => void;
  navRefreshKey: number;
};

const AdminDevRolePreviewContext = createContext<AdminDevRolePreviewContextValue | null>(null);

export function AdminDevRolePreviewProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [enabled] = useState(() => isLocalDevAdminToolsEnabled());
  const [previewRole, setPreviewRoleState] = useState<AdminRole | "">("");
  const [navRefreshKey, setNavRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    setPreviewRoleState(readDevAdminRolePreviewCookie());
  }, [enabled]);

  const setPreviewRole = useCallback(
    (role: AdminRole | "") => {
      if (!enabled) return;
      writeDevAdminRolePreviewCookie(role);
      setPreviewRoleState(role);
      setNavRefreshKey((k) => k + 1);
      router.refresh();
    },
    [enabled, router],
  );

  const value = useMemo(
    () => ({
      enabled,
      previewRole,
      options: DEV_ADMIN_ROLE_PREVIEW_OPTIONS,
      setPreviewRole,
      navRefreshKey,
    }),
    [enabled, previewRole, setPreviewRole, navRefreshKey],
  );

  return (
    <AdminDevRolePreviewContext.Provider value={value}>{children}</AdminDevRolePreviewContext.Provider>
  );
}

export function useAdminDevRolePreview(): AdminDevRolePreviewContextValue {
  const ctx = useContext(AdminDevRolePreviewContext);
  if (!ctx) {
    throw new Error("useAdminDevRolePreview doit être utilisé sous AdminDevRolePreviewProvider");
  }
  return ctx;
}

export function useAdminDevRolePreviewOptional(): AdminDevRolePreviewContextValue | null {
  return useContext(AdminDevRolePreviewContext);
}
