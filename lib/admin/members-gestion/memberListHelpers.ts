import { calendarDayKey, type SessionDayIndex } from "@/lib/integrationSessionCalendar";
import { isHonoraryStaffRole, toCanonicalMemberRole } from "@/lib/memberRoles";
import { ROLE_BADGE_PICKER_OPTIONS, sortMemberRolesForPicker } from "@/lib/roleBadgeSystem";
import { buildStatusTabPopulations, type GestionStatusTab } from "./memberPopulationFilters";
import type { Member, MemberRole, MemberStatus, PresetFilter, SortableColumn } from "./types";

export type { GestionStatusTab };

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/json")) {
    return (await response.json()) as T;
  }

  const raw = await response.text().catch(() => "");
  const preview = raw.trim().slice(0, 180).replace(/\s+/g, " ");
  throw new Error(preview ? `Reponse API non-JSON: ${preview}` : "Reponse API non-JSON.");
}

export function getPresetFilterDisplayLabel(preset: string): string {
  switch (preset) {
    case "nouveaux":
      return "Nouveaux (< 30 jours)";
    case "incomplets":
      return "À compléter";
    case "sans_twitch_id":
      return "Sans Twitch ID";
    case "sans_integration":
      return "Sans intégration";
    case "integration_session_alignee":
      return "Aligné session";
    case "vip":
      return "VIP";
    case "inactifs":
      return "En pause";
    case "revue_due":
      return "À revoir";
    case "staff":
      return "Staff";
    case "ancien_staff":
      return "Anciens staff (honorifique)";
    default:
      return preset;
  }
}

