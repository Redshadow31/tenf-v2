/** Seuil « Explorateur·rice TENF » : couverture follows membres actifs ≥ 95 % (à 5 % près du complet). */
export const TENF_EXPLORER_MIN_FOLLOW_RATE = 95;

export function qualifiesAsTenfExplorer(followRate: number | null | undefined): boolean {
  return typeof followRate === "number" && followRate >= TENF_EXPLORER_MIN_FOLLOW_RATE;
}
