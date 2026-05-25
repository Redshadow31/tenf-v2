import { toCanonicalMemberRole } from "@/lib/memberRoles";
import type { Member, MemberRole } from "./types";

/** Onglets population de la page gestion membres. */
export type GestionStatusTab =
  | "actifs"
  | "communaute"
  | "suivi_pause"
  | "nouveaux"
  | "affilies"
  | "departs"
  | "bans"
  | "archives";

export const GESTION_STATUS_TAB_ORDER: GestionStatusTab[] = [
  "actifs",
  "communaute",
  "suivi_pause",
  "nouveaux",
  "affilies",
  "departs",
  "bans",
  "archives",
];

/** Compat deep links : ancien onglet « inactifs » → suivi pause. */
export function parseGestionStatusTabFromUrl(tabParam: string | null): GestionStatusTab | null {
  if (!tabParam) return null;
  if (tabParam === "inactifs") return "suivi_pause";
  if (GESTION_STATUS_TAB_ORDER.includes(tabParam as GestionStatusTab)) {
    return tabParam as GestionStatusTab;
  }
  return null;
}

export function isExitMemberRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const canonical = toCanonicalMemberRole(role.trim());
  return canonical === "Départ" || canonical === "Banni";
}

/**
 * Affiliation Twitch obtenue après l'intégration TENF (promotion en Affilié ou date Twitch post-intégration).
 */
export function isTenfAffiliateAfterJoin(
  member: Pick<Member, "role" | "roleHistory" | "twitchAffiliateDate" | "integrationDate">
): boolean {
  if (toCanonicalMemberRole(member.role) !== "Affilié") return false;

  const history = member.roleHistory || [];
  for (const raw of history) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as { fromRole?: string; toRole?: string; kind?: string };
    const toRole = o.toRole ? toCanonicalMemberRole(o.toRole) : null;
    const fromRole = o.fromRole ? toCanonicalMemberRole(o.fromRole) : null;
    if (toRole === "Affilié" && fromRole && fromRole !== "Affilié") {
      return true;
    }
  }

  if (member.twitchAffiliateDate && member.integrationDate) {
    const affMs = new Date(member.twitchAffiliateDate).getTime();
    const integMs = new Date(member.integrationDate).getTime();
    if (Number.isFinite(affMs) && Number.isFinite(integMs) && affMs > integMs) {
      return true;
    }
  }

  return false;
}

export function isCommunityRoleMember(role: MemberRole | string): boolean {
  return toCanonicalMemberRole(role) === "Communauté";
}

export function memberBelongsToStatusTab(member: Member, statusTab: GestionStatusTab): boolean {
  if (statusTab === "archives") return false;

  const role = toCanonicalMemberRole(member.role);
  if (isExitMemberRole(role)) {
    return statusTab === "departs" ? role === "Départ" : statusTab === "bans" ? role === "Banni" : false;
  }

  if (statusTab === "departs" || statusTab === "bans") return false;

  if (statusTab === "nouveaux") return role === "Nouveau";

  if (statusTab === "affilies") {
    return role === "Affilié" && isTenfAffiliateAfterJoin(member);
  }

  if (statusTab === "communaute") {
    return member.statut === "Inactif" && isCommunityRoleMember(role);
  }

  if (statusTab === "suivi_pause") {
    return (
      member.statut === "Inactif" &&
      !isStaffRoleForTab(member.role) &&
      !isCommunityRoleMember(role) &&
      role !== "Nouveau" &&
      !(role === "Affilié" && isTenfAffiliateAfterJoin(member))
    );
  }

  if (statusTab === "actifs") {
    return (member.statut === "Actif" || isStaffRoleForTab(member.role)) && role !== "Nouveau";
  }

  return false;
}

/** Staff : même périmètre que memberListHelpers (visible dans Actifs même inactif). */
function isStaffRoleForTab(role: MemberRole | string): boolean {
  const STAFF = new Set([
    "Admin",
    "Admin Coordinateur",
    "Modérateur",
    "Modérateur en formation",
    "Modérateur en Découverte",
    "Modérateur en Accompagnement",
    "Modérateur en Autonomie",
    "Modérateur en activité réduite",
    "Modérateur en pause",
    "Soutien TENF",
    "Contributeur Invité TENF",
    "Admin Adjoint",
    "Mentor",
    "Modérateur Junior",
  ]);
  return STAFF.has(role as MemberRole) || STAFF.has(toCanonicalMemberRole(role));
}

export function partitionMembersByStatusTab(members: Member[]): Record<GestionStatusTab, Member[]> {
  const buckets = Object.fromEntries(
    GESTION_STATUS_TAB_ORDER.map((tab) => [tab, [] as Member[]])
  ) as Record<GestionStatusTab, Member[]>;

  for (const member of members) {
    for (const tab of GESTION_STATUS_TAB_ORDER) {
      if (tab === "archives") continue;
      if (memberBelongsToStatusTab(member, tab)) {
        buckets[tab].push(member);
        break;
      }
    }
  }

  return buckets;
}
