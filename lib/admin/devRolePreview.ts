import { cookies } from "next/headers";
import { normalizeAdminRole, type AdminRole } from "@/lib/adminRoles";
import { DEV_ADMIN_ROLE_PREVIEW_COOKIE } from "@/lib/admin/devRolePreviewLabels";

export { DEV_ADMIN_ROLE_PREVIEW_COOKIE, DEV_ADMIN_ROLE_PREVIEW_OPTIONS, getDevRolePreviewLabel } from "@/lib/admin/devRolePreviewLabels";

/** Serveur : outils de prévisualisation rôle (dev uniquement). */
export function isDevRolePreviewEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function getDevAdminRolePreview(): Promise<AdminRole | null> {
  if (!isDevRolePreviewEnvironment()) return null;
  try {
    const jar = await cookies();
    const raw = jar.get(DEV_ADMIN_ROLE_PREVIEW_COOKIE)?.value;
    if (!raw || raw === "none") return null;
    return normalizeAdminRole(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export async function isDevAdminRolePreviewActive(): Promise<boolean> {
  return (await getDevAdminRolePreview()) !== null;
}