/** Normalisation pour la recherche (accents, casse, ponctuation). */
export function normalize(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getMemberCompleteness(member: Member): { percent: number; missing: string[]; label: string } {
  const checks = [
    { key: "discordId", ok: !!member.discordId, label: "ID Discord" },
    { key: "twitchId", ok: !!member.twitchId, label: "ID Twitch" },
    { key: "integrationDate", ok: !!member.integrationDate, label: "Date intégration" },
    { key: "parrain", ok: !!member.parrain, label: "Parrain" },
    { key: "description", ok: !!member.description, label: "Description" },
  ];
  const valid = checks.filter((c) => c.ok).length;
  const percent = Math.round((valid / checks.length) * 100);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const label = percent >= 80 ? "Complet" : percent >= 50 ? "Partiel" : "Incomplet";
  return { percent, missing, label };
}

const STAFF_ROLES = new Set<MemberRole | string>([
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

export function isStaffRole(role?: string): boolean {
  if (!role) return false;
  if (isHonoraryStaffRole(role)) return false;
  const canonical = toCanonicalMemberRole(role);
  return STAFF_ROLES.has(canonical) || STAFF_ROLES.has(role);
}

export function isFormerStaffHonoraryRole(role?: string): boolean {
  return isHonoraryStaffRole(role);
}

/** Tous les rôles assignables + rôles présents en base (canonisés), triés nomenclature TENF. */
export function getMemberRoleFilterOptions(existingRoles: Iterable<string | undefined | null>): string[] {
  const merged = new Set<string>();
  for (const key of ROLE_BADGE_PICKER_OPTIONS) merged.add(key);
  for (const role of existingRoles) {
    if (role?.trim()) merged.add(toCanonicalMemberRole(role.trim()));
  }
  return sortMemberRolesForPicker(merged);
}

export type MemberListPipelineInput = {
  members: Member[];
  archivedMembers: Member[];
  searchQuery: string;
  presetFilter: PresetFilter;
  roleFilter: "all" | MemberRole;
  memberStatusFilter: "all" | MemberStatus;
  joinedAfterFilter: string;
  joinedBeforeFilter: string;
  sortColumn: SortableColumn | null;
  sortDirection: "asc" | "desc";
  statusTab: GestionStatusTab;
  integrationSessionsLoaded: boolean;
  sessionDayIndex: SessionDayIndex;
};

export type MemberListPipelineOutput = {
  filteredMembers: Member[];
  filteredArchivedMembers: Member[];
  displayedMembers: Member[];
  paginatedMembers: Member[];
  totalPages: number;
  clampedCurrentPage: number;
  startIndex: number;
  startItem: number;
  endItem: number;
  newMembers: Member[];
  activeMembers: Member[];
  communityRoleMembers: Member[];
  communityFollowupMembers: Member[];
  tenfAffiliateMembers: Member[];
  departedMembers: Member[];
  bannedMembers: Member[];
  isSearching: boolean;
};

/**
 * Pipeline filtrage / tri / onglets / pagination — pur, sans effet de bord.
 * Utilisé dans useMemo côté client pour limiter les recalculs à chaque frappe.
 */
export function computeMemberListPipeline(
  input: MemberListPipelineInput,
  pageSize: number,
  currentPage: number
): MemberListPipelineOutput {
  const {
    members,
    archivedMembers,
    searchQuery,
    presetFilter,
    roleFilter,
    memberStatusFilter,
    joinedAfterFilter,
    joinedBeforeFilter,
    sortColumn,
    sortDirection,
    statusTab,
    integrationSessionsLoaded,
    sessionDayIndex,
  } = input;

  let filteredMembers = members;

  if (searchQuery.trim().length > 0) {
    const normalizedQuery = normalize(searchQuery);
    const rawQuery = searchQuery.trim();
    const queryDigits = rawQuery.replace(/\D/g, "");

    filteredMembers = members.filter((member) => {
      const normalizedNom = normalize(member.nom);
      const normalizedTwitch = normalize(member.twitch);
      const normalizedTwitchUrl = normalize(member.twitchUrl);
      const twitchChannelFromUrl = member.twitchUrl ? member.twitchUrl.split("/").filter(Boolean).pop() : "";
      const normalizedTwitchChannelFromUrl = normalize(twitchChannelFromUrl);
      const normalizedDiscord = normalize(member.discord);
      const normalizedSiteUsername = normalize(member.siteUsername);
      const normalizedDiscordId = String(member.discordId || "").trim();
      const discordIdDigits = normalizedDiscordId.replace(/\D/g, "");
      const discordIdMatchesRaw =
        normalizedDiscordId.length > 0 && normalizedDiscordId.toLowerCase().includes(rawQuery.toLowerCase());
      const discordIdMatchesDigits =
        queryDigits.length > 0 && discordIdDigits.length > 0 && discordIdDigits.includes(queryDigits);

      return (
        normalizedNom.includes(normalizedQuery) ||
        normalizedTwitch.includes(normalizedQuery) ||
        normalizedTwitchChannelFromUrl.includes(normalizedQuery) ||
        normalizedTwitchUrl.includes(normalizedQuery) ||
        normalizedDiscord.includes(normalizedQuery) ||
        normalizedSiteUsername.includes(normalizedQuery) ||
        discordIdMatchesRaw ||
        discordIdMatchesDigits
      );
    });
  }

  if (presetFilter !== "all") {
    const now = new Date();
    filteredMembers = filteredMembers.filter((member) => {
      const completeness = getMemberCompleteness(member);
      const createdAtMs = member.createdAt ? new Date(member.createdAt).getTime() : 0;
      const daysSinceCreate = createdAtMs > 0 ? Math.floor((now.getTime() - createdAtMs) / (1000 * 60 * 60 * 24)) : 9999;
      switch (presetFilter) {
        case "nouveaux":
          return daysSinceCreate <= 30;
        case "incomplets":
          return completeness.percent < 80 || member.profileValidationStatus !== "valide";
        case "sans_twitch_id":
          return !member.twitchId;
        case "sans_integration":
          return !member.integrationDate;
        case "integration_session_alignee": {
          if (!integrationSessionsLoaded) return false;
          if (!member.integrationDate) return false;
          const dayK = calendarDayKey(member.integrationDate);
          return !!dayK && sessionDayIndex.dayKeys.has(dayK);
        }
        case "vip":
          return !!member.isVip;
        case "inactifs":
          return member.statut === "Inactif";
        case "revue_due":
          if (!member.nextReviewAt) return false;
          return new Date(member.nextReviewAt).getTime() <= now.getTime();
        case "staff":
          return isStaffRole(member.role);
        case "ancien_staff":
          return isHonoraryStaffRole(member.role);
        default:
          return true;
      }
    });
  }

  const joinedAfterMs = joinedAfterFilter ? new Date(`${joinedAfterFilter}T00:00:00`).getTime() : null;
  const joinedBeforeMs = joinedBeforeFilter ? new Date(`${joinedBeforeFilter}T23:59:59.999`).getTime() : null;
  if (roleFilter !== "all" || memberStatusFilter !== "all" || joinedAfterMs !== null || joinedBeforeMs !== null) {
    filteredMembers = filteredMembers.filter((member) => {
      if (roleFilter !== "all" && toCanonicalMemberRole(member.role) !== toCanonicalMemberRole(roleFilter)) {
        return false;
      }
      if (memberStatusFilter !== "all" && member.statut !== memberStatusFilter) return false;
      if (joinedAfterMs !== null || joinedBeforeMs !== null) {
        if (!member.createdAt) return false;
        const createdAtMs = new Date(member.createdAt).getTime();
        if (!Number.isFinite(createdAtMs)) return false;
        if (joinedAfterMs !== null && createdAtMs < joinedAfterMs) return false;
        if (joinedBeforeMs !== null && createdAtMs > joinedBeforeMs) return false;
      }
      return true;
    });
  }

  if (sortColumn) {
    filteredMembers = [...filteredMembers].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "nom":
          comparison = a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
          break;
        case "role":
          comparison = a.role.localeCompare(b.role, "fr", { sensitivity: "base" });
          break;
        case "statut":
          comparison = a.statut.localeCompare(b.statut, "fr", { sensitivity: "base" });
          break;
        case "createdAt": {
          const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdAtA - createdAtB;
          break;
        }
        case "integrationDate": {
          const integrationA = a.integrationDate ? new Date(a.integrationDate).getTime() : 0;
          const integrationB = b.integrationDate ? new Date(b.integrationDate).getTime() : 0;
          comparison = integrationA - integrationB;
          break;
        }
        case "parrain": {
          const parrainA = (a.parrain || "").localeCompare(b.parrain || "", "fr", { sensitivity: "base" });
          comparison = parrainA;
          break;
        }
        case "lastLive": {
          const dateA = a.lastLiveDate ? new Date(a.lastLiveDate).getTime() : 0;
          const dateB = b.lastLiveDate ? new Date(b.lastLiveDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case "raidsDone":
          comparison = (a.raidsDone || 0) - (b.raidsDone || 0);
          break;
        case "raidsReceived":
          comparison = (a.raidsReceived || 0) - (b.raidsReceived || 0);
          break;
        case "isVip": {
          const vipA = a.isVip ? 1 : 0;
          const vipB = b.isVip ? 1 : 0;
          comparison = vipA - vipB;
          break;
        }
        case "isLive": {
          const liveA = a.twitchStatus?.isLive ? 1 : 0;
          const liveB = b.twitchStatus?.isLive ? 1 : 0;
          comparison = liveA - liveB;
          break;
        }
        case "completude":
          comparison = getMemberCompleteness(a).percent - getMemberCompleteness(b).percent;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  const tabPopulations = buildStatusTabPopulations(filteredMembers);
  const newMembers = tabPopulations.nouveaux;
  const activeMembers = tabPopulations.actifs;
  const communityRoleMembers = tabPopulations.communaute;
  const communityFollowupMembers = tabPopulations.suivi_pause;
  const tenfAffiliateMembers = tabPopulations.affilies;
  const departedMembers = tabPopulations.departs;
  const bannedMembers = tabPopulations.bans;
  const isSearching = searchQuery.trim().length > 0;

  let filteredArchivedMembers = archivedMembers;
  if (searchQuery.trim().length > 0) {
    const normalizedQuery = normalize(searchQuery);
    filteredArchivedMembers = archivedMembers.filter((member) => {
      const searchable = [member.nom, member.twitch, member.discord, member.discordId, member.siteUsername, member.deleteReason]
        .map((value) => normalize(value))
        .join(" ");
      return searchable.includes(normalizedQuery);
    });
  }
  if (roleFilter !== "all") {
    filteredArchivedMembers = filteredArchivedMembers.filter((member) => member.role === roleFilter);
  }
  if (memberStatusFilter !== "all") {
    filteredArchivedMembers = filteredArchivedMembers.filter((member) => member.statut === memberStatusFilter);
  }

  const displayedMembers =
    statusTab === "archives"
      ? filteredArchivedMembers
      : isSearching
        ? filteredMembers
        : tabPopulations[statusTab] ?? [];

  const totalPages = Math.max(1, Math.ceil(displayedMembers.length / pageSize));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedCurrentPage - 1) * pageSize;
  const startItem = displayedMembers.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(clampedCurrentPage * pageSize, displayedMembers.length);
  const paginatedMembers = displayedMembers.slice(startIndex, endItem);

  return {
    filteredMembers,
    filteredArchivedMembers,
    displayedMembers,
    paginatedMembers,
    totalPages,
    clampedCurrentPage,
    startIndex,
    startItem,
    endItem,
    newMembers,
    activeMembers,
    communityRoleMembers,
    communityFollowupMembers,
    tenfAffiliateMembers,
    departedMembers,
    bannedMembers,
    isSearching,
  };
}
