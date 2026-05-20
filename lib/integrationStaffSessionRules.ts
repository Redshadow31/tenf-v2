import type { ModeratorRegistration } from "@/lib/integrationModeratorsStorage";

/** Modérateur admin requis par session (hors fondateurs). */
export const REQUIRED_ADMIN_MODERATORS = 1;

/** Minimum de staff « classiques » en plus de l'admin. */
export const MIN_STAFF_BESIDES_ADMIN = 1;

/** Maximum de staff « classiques » en plus de l'admin (fondateurs exclus). */
export const MAX_STAFF_BESIDES_ADMIN = 2;

export type StaffRegistrationKind = "founder" | "admin_moderator" | "staff";

export type StaffSessionStaffingStats = {
  total: number;
  founderCount: number;
  adminModeratorCount: number;
  staffCount: number;
  isFullyStaffed: boolean;
  status: "ok" | "partial" | "critical";
};

function normalizeRoleText(role: string): string {
  return role.trim().toLowerCase();
}

function isFounderRoleLabel(role: string, roleKey?: string | null): boolean {
  if (roleKey === "FONDATEUR" || roleKey === "FOUNDER") return true;
  const r = normalizeRoleText(role);
  return r.includes("fondateur") || r.includes("founder");
}

function isAdminModeratorRoleLabel(role: string, roleKey?: string | null): boolean {
  if (roleKey === "ADMIN_COORDINATEUR" || roleKey === "ADMIN_ADJOINT") return true;
  if (isFounderRoleLabel(role, roleKey)) return false;
  const r = normalizeRoleText(role);
  return r.includes("admin") || r.includes("coordinateur");
}

export function classifyStaffRegistration(
  role: string,
  roleKey?: string | null,
): StaffRegistrationKind {
  if (isFounderRoleLabel(role, roleKey)) return "founder";
  if (isAdminModeratorRoleLabel(role, roleKey)) return "admin_moderator";
  return "staff";
}

export function computeStaffSessionStaffing(
  registrations: Array<Pick<ModeratorRegistration, "role"> & { roleKey?: string | null }>,
): StaffSessionStaffingStats {
  let founderCount = 0;
  let adminModeratorCount = 0;
  let staffCount = 0;

  for (const r of registrations) {
    const kind = classifyStaffRegistration(r.role, r.roleKey);
    if (kind === "founder") founderCount += 1;
    else if (kind === "admin_moderator") adminModeratorCount += 1;
    else staffCount += 1;
  }

  const isFullyStaffed =
    adminModeratorCount >= REQUIRED_ADMIN_MODERATORS &&
    staffCount >= MIN_STAFF_BESIDES_ADMIN &&
    staffCount <= MAX_STAFF_BESIDES_ADMIN;

  let status: StaffSessionStaffingStats["status"] = "critical";
  if (isFullyStaffed) {
    status = "ok";
  } else if (
    adminModeratorCount >= REQUIRED_ADMIN_MODERATORS ||
    staffCount >= MIN_STAFF_BESIDES_ADMIN ||
    founderCount > 0
  ) {
    status = "partial";
  }

  return {
    total: registrations.length,
    founderCount,
    adminModeratorCount,
    staffCount,
    isFullyStaffed,
    status,
  };
}

export function validateStaffRegistration(
  existing: Array<Pick<ModeratorRegistration, "pseudo" | "role"> & { roleKey?: string | null }>,
  registration: { pseudo: string; role: string; roleKey?: string | null },
): { ok: true } | { ok: false; error: string; code: string } {
  const kind = classifyStaffRegistration(registration.role, registration.roleKey);
  const stats = computeStaffSessionStaffing(existing);

  if (kind === "admin_moderator" && stats.adminModeratorCount >= REQUIRED_ADMIN_MODERATORS) {
    return {
      ok: false,
      code: "ADMIN_SLOT_FULL",
      error: "Un modérateur admin est déjà inscrit sur cette session.",
    };
  }

  if (kind === "staff" && stats.staffCount >= MAX_STAFF_BESIDES_ADMIN) {
    return {
      ok: false,
      code: "STAFF_SLOT_FULL",
      error: `Maximum ${MAX_STAFF_BESIDES_ADMIN} staff (hors admin et fondateurs) déjà inscrits.`,
    };
  }

  return { ok: true };
}

export function staffingBadgeLabel(stats: StaffSessionStaffingStats): string {
  return `Admin ${stats.adminModeratorCount}/${REQUIRED_ADMIN_MODERATORS} · Staff ${stats.staffCount}/${MAX_STAFF_BESIDES_ADMIN}`;
}

export function staffingStatusLabel(stats: StaffSessionStaffingStats): string {
  if (stats.status === "ok") return "Conforme";
  if (stats.adminModeratorCount < REQUIRED_ADMIN_MODERATORS) {
    return `Manque modérateur admin (${stats.adminModeratorCount}/${REQUIRED_ADMIN_MODERATORS})`;
  }
  if (stats.staffCount < MIN_STAFF_BESIDES_ADMIN) {
    return `Manque staff (${stats.staffCount}/${MIN_STAFF_BESIDES_ADMIN} min)`;
  }
  if (stats.staffCount > MAX_STAFF_BESIDES_ADMIN) {
    return `Trop de staff (${stats.staffCount}/${MAX_STAFF_BESIDES_ADMIN} max)`;
  }
  return "Partiel";
}
