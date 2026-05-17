/**
 * Types et constantes partagés par les composants du module
 * /admin/communaute/engagement/follow (et /admin/engagement/follow legacy).
 *
 * Ce fichier ne contient PAS de logique métier — uniquement des contrats de
 * données et des libellés UI. La logique snapshot / polling reste dans
 * `app/admin/engagement/follow/page.tsx` et `lib/admin/followEngagement.ts`.
 */

export type FollowState = "ok" | "not_linked" | "calculation_impossible";

export type FollowOverviewRow = {
  discordId: string | null;
  displayName: string;
  memberTwitchLogin: string;
  linkedTwitchLogin: string | null;
  linkedTwitchDisplayName: string | null;
  followedCount: number | null;
  totalActiveTenfChannels: number;
  followRate: number | null;
  lastCalculatedAt: string | null;
  state: FollowState;
  reason: string | null;
  snapshotId?: string;
  snapshotGeneratedAt?: string;
  isStaleFromPreviousSnapshot?: boolean;
  previousFollowRate?: number | null;
  deltaFollowRate?: number | null;
};

export type FollowOverviewResponse = {
  snapshotId: string | null;
  generatedAt: string | null;
  sourceDataRetrievedAt: string | null;
  totalActiveTenfChannels: number;
  trackedMembersCount: number;
  rows: FollowOverviewRow[];
  previousSnapshotId?: string | null;
  previousGeneratedAt?: string | null;
};

export type FollowDetailChannel = {
  twitchLogin: string;
  twitchId: string | null;
  displayName: string;
  isOwnChannel: boolean;
};

export type FollowDetailPayload = {
  snapshotId: string;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  state: FollowState;
  reason: string | null;
  member: {
    discordId: string | null;
    displayName: string;
    memberTwitchLogin: string;
    linkedTwitchLogin: string | null;
    linkedTwitchDisplayName: string | null;
  };
  totals: {
    followedCount: number | null;
    totalActiveTenfChannels: number;
    followRate: number | null;
  };
  followedChannels: FollowDetailChannel[];
  notFollowedChannels: FollowDetailChannel[];
  lastCalculatedAt: string | null;
};

export type SnapshotRunResponse = {
  success: boolean;
  snapshotId: string;
  status: "running" | "completed";
  alreadyRunning: boolean;
};

export type SnapshotStatusResponse = {
  success: boolean;
  snapshot: {
    snapshotId: string;
    status: "running" | "completed" | "failed";
    generatedAt: string;
    createdAt: string;
  } | null;
};

export type StateFilter = "all" | "ok" | "not_linked" | "impossible";

export type FollowSummary = {
  totalMembers: number;
  calculableMembers: number;
  averageRate: number;
  notLinkedCount: number;
  impossibleCount: number;
};

export type FollowLayoutVariant = "hub" | "default";

export const STATE_FILTER_LABELS: Record<StateFilter, string> = {
  all: "Tous les états",
  ok: "Calculé",
  not_linked: "Non lié Twitch",
  impossible: "Calcul impossible",
};

export const STATE_FILTER_ARIA: Record<StateFilter, string> = {
  all: "Afficher tous les membres",
  ok: "Afficher les suivis calculés",
  not_linked: "Afficher les comptes Twitch non liés",
  impossible: "Afficher les calculs impossibles",
};

/** Format date FR identique à l'historique de la page (pas de changement visuel). */
export function formatFollowDate(value: string | null | undefined): string {
  if (!value) return "Indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Indisponible";
  return date.toLocaleString("fr-FR");
}
