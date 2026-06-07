import type { OrgChartRoleKey } from "@/lib/staff/orgChartTypes";

/** Rôles organigramme pour lesquels le pôle principal est facultatif. */
export const ORG_CHART_POLE_OPTIONAL_ROLE_KEYS = new Set<OrgChartRoleKey>([
  "SOUTIEN_TENF",
  "ANCIEN_STAFF_TENF",
  "CONTRIBUTEUR_INVITE",
]);

export function isOrgChartPoleOptional(roleKey: OrgChartRoleKey): boolean {
  return ORG_CHART_POLE_OPTIONAL_ROLE_KEYS.has(roleKey);
}

export function isOrgChartFormerStaff(roleKey: OrgChartRoleKey): boolean {
  return roleKey === "ANCIEN_STAFF_TENF";
}

/** Profils visibles uniquement sur la page /remerciements, pas dans l'organigramme actif. */
export function isOrgChartActiveOrganigrammeRole(roleKey: OrgChartRoleKey): boolean {
  return !isOrgChartFormerStaff(roleKey);
}
