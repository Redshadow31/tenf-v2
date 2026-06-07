/**
 * Types & constantes pour l'organigramme staff TENF.
 *
 * IMPORTANT : les clés (OrgChartRoleKey / OrgChartPoleKey) sont conservées
 * telles quelles pour ne pas casser les données existantes en base
 * (`staff_org_chart_entries.role_key`, `pole_key`, `pole_label`).
 *
 * Les LABELS sont alignés sur la nouvelle nomenclature TENF
 * (Fondateurs / Coordinateurs / 3 paliers modérateur / Soutien / Contributeur Invité,
 *  9 pôles de mission). Voir `lib/staff/staffNomenclature.ts` pour la source de
 *  vérité humaine (descriptions, missions, icônes, mapping legacy).
 *
 * - ORG_CHART_ROLE_OPTIONS / ORG_CHART_POLE_OPTIONS : options visibles dans
 *   les sélecteurs d'édition (nouveaux choix uniquement).
 * - LEGACY_*_KEY_LABELS : mapping rétrocompatible pour afficher correctement
 *   les enregistrements déjà persistés avec d'anciennes clés.
 */

export type OrgChartRoleKey =
  // Rôles principaux historiques (préservés pour la rétrocompatibilité)
  | "FONDATEUR"
  | "ADMIN_COORDINATEUR"
  | "MODERATEUR"
  | "MODERATEUR_EN_FORMATION"
  | "MODERATEUR_EN_PAUSE"
  | "SOUTIEN_TENF"
  | "ANCIEN_STAFF_TENF"
  // Nouveaux paliers introduits par la refonte de l'organisation
  | "MODERATEUR_AUTONOMIE"
  | "MODERATEUR_ACCOMPAGNEMENT"
  | "MODERATEUR_DECOUVERTE"
  | "CONTRIBUTEUR_INVITE";

export type OrgChartStatusKey = "ACTIVE" | "TRAINING" | "PAUSED" | "SUPPORT" | "REMERCIE";

export type OrgChartPoleKey =
  // Pôles historiques (préservés)
  | "POLE_ANIMATION_EVENTS"
  | "POLE_COMMUNICATION_VISUALS"
  | "POLE_FORMATION_COORD_MEMBERS"
  | "POLE_FORMATION_COORD_STAFF"
  | "POLE_TECH_BOTS"
  | "POLE_ACCUEIL_INTEGRATION"
  // Nouveaux pôles introduits par la refonte
  | "POLE_VISION_PILOTAGE"
  | "POLE_COORDINATION"
  | "POLE_VIE_STAFF"
  | "POLE_VEILLE_SITUATIONS_SENSIBLES";

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
  poleKey?: OrgChartPoleKey | null;
  poleLabel?: string | null;
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

/**
 * Options proposées dans les sélecteurs d'édition de l'organigramme
 * (uniquement les rôles actuellement attribuables).
 */
export const ORG_CHART_ROLE_OPTIONS: Array<{ key: OrgChartRoleKey; label: string }> = [
  { key: "FONDATEUR", label: "Fondateurs TENF" },
  { key: "ADMIN_COORDINATEUR", label: "Coordinateurs TENF" },
  { key: "MODERATEUR", label: "Modérateur TENF" },
  { key: "MODERATEUR_AUTONOMIE", label: "Modérateur en Autonomie" },
  { key: "MODERATEUR_ACCOMPAGNEMENT", label: "Modérateur en Accompagnement" },
  { key: "MODERATEUR_DECOUVERTE", label: "Modérateur en Découverte" },
  { key: "MODERATEUR_EN_PAUSE", label: "Modérateur en pause" },
  { key: "SOUTIEN_TENF", label: "Soutien TENF" },
  { key: "CONTRIBUTEUR_INVITE", label: "Contributeur Invité TENF" },
  { key: "ANCIEN_STAFF_TENF", label: "Ancien Staff TENF" },
];

