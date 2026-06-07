import { ADMIN_ROLE_ORDER, type AdminRole } from "@/lib/adminRoles";

export const DEV_ADMIN_ROLE_PREVIEW_COOKIE = "tenf_dev_admin_role_preview";

const ROLE_PREVIEW_LABELS: Record<AdminRole, string> = {
  FONDATEUR: "Fondateur·rice TENF",
  ADMIN_COORDINATEUR: "Admin coordinateur·rice",
  MODERATEUR: "Modérateur·rice",
  MODERATEUR_AUTONOMIE: "Modérateur·rice en autonomie",
  MODERATEUR_ACCOMPAGNEMENT: "Modérateur·rice en accompagnement",
  MODERATEUR_DECOUVERTE: "Modérateur·rice en découverte",
  MODERATEUR_EN_PAUSE: "Modérateur·rice en pause",
  SOUTIEN_TENF: "Soutien TENF",
  CONTRIBUTEUR_INVITE: "Contributeur·rice invité(e)",
};

export function getDevRolePreviewLabel(role: AdminRole): string {
  return ROLE_PREVIEW_LABELS[role] ?? role.replace(/_/g, " ");
}

export const DEV_ADMIN_ROLE_PREVIEW_OPTIONS = ADMIN_ROLE_ORDER.map((role) => ({
  value: role,
  label: getDevRolePreviewLabel(role),
}));
