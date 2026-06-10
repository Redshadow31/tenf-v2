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
 * Promotion interne TENF Développement → Affilié (hors raccourci Nouveau → Affilié).
 */
export function hasDevelopmentToAffiliatePromotion(
  roleHistory: Member["roleHistory"] | undefined | null
): boolean {
  const history = roleHistory || [];
  for (const raw of history) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as { fromRole?: string; toRole?: string };
    const toRole = o.toRole ? toCanonicalMemberRole(o.toRole) : null;
    const fromRole = o.fromRole ? toCanonicalMemberRole(o.fromRole) : null;
    if (fromRole === "Développement" && toRole === "Affilié") {
      return true;
    }
  }
  return false;
}

export function isTenfAffiliateAfterJoin(
  member: Pick<Member, "role" | "roleHistory">
): boolean {
  if (toCanonicalMemberRole(member.role) !== "Affilié") return false;
  return hasDevelopmentToAffiliatePromotion(member.roleHistory);
}

/** Membre rôle Affilié promu depuis Développement (parcours TENF complet). */
export function isTenfAffiliateMember(
  member: Pick<Member, "role" | "roleHistory">
): boolean {
  return toCanonicalMemberRole(member.role) === "Affilié" && isTenfAffiliateAfterJoin(member);
}

export function filterTenfAffiliateMembers(members: Member[]): Member[] {
  return members.filter(isTenfAffiliateMember);
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
    return isTenfAffiliateMember(member);
  }

  if (statusTab === "communaute") {
    return member.statut === "Inactif" && isCommunityRoleMember(role);
  }

  if (statusTab === "suivi_pause") {
    return (
      member.statut === "Inactif" &&
      !isStaffRoleForGestionPopulation(member.role) &&
      !isCommunityRoleMember(role) &&
      role !== "Nouveau" &&
      !(role === "Affilié" && isTenfAffiliateAfterJoin(member))
    );
  }

  if (statusTab === "actifs") {
    return isGestionActifsPopulationMember(member);
  }

  return false;
}

export type GestionActifsPopulationInput = {
  role?: string | null;
  isActive?: boolean | null;
  statut?: "Actif" | "Inactif";
};

/**
 * Population « Actifs » de la gestion membres : intégrés actifs + staff (hors Nouveau, Départ, Banni).
 * Source unique pour l’onglet admin et les compteurs publics (accueil, /membres, /lives).
 */
export function isGestionActifsPopulationMember(member: GestionActifsPopulationInput | Member): boolean {
  const role = toCanonicalMemberRole(member.role || "Affilié");
  if (isExitMemberRole(role)) return false;
  if (role === "Nouveau") return false;

  const statut =
    "statut" in member && member.statut
      ? member.statut
      : member.isActive !== false
        ? "Actif"
        : "Inactif";

  return statut === "Actif" || isStaffRoleForGestionPopulation(role);
}

/** Staff : même périmètre que memberListHelpers (visible dans Actifs même inactif). */
export function isStaffRoleForGestionPopulation(role: MemberRole | string): boolean {
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

/**
 * Filtre indépendant par onglet — les populations peuvent se chevaucher
 * (ex. Actif + Affilié TENF + VIP via les filtres rapides).
 */
export function filterMembersForStatusTab(members: Member[], statusTab: GestionStatusTab): Member[] {
  if (statusTab === "archives") return [];
  return members.filter((member) => memberBelongsToStatusTab(member, statusTab));
}

/** Compteurs et listes par onglet, sans répartition exclusive. */
export function buildStatusTabPopulations(members: Member[]): Record<GestionStatusTab, Member[]> {
  const buckets = Object.fromEntries(
    GESTION_STATUS_TAB_ORDER.map((tab) => [tab, [] as Member[]])
  ) as Record<GestionStatusTab, Member[]>;

  for (const tab of GESTION_STATUS_TAB_ORDER) {
    if (tab === "archives") continue;
    buckets[tab] = filterMembersForStatusTab(members, tab);
  }

  return buckets;
}

/** @deprecated Préférer buildStatusTabPopulations — les onglets ne sont plus exclusifs. */
export function partitionMembersByStatusTab(members: Member[]): Record<GestionStatusTab, Member[]> {
  return buildStatusTabPopulations(members);
}