/**
 * Labels rétrocompatibles : permet d'afficher correctement les enregistrements
 * persistés avec d'anciennes clés (typiquement MODERATEUR_EN_FORMATION).
 * Ces entrées ne sont pas affichées dans les nouveaux sélecteurs.
 */
export const LEGACY_ROLE_KEY_LABELS: Partial<Record<OrgChartRoleKey, string>> = {
  MODERATEUR_EN_FORMATION: "Modérateur en Accompagnement",
};

export const ORG_CHART_STATUS_OPTIONS: Array<{ key: OrgChartStatusKey; label: string }> = [
  { key: "ACTIVE", label: "Actif" },
  { key: "TRAINING", label: "En formation" },
  { key: "PAUSED", label: "En pause" },
  { key: "SUPPORT", label: "Soutien" },
  { key: "REMERCIE", label: "Remercié" },
];

/**
 * Options proposées dans les sélecteurs d'édition de l'organigramme
 * (uniquement les pôles actuels selon la nouvelle nomenclature).
 */
export const ORG_CHART_POLE_OPTIONS: Array<{ key: OrgChartPoleKey; label: string; emoji: string }> = [
  { key: "POLE_VISION_PILOTAGE", label: "Pôle Vision & Pilotage", emoji: "🧭" },
  { key: "POLE_COORDINATION", label: "Pôle Coordination", emoji: "🔗" },
  { key: "POLE_VIE_STAFF", label: "Pôle Vie Staff", emoji: "💬" },
  { key: "POLE_FORMATION_COORD_STAFF", label: "Pôle Cadre & Formation Staff", emoji: "🛡️" },
  { key: "POLE_ACCUEIL_INTEGRATION", label: "Pôle Parcours Membres", emoji: "🤝" },
  { key: "POLE_ANIMATION_EVENTS", label: "Pôle Animations & Ateliers Créateurs", emoji: "🩷" },
  { key: "POLE_COMMUNICATION_VISUALS", label: "Pôle Image & Rayonnement", emoji: "📣" },
  { key: "POLE_TECH_BOTS", label: "Pôle Outils & Développement", emoji: "🛠️" },
  { key: "POLE_VEILLE_SITUATIONS_SENSIBLES", label: "Pôle Veille & Situations Sensibles", emoji: "🛟" },
];

/**
 * Mapping rétrocompatible : permet d'afficher correctement les pôles legacy
 * encore présents dans les enregistrements existants.
 */
export const LEGACY_POLE_KEY_LABELS: Partial<Record<OrgChartPoleKey, { label: string; emoji: string }>> = {
  POLE_FORMATION_COORD_MEMBERS: { label: "Pôle Parcours Membres", emoji: "🤝" },
};

export function roleLabelFromKey(roleKey: OrgChartRoleKey): string {
  return (
    ORG_CHART_ROLE_OPTIONS.find((x) => x.key === roleKey)?.label ||
    LEGACY_ROLE_KEY_LABELS[roleKey] ||
    "Rôle"
  );
}

export function statusLabelFromKey(statusKey: OrgChartStatusKey): string {
  return ORG_CHART_STATUS_OPTIONS.find((x) => x.key === statusKey)?.label || "Statut";
}

export function poleLabelFromKey(poleKey: OrgChartPoleKey): string {
  return (
    ORG_CHART_POLE_OPTIONS.find((x) => x.key === poleKey)?.label ||
    LEGACY_POLE_KEY_LABELS[poleKey]?.label ||
    "Pôle"
  );
}

export function poleTagFromKey(poleKey: OrgChartPoleKey): OrgChartPoleTag {
  const found = ORG_CHART_POLE_OPTIONS.find((x) => x.key === poleKey);
  if (found) return found;
  const legacy = LEGACY_POLE_KEY_LABELS[poleKey];
  if (legacy) return { key: poleKey, label: legacy.label, emoji: legacy.emoji };
  return { key: poleKey, label: poleLabelFromKey(poleKey), emoji: "•" };
}
