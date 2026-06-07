/**
 * Types partagés pour la page admin « Gestion des membres ».
 * Extrait de l’ancien monolithe pour faciliter la maintenance.
 */

import type { MemberTimelineEntry } from "@/lib/admin/members-gestion/memberTimeline";
import type { MemberRole } from "@/lib/memberRoles";

export type { MemberRole };

export type MemberStatus = "Actif" | "Inactif";

export interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: MemberStatus;
  discord: string;
  discordId?: string;
  twitch: string;
  twitchUrl?: string;
  twitchId?: string;
  siteUsername?: string;
  notesInternes?: string;
  badges?: string[];
  isVip?: boolean;
  isModeratorJunior?: boolean;
  isModeratorMentor?: boolean;
  description?: string;
  customBio?: string;
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
  };
  lastLiveDate?: string;
  raidsDone?: number;
  raidsReceived?: number;
  createdAt?: string;
  integrationDate?: string;
  birthday?: string;
  twitchAffiliateDate?: string;
  shadowbanLives?: boolean;
  onboardingStatus?: "a_faire" | "en_cours" | "termine";
  mentorTwitchLogin?: string;
  primaryLanguage?: string;
  timezone?: string;
  countryCode?: string;
  lastReviewAt?: string;
  nextReviewAt?: string;
  roleHistory?: MemberTimelineEntry[];
  staffPeriods?: import("@/lib/admin/members-gestion/staffPeriods").StaffPeriod[];
  parrain?: string;
  profileValidationStatus?: "non_soumis" | "en_cours_examen" | "valide";
  isArchived?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export type DiscordVerifyResult = {
  twitchLogin: string;
  displayName: string;
  discordId: string;
  storedDiscordUsername: string | null;
  fetchedDiscordUsername: string | null;
  status: "same" | "updated" | "different" | "not_found" | "error";
  error?: string;
};

export type DiscordVerifyResponse = {
  processed: number;
  same: number;
  different: number;
  updated: number;
  notFound: number;
  errors: number;
  totalSelected?: number;
  nextOffset?: number;
  hasMore?: boolean;
  results: DiscordVerifyResult[];
  error?: string;
};

export type SortableColumn =
  | "nom"
  | "role"
  | "statut"
  | "createdAt"
  | "integrationDate"
  | "parrain"
  | "lastLive"
  | "raidsDone"
  | "raidsReceived"
  | "isVip"
  | "isLive"
  | "completude";

export type PresetFilter =
  | "all"
  | "nouveaux"
  | "incomplets"
  | "sans_twitch_id"
  | "sans_integration"
  | "integration_session_alignee"
  | "vip"
  | "inactifs"
  | "revue_due"
  | "staff"
  | "ancien_staff";
