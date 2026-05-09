/**
 * Barème « évaluation v3 » sur 100 (hors malus puis clamp 0–100).
 * Discord **20 pts** : même logique que la v1 (page B / `lib/discordEngagement`) — notes écrit & vocal sur /5,
 * note finale = max(écrit, vocal), portée sur /20 (×4). Les réactions ne comptent pas dans ce bloc (hors v1).
 */

import {
  calculateNoteEcrit,
  calculateNoteFinale,
  calculateNoteVocal,
} from "@/lib/discordEngagement";

const V1_TO_V3_DISCORD_SCALE = 4; // note /5 → points /20

export function scoreV3DiscordBlock(input: {
  nbMessages: number;
  nbVocalMinutes: number;
  nbReactions?: number;
}): {
  /** Notes brutes v1 (0–5), seuils `ENGAGEMENT_SEUILS` dans `discordEngagement`. */
  noteEcrit: number;
  noteVocal: number;
  noteFinale: number;
  /** Équivalents /20 pour affichage (écrit ×4, vocal ×4) — le total n’est pas leur somme. */
  messages: number;
  vocal: number;
  reactions: number;
  total: number;
} {
  const nbMessages = Math.max(0, Math.floor(Number(input.nbMessages) || 0));
  const nbVocalMinutes = Math.max(0, Number(input.nbVocalMinutes) || 0);

  const noteEcrit = calculateNoteEcrit(nbMessages);
  const noteVocal = calculateNoteVocal(nbVocalMinutes);
  const noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
  const k = V1_TO_V3_DISCORD_SCALE;

  return {
    noteEcrit,
    noteVocal,
    noteFinale,
    messages: noteEcrit * k,
    vocal: noteVocal * k,
    reactions: 0,
    total: Math.min(20, noteFinale * k),
  };
}

/** Raids vers membres TENF — 25 pts (comptage mensuel, sans bonus diversité ici). */
export function scoreV3Raids(raidsDone: number, otherVisibleSupport: boolean): number {
  const r = Math.max(0, Math.floor(Number(raidsDone) || 0));
  if (r >= 4) return 25;
  if (r === 3) return 20;
  if (r === 2) return 15;
  if (r === 1) return 10;
  if (otherVisibleSupport) return 5;
  return 0;
}

/** Présence events TENF (présences réelles déclarées) — 20 pts. */
export function scoreV3Events(presentCount: number): number {
  const p = Math.max(0, Math.floor(Number(presentCount) || 0));
  if (p >= 3) return 20;
  if (p === 2) return 15;
  if (p === 1) return 10;
  return 0;
}

/** Présence Spotlight validée — 20 pts. */
export function scoreV3Spotlight(presentCount: number): number {
  const p = Math.max(0, Math.floor(Number(presentCount) || 0));
  if (p >= 4) return 20;
  if (p === 3) return 15;
  if (p === 2) return 10;
  if (p === 1) return 5;
  return 0;
}

/** Régularité sur 3 mois — 10 pts (mois « actif » = score legacy proxy ≥ seuil). */
export function scoreV3Regularite(activeMonthsOutOf3: number): number {
  const a = Math.max(0, Math.min(3, Math.floor(Number(activeMonthsOutOf3) || 0)));
  if (a >= 3) return 10;
  if (a === 2) return 7;
  if (a === 1) return 3;
  return 0;
}

export function clampBonusStaff(v: number): number {
  return Math.max(0, Math.min(5, Number(v) || 0));
}

export function clampMalusStaff(v: number): number {
  return Math.max(0, Math.min(30, Number(v) || 0));
}

export function totalV3Score(parts: {
  raids: number;
  discord: number;
  events: number;
  spotlight: number;
  regularite: number;
  bonus: number;
  malus: number;
}): number {
  const sum =
    Math.max(0, parts.raids) +
    Math.max(0, parts.discord) +
    Math.max(0, parts.events) +
    Math.max(0, parts.spotlight) +
    Math.max(0, parts.regularite) +
    clampBonusStaff(parts.bonus);
  return Math.max(0, Math.min(100, sum - clampMalusStaff(parts.malus)));
}

export type V3RecommendedStatus =
  | "candidat_vip"
  | "tres_actif"
  | "actif_correct"
  | "faible"
  | "trop_peu_actif";

export function recommendV3Status(total: number): V3RecommendedStatus {
  const t = Math.max(0, Math.min(100, Number(total) || 0));
  if (t >= 85) return "candidat_vip";
  if (t >= 70) return "tres_actif";
  if (t >= 50) return "actif_correct";
  if (t >= 35) return "faible";
  return "trop_peu_actif";
}

export const V3_STATUS_LABELS: Record<V3RecommendedStatus, string> = {
  candidat_vip: "Candidat VIP (≥85)",
  tres_actif: "Très actif (70–84)",
  actif_correct: "Actif correct (50–69)",
  faible: "Activité faible (35–49)",
  trop_peu_actif: "Trop peu actif (<35)",
};
