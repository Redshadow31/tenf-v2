/**
 * Filtres de l'organigramme public — alignés sur la nomenclature staff TENF (2025+).
 */
import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Crown,
  HeartHandshake,
  Network,
  PauseCircle,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { OrgChartEntry, OrgChartRoleKey } from "@/lib/staff/orgChartTypes";
import { isOrgChartActiveOrganigrammeRole } from "@/lib/staff/orgChartRoleHelpers";

export type OrgChartFilterKey =
  | "all"
  | "founders"
  | "coordination"
  | "moderation"
  | "mod_active"
  | "mod_confirmed"
  | "mod_pathway"
  | "mod_pause"
  | "appui";

export const ORG_CHART_ROLE_GROUPS: Record<Exclude<OrgChartFilterKey, "all">, OrgChartRoleKey[]> = {
  founders: ["FONDATEUR"],
  coordination: ["ADMIN_COORDINATEUR"],
  moderation: [
    "MODERATEUR",
    "MODERATEUR_AUTONOMIE",
    "MODERATEUR_ACCOMPAGNEMENT",
    "MODERATEUR_DECOUVERTE",
    "MODERATEUR_EN_FORMATION",
    "MODERATEUR_EN_PAUSE",
  ],
  mod_active: [
    "MODERATEUR",
    "MODERATEUR_AUTONOMIE",
    "MODERATEUR_ACCOMPAGNEMENT",
    "MODERATEUR_DECOUVERTE",
    "MODERATEUR_EN_FORMATION",
  ],
  mod_confirmed: ["MODERATEUR", "MODERATEUR_AUTONOMIE"],
  mod_pathway: ["MODERATEUR_DECOUVERTE", "MODERATEUR_ACCOMPAGNEMENT", "MODERATEUR_EN_FORMATION"],
  mod_pause: ["MODERATEUR_EN_PAUSE"],
  appui: ["SOUTIEN_TENF", "CONTRIBUTEUR_INVITE"],
};

export const ORG_CHART_QUICK_TILES: Array<{
  filter: Exclude<OrgChartFilterKey, "all" | "moderation">;
  label: string;
  hint: string;
  accent: string;
  Icon: LucideIcon;
}> = [
  {
    filter: "founders",
    label: "Fondateurs TENF",
    hint: "Vision & pilotage",
    accent: "#3b82f6",
    Icon: Crown,
  },
  {
    filter: "coordination",
    label: "Coordinateurs TENF",
    hint: "Lien entre les pôles",
    accent: "#6366f1",
    Icon: Network,
  },
  {
    filter: "mod_confirmed",
    label: "Modération confirmée",
    hint: "Modérateur TENF & autonomie",
    accent: "#a855f7",
    Icon: ShieldCheck,
  },
  {
    filter: "mod_pathway",
    label: "Parcours modération",
    hint: "Découverte & accompagnement",
    accent: "#c084fc",
    Icon: BookOpenCheck,
  },
  {
    filter: "mod_pause",
    label: "En pause",
    hint: "Hiatus temporaire",
    accent: "#94a3b8",
    Icon: PauseCircle,
  },
  {
    filter: "appui",
    label: "Soutien & invités",
    hint: "Missions actives en cours",
    accent: "#22c55e",
    Icon: HeartHandshake,
  },
];

export const ORG_CHART_FILTERS: Array<{ key: OrgChartFilterKey; label: string; description: string }> = [
  { key: "all", label: "Toute l'équipe", description: "Vue complète des profils publics" },
  ...ORG_CHART_QUICK_TILES.map((tile) => ({
    key: tile.filter,
    label: tile.label,
    description: tile.hint,
  })),
  {
    key: "mod_active",
    label: "Modération active",
    description: "Modérateurs en activité (hors pause)",
  },
  {
    key: "moderation",
    label: "Toute la modération",
    description: "Tous les paliers modération (confirmés, parcours, pause)",
  },
];

export function matchesOrgChartFilter(entry: OrgChartEntry, filter: OrgChartFilterKey): boolean {
  if (!isOrgChartActiveOrganigrammeRole(entry.roleKey)) return false;
  if (filter === "all") return true;
  if (filter === "appui") {
    return (
      ORG_CHART_ROLE_GROUPS.appui.includes(entry.roleKey) || entry.statusKey === "SUPPORT"
    );
  }
  return ORG_CHART_ROLE_GROUPS[filter].includes(entry.roleKey);
}

export function countOrgChartByFilter(
  entries: OrgChartEntry[],
  filter: Exclude<OrgChartFilterKey, "all">,
): number {
  return entries.filter((entry) => matchesOrgChartFilter(entry, filter)).length;
}

export function orgChartFilterIcon(filter: OrgChartFilterKey): LucideIcon | undefined {
  if (filter === "all") return Users;
  if (filter === "moderation" || filter === "mod_active") return Shield;
  const tile = ORG_CHART_QUICK_TILES.find((t) => t.filter === filter);
  return tile?.Icon;
}

export function isOrgChartModeratorOnPause(entry: OrgChartEntry): boolean {
  return entry.roleKey === "MODERATEUR_EN_PAUSE";
}

export function isOrgChartActiveModerator(entry: OrgChartEntry): boolean {
  return ORG_CHART_ROLE_GROUPS.moderation.includes(entry.roleKey) && !isOrgChartModeratorOnPause(entry);
}

export const ORG_CHART_TIER_FILTER: Record<
  "founders" | "adminCoordinators" | "moderators" | "moderatorsPaused" | "support",
  OrgChartFilterKey
> = {
  founders: "founders",
  adminCoordinators: "coordination",
  moderators: "mod_active",
  moderatorsPaused: "mod_pause",
  support: "appui",
};
