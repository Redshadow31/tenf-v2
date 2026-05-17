/**
 * Source unique du score qualité données membres.
 *
 * Utilisé par :
 *  - `/admin/membres` (carte santé)
 *  - `/admin/membres/qualite-data` (synthèse globale)
 *  - `/admin/membres/actions` (peut s'y référer si besoin)
 *
 * Évite que deux pages affichent deux scores contradictoires.
 *
 * Formule (notation /100, jamais < 0) :
 *   100 − (errors × 4 + warnings × 2 + syncMissing + discordMissingUsername)
 *
 * Pourquoi cette formule :
 *  - chaque erreur technique pèse plus qu'un warning ;
 *  - les écarts de synchronisation Supabase ↔ source legacy comptent ;
 *  - les usernames Discord vides sont visibles côté membre, donc pénalisent.
 */

export type MembersQualityInputs = {
  /** Erreurs techniques détectées par /api/admin/control-center/alerts. */
  errors: number;
  /** Warnings techniques (alerts data). */
  warnings: number;
  /** Membres présents en source legacy mais absents Supabase. */
  syncMissingCount: number;
  /** Membres avec discordUsername vide (Discord data). */
  discordMissingUsername: number;
};

/** Coefficients exposés pour rester transparents dans la UI / les tests. */
export const MEMBERS_QUALITY_WEIGHTS = {
  errorPenalty: 4,
  warningPenalty: 2,
  syncMissingPenalty: 1,
  discordMissingPenalty: 1,
} as const;

/** Renvoie un score /100, borné [0, 100]. */
export function computeMembersQualityScore(inputs: MembersQualityInputs): number {
  const penalty =
    inputs.errors * MEMBERS_QUALITY_WEIGHTS.errorPenalty +
    inputs.warnings * MEMBERS_QUALITY_WEIGHTS.warningPenalty +
    inputs.syncMissingCount * MEMBERS_QUALITY_WEIGHTS.syncMissingPenalty +
    inputs.discordMissingUsername * MEMBERS_QUALITY_WEIGHTS.discordMissingPenalty;

  const score = 100 - penalty;
  if (Number.isNaN(score) || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

/** Texte court qui explique d'où vient le score, pour la UI. */
export const MEMBERS_QUALITY_SCORE_EXPLAINER =
  "Score calculé à partir des erreurs techniques, des alertes, des écarts de synchronisation Supabase et des usernames Discord manquants.";

/** Statut qualitatif pour les badges UI. */
export type MembersQualityTier = "excellent" | "ok" | "fragile" | "critique";

export function getMembersQualityTier(score: number): MembersQualityTier {
  if (score >= 90) return "excellent";
  if (score >= 75) return "ok";
  if (score >= 50) return "fragile";
  return "critique";
}
