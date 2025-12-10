// Gestion de l'historique des VIP et calcul des badges VIP+N

import fs from 'fs';
import path from 'path';

export interface VipHistoryEntry {
  login: string;
  month: string; // Format: "YYYY-MM"
}

const DATA_DIR = path.join(process.cwd(), "data");
const VIP_HISTORY_FILE = path.join(DATA_DIR, "vip-history.json");

/**
 * Charge l'historique des VIP depuis le fichier JSON
 */
export function loadVipHistory(): VipHistoryEntry[] {
  try {
    if (fs.existsSync(VIP_HISTORY_FILE)) {
      const fileContent = fs.readFileSync(VIP_HISTORY_FILE, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Erreur lors du chargement de l'historique VIP:", error);
  }
  return [];
}

/**
 * Sauvegarde l'historique des VIP dans le fichier JSON
 */
export function saveVipHistory(history: VipHistoryEntry[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(VIP_HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'historique VIP:", error);
  }
}

/**
 * Calcule le nombre de mois consécutifs où un membre a été VIP
 * @param login - Le login Twitch du membre
 * @returns Le nombre de mois consécutifs (0 si jamais VIP, 1 si VIP ce mois, 2+ si plusieurs mois consécutifs)
 */
export function getConsecutiveVipMonths(login: string): number {
  const history = loadVipHistory();
  const loginLower = login.toLowerCase();
  
  // Filtrer les entrées pour ce membre et trier par mois (décroissant)
  const memberEntries = history
    .filter(entry => entry.login.toLowerCase() === loginLower)
    .map(entry => {
      const [year, month] = entry.month.split('-').map(Number);
      return { year, month, monthString: entry.month };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  if (memberEntries.length === 0) {
    return 0;
  }

  // Obtenir le mois le plus récent dans l'historique
  const mostRecentEntry = memberEntries[0];
  let consecutiveMonths = 1;
  let checkYear = mostRecentEntry.year;
  let checkMonth = mostRecentEntry.month;

  // Compter les mois consécutifs en partant du mois le plus récent
  while (true) {
    // Aller au mois précédent
    checkMonth--;
    if (checkMonth < 1) {
      checkMonth = 12;
      checkYear--;
    }

    // Vérifier si le membre était VIP ce mois
    const wasVip = memberEntries.some(
      entry => entry.year === checkYear && entry.month === checkMonth
    );

    if (wasVip) {
      consecutiveMonths++;
    } else {
      break; // Arrêter si on trouve un mois où il n'était pas VIP
    }
  }

  return consecutiveMonths;
}

/**
 * Obtient le badge VIP pour un membre (VIP, VIP+2, VIP+3, etc.)
 * @param login - Le login Twitch du membre
 * @returns Le texte du badge (ex: "VIP", "VIP+2", "VIP+3")
 */
export function getVipBadgeText(login: string): string {
  const months = getConsecutiveVipMonths(login);
  if (months === 0) {
    return "";
  }
  if (months === 1) {
    return "VIP";
  }
  return `VIP+${months}`;
}

/**
 * Récupère l'historique organisé par mois
 */
export function getVipHistoryByMonth(): Record<string, string[]> {
  const history = loadVipHistory();
  const byMonth: Record<string, string[]> = {};

  history.forEach(entry => {
    if (!byMonth[entry.month]) {
      byMonth[entry.month] = [];
    }
    if (!byMonth[entry.month].includes(entry.login.toLowerCase())) {
      byMonth[entry.month].push(entry.login.toLowerCase());
    }
  });

  return byMonth;
}

/**
 * Ajoute une entrée VIP pour un mois donné
 */
export function addVipEntry(login: string, month: string): void {
  const history = loadVipHistory();
  const loginLower = login.toLowerCase();
  
  // Vérifier si l'entrée existe déjà
  const exists = history.some(
    entry => entry.login.toLowerCase() === loginLower && entry.month === month
  );

  if (!exists) {
    history.push({ login: loginLower, month });
    saveVipHistory(history);
  }
}

