import type { EvaluationAutoSignal } from "@/lib/admin/evaluation-d/evaluationDCommunityPassage";
import type { FollowEvalStatus } from "@/lib/evaluationFollowPolicy";

export interface MemberEvaluationData {
  twitchLogin: string;
  displayName: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  isActive: boolean;
  isVip?: boolean;
  spotlightPoints: number;
  raidsPoints: number;
  discordPoints: number;
  eventsPoints: number;
  followPoints: number;
  timezoneBonusEnabled: boolean;
  moderationBonus: number;
  totalHorsBonus: number;
  bonusTotal: number;
  finalScore: number;
  /** Override synthèse persisté pour le mois affiché (si disponible). */
  manualFinalNote?: number | null;
  autoStatus: "vip" | "surveiller" | "neutre";
  autoSignal?: EvaluationAutoSignal;
  spotlightPresences?: number;
  spotlightTotal?: number;
  raidsDone?: number;
  raidsReceived?: number;
  discordNbMessages?: number;
  discordNbVocalMinutes?: number;
  eventsPresences?: number;
  eventsTotal?: number;
  followScore?: number;
  followRawPoints?: number;
  followEvalStatus?: FollowEvalStatus;
}

export interface FinalNoteRecord {
  finalNote?: number;
  savedAt: string;
  savedBy: string;
}

export interface OverrideLog {
  id: string;
  timestamp: string;
  action: string;
  actorDiscordId: string;
  actorUsername?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
}

export interface GeneralStats {
  avgSpotlight: number;
  avgRaids: number;
  avgDiscord: number;
  avgEvents: number;
  avgFollow: number;
  avgGeneral: number;
  scoreGlobalHorsBonus: number;
  scoreGlobalAvecBonus: number;
  eventsPresenceRate: number;
  eventsParticipants: number;
  spotlightPresenceRate: number;
  spotlightParticipants: number;
  vipCount: number;
  surveillerCount: number;
}

export type EvaluationDTab = "pilotage" | "tableau" | "historique";

export type EvaluationDPreset = "all" | "surveiller" | "vip" | "manual" | "bonus";
