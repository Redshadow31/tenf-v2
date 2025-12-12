// Fonction utilitaire pour calculer les statistiques des raids mensuels

interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

interface UnmatchedRaid {
  id: string;
  content: string;
  timestamp: string;
  reason: string;
}

export interface RaidAlert {
  raider: string;
  target: string;
  count: number;
}

export interface ComputedRaidStats {
  totalDone: number;
  totalReceived: number;
  unmatchedCount: number;
  activeRaidersCount: number;
  uniqueTargetsCount: number;
  topRaider: { name: string; count: number } | null;
  topTarget: { name: string; count: number } | null;
  alerts: RaidAlert[];
}

/**
 * Calcule les statistiques complètes des raids pour un mois donné
 */
export function computeRaidStats(
  raids: MonthlyRaids,
  unmatched: UnmatchedRaid[] = []
): ComputedRaidStats {
  let totalDone = 0;
  let totalReceived = 0;
  const raidersSet = new Set<string>();
  const targetsSet = new Set<string>();
  const raiderCounts: Record<string, number> = {};
  const targetCounts: Record<string, number> = {};
  const alerts: RaidAlert[] = [];

  // Parcourir tous les raids
  const membersWithOnlyDone: string[] = [];
  const membersWithOnlyReceived: string[] = [];
  const membersWithMismatch: Array<{ login: string; done: number; received: number }> = [];
  
  for (const [twitchLogin, stats] of Object.entries(raids)) {
    // Compter les raids faits
    totalDone += stats.done;
    if (stats.done > 0) {
      raidersSet.add(twitchLogin);
      raiderCounts[twitchLogin] = stats.done;
    }

    // Compter les raids reçus
    totalReceived += stats.received;
    if (stats.received > 0) {
      targetsSet.add(twitchLogin);
      targetCounts[twitchLogin] = stats.received;
    }

    // Détecter les incohérences potentielles
    if (stats.done > 0 && stats.received === 0) {
      membersWithOnlyDone.push(twitchLogin);
    }
    if (stats.received > 0 && stats.done === 0) {
      membersWithOnlyReceived.push(twitchLogin);
    }
    // Note: Il est normal qu'un membre ait fait des raids sans en recevoir, et vice versa

    // Vérifier les alertes (3+ raids vers la même cible)
    for (const [targetLogin, count] of Object.entries(stats.targets)) {
      if (count >= 3) {
        alerts.push({
          raider: twitchLogin,
          target: targetLogin,
          count,
        });
      }
    }
  }
  
  // Log de vérification
  const difference = Math.abs(totalDone - totalReceived);
  if (difference > 0) {
    console.warn(`[Raid Stats] Écart détecté: ${totalDone} raids faits vs ${totalReceived} raids reçus (différence: ${difference})`);
    if (membersWithOnlyDone.length > 0) {
      console.warn(`[Raid Stats] Membres avec seulement des raids faits: ${membersWithOnlyDone.length}`);
    }
    if (membersWithOnlyReceived.length > 0) {
      console.warn(`[Raid Stats] Membres avec seulement des raids reçus: ${membersWithOnlyReceived.length}`);
    }
  } else {
    console.log(`[Raid Stats] ✅ Totaux cohérents: ${totalDone} raids faits = ${totalReceived} raids reçus`);
  }

  // Trouver le top raideur
  let topRaider: { name: string; count: number } | null = null;
  for (const [login, count] of Object.entries(raiderCounts)) {
    if (!topRaider || count > topRaider.count) {
      topRaider = { name: login, count };
    }
  }

  // Trouver la top cible
  let topTarget: { name: string; count: number } | null = null;
  for (const [login, count] of Object.entries(targetCounts)) {
    if (!topTarget || count > topTarget.count) {
      topTarget = { name: login, count };
    }
  }

  return {
    totalDone,
    totalReceived,
    unmatchedCount: unmatched.length,
    activeRaidersCount: raidersSet.size,
    uniqueTargetsCount: targetsSet.size,
    topRaider,
    topTarget,
    alerts,
  };
}

