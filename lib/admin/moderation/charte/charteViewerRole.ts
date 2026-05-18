import type { CharteAudience, CharteSection } from "@/components/admin/moderation/charte/charteModerationContent";
import { CHARTE_SECTIONS } from "@/components/admin/moderation/charte/charteModerationContent";
import {
  normalizeAdminRole,
  getRoleDisplayName,
  type AdminRole,
} from "@/lib/adminRoles";
import { normalizeStaffPeriods, type StaffPeriod } from "@/lib/admin/members-gestion/staffPeriods";

export type CharteViewerProfile = {
  adminRole: AdminRole | null;
  roleLabel: string;
  charteAudience: CharteAudience | null;
  /** Extrait de l'article 4 — ligne correspondant au profil */
  roleBrief: string | null;
  reducedActivityActive: boolean;
};

const ROLE_BULLET_PREFIX: Partial<Record<CharteAudience, string>> = {
  fondateur: "Fondateur —",
  admin: "Admin coordinateur —",
  moderateur: "Modérateur confirmé —",
  decouverte: "Modérateur en découverte —",
  accompagnement: "Modérateur en accompagnement —",
  pause: "Modérateur en pause —",
  activite_reduite: "Modérateur en activité réduite —",
  soutien: "Soutien TENF —",
  ancien_staff: "Ancien staff",
};

function hasOngoingReducedActivity(periods: StaffPeriod[] | undefined, now = new Date()): boolean {
  return normalizeStaffPeriods(periods as unknown[]).some((p) => {
    if (p.type !== "reduced_activity") return false;
    if (p.to) {
      const end = new Date(p.to);
      if (!Number.isNaN(end.getTime()) && end < now) return false;
    }
    return true;
  });
}

export function adminRoleToCharteAudience(
  role: AdminRole | null,
  reducedActivityActive: boolean,
): CharteAudience | null {
  if (!role) return null;
  if (role === "MODERATEUR_EN_PAUSE") return "pause";
  if (reducedActivityActive && role !== "FONDATEUR" && role !== "ADMIN_COORDINATEUR") {
    return "activite_reduite";
  }
  switch (role) {
    case "FONDATEUR":
      return "fondateur";
    case "ADMIN_COORDINATEUR":
      return "admin";
    case "MODERATEUR":
    case "MODERATEUR_AUTONOMIE":
      return "moderateur";
    case "MODERATEUR_ACCOMPAGNEMENT":
      return "accompagnement";
    case "MODERATEUR_DECOUVERTE":
      return "decouverte";
    case "SOUTIEN_TENF":
      return "soutien";
    default:
      return null;
  }
}

export function getRoleBriefForAudience(audience: CharteAudience | null): string | null {
  if (!audience) return null;
  const article4 = CHARTE_SECTIONS.find((s) => s.id === 4);
  if (!article4?.bullets?.length) return null;

  const prefix = ROLE_BULLET_PREFIX[audience];
  if (!prefix) return null;

  const line =
    article4.bullets.find((b) => b.startsWith(prefix)) ??
    (audience === "ancien_staff"
      ? article4.bullets.find((b) => b.toLowerCase().includes("ancien staff"))
      : undefined);

  return line ?? null;
}

/** Article pertinent pour le profil connecté (lecture ciblée). */
export function isSectionRelevantForViewer(
  section: Pick<CharteSection, "audiences">,
  viewerAudience: CharteAudience | null,
): boolean {
  if (!viewerAudience) return true;
  if (viewerAudience === "fondateur" || viewerAudience === "admin") return true;

  const aud = section.audiences;
  if (aud.includes("tous")) return true;
  if (aud.includes(viewerAudience)) return true;

  if (
    (viewerAudience === "decouverte" || viewerAudience === "accompagnement" || viewerAudience === "activite_reduite") &&
    aud.includes("moderateur")
  ) {
    return true;
  }

  if (viewerAudience === "moderateur" && aud.includes("soutien")) {
    return false;
  }

  return false;
}

export function resolveCharteViewerProfile(params: {
  adminRole: string | null | undefined;
  staffPeriods?: unknown[] | null;
}): CharteViewerProfile {
  const adminRole = normalizeAdminRole(params.adminRole);
  const reducedActivityActive = hasOngoingReducedActivity(
    normalizeStaffPeriods(params.staffPeriods as unknown[]),
  );
  const charteAudience = adminRoleToCharteAudience(adminRole, reducedActivityActive);
  const roleLabel = adminRole ? getRoleDisplayName(adminRole) : "Profil staff";

  return {
    adminRole,
    roleLabel,
    charteAudience,
    roleBrief: getRoleBriefForAudience(charteAudience),
    reducedActivityActive,
  };
}
