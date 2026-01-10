// Helpers pour calculer les bonus d'évaluation (client-safe, pas de dépendances Node.js)

export interface MemberBonus {
  twitchLogin: string;
  timezoneBonusEnabled: boolean; // Bonus décalage horaire activé
  moderationBonus: number; // Bonus modération (0-5)
  updatedAt: string; // ISO timestamp
  updatedBy: string; // Discord ID
}

/**
 * Valeur du bonus décalage horaire
 */
export const TIMEZONE_BONUS_POINTS = 2;

/**
 * Calcule le total des bonus pour un membre
 * @returns { timezoneBonus: number, moderationBonus: number, total: number }
 */
export function calculateBonusTotal(bonus: MemberBonus | null): { timezoneBonus: number; moderationBonus: number; total: number } {
  if (!bonus) {
    return { timezoneBonus: 0, moderationBonus: 0, total: 0 };
  }
  
  const timezoneBonus = bonus.timezoneBonusEnabled ? TIMEZONE_BONUS_POINTS : 0;
  const moderationBonus = bonus.moderationBonus || 0;
  const total = timezoneBonus + moderationBonus;
  
  return { timezoneBonus, moderationBonus, total };
}

