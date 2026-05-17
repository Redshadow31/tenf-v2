import type { AuthenticatedAdmin } from "@/lib/requireAdmin";

const ANALYSIS_EDIT_ROLES = new Set([
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
]);

const STAFF_MOD_ROLES = new Set([
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_AUTONOMIE",
  "MODERATEUR_ACCOMPAGNEMENT",
  "MODERATEUR_DECOUVERTE",
  "MODERATEUR_EN_PAUSE",
  "SOUTIEN_TENF",
  "CONTRIBUTEUR_INVITE",
]);

export function canAccessStaffQuestionnaire(admin: AuthenticatedAdmin): boolean {
  return STAFF_MOD_ROLES.has(admin.role);
}

export function canManageStaffQuestionnaireAdmin(admin: AuthenticatedAdmin): boolean {
  return ANALYSIS_EDIT_ROLES.has(admin.role) || admin.role === "FONDATEUR";
}

export function canEditQuestionnaireAnalysis(admin: AuthenticatedAdmin): boolean {
  return ANALYSIS_EDIT_ROLES.has(admin.role);
}

export function canExportStaffQuestionnaire(admin: AuthenticatedAdmin): boolean {
  return canManageStaffQuestionnaireAdmin(admin);
}
