export type OrgChartRoleKey =
  | "FONDATEUR"
  | "ADMIN_COORDINATEUR"
  | "MODERATEUR"
  | "MODERATEUR_EN_FORMATION"
  | "MODERATEUR_EN_PAUSE"
  | "SOUTIEN_TENF";

export type OrgChartStatusKey = "ACTIVE" | "TRAINING" | "PAUSED" | "SUPPORT";

export type OrgChartPoleKey =
  | "POLE_ANIMATION_EVENTS"
  | "POLE_COMMUNICATION_VISUALS"
  | "POLE_FORMATION_COORD_MEMBERS"
  | "POLE_FORMATION_COORD_STAFF"
  | "POLE_TECH_BOTS"
  | "POLE_ACCUEIL_INTEGRATION";

export interface OrgChartMemberRef {
  id: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  avatarUrl?: string;
  role?: string;
  isActive?: boolean;
}

export interface OrgChartEntry {
  id: string;
  memberId: string;
  roleKey: OrgChartRoleKey;
  roleLabel: string;
  statusKey: OrgChartStatusKey;
  statusLabel: string;
  poleKey: OrgChartPoleKey;
  poleLabel: string;
  secondaryPoleKeys: OrgChartPoleKey[];
  bioShort: string;
  displayOrder: number;
  isVisible: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  member: OrgChartMemberRef;
}

export interface OrgChartPoleTag {
  key: OrgChartPoleKey;
  label: string;
  emoji: string;
}

export const ORG_CHART_ROLE_OPTIONS: Array<{ key: OrgChartRoleKey; label: string }> = [
  { key: "FONDATEUR", label: "Fondateur" },
  { key: "ADMIN_COORDINATEUR", label: "Admin coordinateur" },
  { key: "MODERATEUR", label: "Modérateur actif" },
  { key: "MODERATEUR_EN_FORMATION", label: "Modérateur en formation" },
  { key: "MODERATEUR_EN_PAUSE", label: "Modérateur en pause" },
  { key: "SOUTIEN_TENF", label: "Soutien TENF" },
];

export const ORG_CHART_STATUS_OPTIONS: Array<{ key: OrgChartStatusKey; label: string }> = [
  { key: "ACTIVE", label: "Actif" },
  { key: "TRAINING", label: "En formation" },
  { key: "PAUSED", label: "En pause" },
  { key: "SUPPORT", label: "Soutien" },
];

export const ORG_CHART_POLE_OPTIONS: Array<{ key: OrgChartPoleKey; label: string; emoji: string }> = [
  { key: "POLE_ANIMATION_EVENTS", label: "Pôle Animation & Événements", emoji: "🩷" },
  { key: "POLE_COMMUNICATION_VISUALS", label: "Pôle Communication & Visuels", emoji: "🟦" },
  { key: "POLE_FORMATION_COORD_MEMBERS", label: "Pôle Formation & Coordination Membres", emoji: "🟨" },
  { key: "POLE_FORMATION_COORD_STAFF", label: "Pôle Formation & Coordination Staff", emoji: "🟨" },
  { key: "POLE_TECH_BOTS", label: "Pôle Technique & Bots", emoji: "🟪" },
  { key: "POLE_ACCUEIL_INTEGRATION", label: "Pôle Accueil & Intégration", emoji: "🟧" },
];

export function roleLabelFromKey(roleKey: OrgChartRoleKey): string {
  return ORG_CHART_ROLE_OPTIONS.find((x) => x.key === roleKey)?.label || "Rôle";
}

export function statusLabelFromKey(statusKey: OrgChartStatusKey): string {
  return ORG_CHART_STATUS_OPTIONS.find((x) => x.key === statusKey)?.label || "Statut";
}

export function poleLabelFromKey(poleKey: OrgChartPoleKey): string {
  return ORG_CHART_POLE_OPTIONS.find((x) => x.key === poleKey)?.label || "Pôle";
}

export function poleTagFromKey(poleKey: OrgChartPoleKey): OrgChartPoleTag {
  const found = ORG_CHART_POLE_OPTIONS.find((x) => x.key === poleKey);
  return found || { key: poleKey, label: poleLabelFromKey(poleKey), emoji: "•" };
}
