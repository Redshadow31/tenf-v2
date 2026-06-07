import type { AdminRole } from "@/lib/adminRoles";
import { DEV_ADMIN_ROLE_PREVIEW_COOKIE } from "@/lib/admin/devRolePreviewLabels";

/** Client : localhost + build dev uniquement. */
export function isLocalDevAdminToolsEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function readDevAdminRolePreviewCookie(): AdminRole | "" {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${DEV_ADMIN_ROLE_PREVIEW_COOKIE}=([^;]*)`),
  );
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]) as AdminRole;
  } catch {
    return "";
  }
}

export function writeDevAdminRolePreviewCookie(role: AdminRole | ""): void {
  if (typeof document === "undefined") return;
  if (!role) {
    document.cookie = `${DEV_ADMIN_ROLE_PREVIEW_COOKIE}=; path=/; max-age=0`;
    return;
  }
  document.cookie = `${DEV_ADMIN_ROLE_PREVIEW_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}
