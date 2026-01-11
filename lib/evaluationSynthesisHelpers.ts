// Helpers pour calculer les notes et totaux de la synthèse d'évaluation

/**
 * Calcule les points Spotlight selon la logique :
 * Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
 */
export function calculateSpotlightPoints(presences: number, totalSpotlights: number): number {
  if (totalSpotlights === 0) return 0;
  const rate = (presences / totalSpotlights) * 5;
  return Math.round(rate); // Arrondir à l'entier le plus proche
}

/**
 * Calcule les points Raids selon la logique :
 * - 0 raid fait = 0 point
 * - 1-2 raids faits = 1 point
 * - 3 raids faits = 2 points
 * - 4 raids faits = 3 points
 * - 5 raids faits = 4 points
 * - 6+ raids faits = 5 points (sur 5)
 */
export function calculateRaidPoints(raidsDone: number): number {
  if (raidsDone === 0) return 0;
  if (raidsDone >= 1 && raidsDone <= 2) return 1;
  if (raidsDone === 3) return 2;
  if (raidsDone === 4) return 3;
  if (raidsDone === 5) return 4;
  if (raidsDone >= 6) return 5;
  return 0;
}

/**
 * Calcule le total hors bonus
 * Spotlight (/5) + Raids (/5) + Discord (/5) + Events (/2 converti en /5) + Follow (/5) = /25
 * Note: Events est sur /2, on le convertit proportionnellement en /5: (events / 2) * 5
 */
export function calculateTotalHorsBonus(
  spotlight: number, // /5
  raids: number, // /5
  discord: number, // /5
  events: number, // /2
  follow: number // /5
): { total: number; max: number; eventsNormalized: number } {
  // Convertir Events de /2 à /5 proportionnellement
  const eventsNormalized = (events / 2) * 5;
  
  // Total = 5 + 5 + 5 + 5 + 5 = 25
  const total = spotlight + raids + discord + eventsNormalized + follow;
  const max = 25;
  
  return { total, max, eventsNormalized };
}

/**
 * Calcule le total avec bonus
 * Total hors bonus + Bonus décalage horaire + Bonus modération
 */
export function calculateTotalAvecBonus(
  totalHorsBonus: number,
  timezoneBonus: number,
  moderationBonus: number
): { total: number; max: number } {
  const total = totalHorsBonus + timezoneBonus + moderationBonus;
  // Max = 25 (hors bonus) + 2 (décalage) + 5 (modération) = 32
  const max = 32;
  
  return { total, max };
}

/**
 * Détermine le statut auto basé sur la note finale
 * - VIP si note finale > 16
 * - À surveiller si note finale < 5
 * - Neutre sinon
 */
export function getAutoStatus(finalScore: number): 'vip' | 'surveiller' | 'neutre' {
  if (finalScore > 16) return 'vip';
  if (finalScore < 5) return 'surveiller';
  return 'neutre';
}

/**
 * Calcule l'ancienneté en mois/jours depuis une date
 */
export function calculateSeniority(createdAt?: string): string {
  if (!createdAt) return 'Non renseigné';
  
  try {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMonths > 0) {
      return `${diffMonths} mois`;
    }
    return `${diffDays} jours`;
  } catch (error) {
    return 'Non renseigné';
  }
}


