// Système de suivi des raids TENF
// Stockage dans Netlify Blobs avec format mensuel

import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

interface RaidStats {
  done: number; // Nombre de raids envoyés
  received: number; // Nombre de raids reçus
  targets: Record<string, number>; // Détail des raids vers chaque cible { "twitchLogin": count }
}

interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

const RAID_BLOB_STORE = "tenf-raids";

/**
 * Obtient la clé Blob pour le mois en cours (format: monthly-raids-YYYY-MM)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `monthly-raids-${year}-${month}`;
}

/**
 * Obtient la clé Blob pour un mois spécifique
 */
export function getMonthKey(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  return `monthly-raids-${year}-${monthStr}`;
}

/**
 * Charge les raids du mois en cours depuis Netlify Blobs
 */
export async function loadMonthlyRaids(monthKey?: string): Promise<MonthlyRaids> {
  const key = monthKey || getCurrentMonthKey();
  
  try {
    // Vérifier si on est sur Netlify
    let useBlobs = false;
    try {
      const store = getStore(RAID_BLOB_STORE);
      if (store) {
        useBlobs = true;
      }
    } catch {
      // Pas sur Netlify, utiliser fichiers locaux
    }
    
    if (useBlobs) {
      const store = getStore(RAID_BLOB_STORE);
      const data = await store.get(key, { type: "text" });
      if (data) {
        return JSON.parse(data);
      }
    } else {
      // Développement local : utiliser fichiers
      const DATA_DIR = path.join(process.cwd(), "data");
      const RAID_FILE = path.join(DATA_DIR, `${key}.json`);
      if (fs.existsSync(RAID_FILE)) {
        const fileContent = fs.readFileSync(RAID_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des raids pour ${key}:`, error);
  }
  
  return {};
}

/**
 * Sauvegarde les raids du mois en cours dans Netlify Blobs
 */
export async function saveMonthlyRaids(raids: MonthlyRaids, monthKey?: string): Promise<void> {
  const key = monthKey || getCurrentMonthKey();
  
  try {
    // Vérifier si on est sur Netlify
    let useBlobs = false;
    try {
      const store = getStore(RAID_BLOB_STORE);
      if (store) {
        useBlobs = true;
      }
    } catch {
      // Pas sur Netlify, utiliser fichiers locaux
    }
    
    if (useBlobs) {
      const store = getStore(RAID_BLOB_STORE);
      await store.set(key, JSON.stringify(raids, null, 2));
    } else {
      // Développement local : utiliser fichiers
      const DATA_DIR = path.join(process.cwd(), "data");
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const RAID_FILE = path.join(DATA_DIR, `${key}.json`);
      fs.writeFileSync(RAID_FILE, JSON.stringify(raids, null, 2), "utf-8");
    }
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des raids pour ${key}:`, error);
    throw error;
  }
}

/**
 * Enregistre un raid (user1 raid user2)
 */
export async function recordRaid(
  raiderTwitchLogin: string,
  targetTwitchLogin: string
): Promise<void> {
  const raids = await loadMonthlyRaids();
  const raider = raiderTwitchLogin.toLowerCase();
  const target = targetTwitchLogin.toLowerCase();
  
  // Initialiser les stats du raider si nécessaire
  if (!raids[raider]) {
    raids[raider] = {
      done: 0,
      received: 0,
      targets: {},
    };
  }
  
  // Initialiser les stats de la cible si nécessaire
  if (!raids[target]) {
    raids[target] = {
      done: 0,
      received: 0,
      targets: {},
    };
  }
  
  // Incrémenter les compteurs
  raids[raider].done++;
  raids[raider].targets[target] = (raids[raider].targets[target] || 0) + 1;
  
  raids[target].received++;
  
  // Sauvegarder
  await saveMonthlyRaids(raids);
}

/**
 * Récupère les stats de raids d'un membre pour le mois en cours
 */
export async function getMemberRaidStats(twitchLogin: string): Promise<RaidStats> {
  const raids = await loadMonthlyRaids();
  const login = twitchLogin.toLowerCase();
  
  return raids[login] || {
    done: 0,
    received: 0,
    targets: {},
  };
}

/**
 * Récupère toutes les stats de raids pour le mois en cours
 */
export async function getAllRaidStats(): Promise<MonthlyRaids> {
  return await loadMonthlyRaids();
}

/**
 * Vérifie si un membre a raidé plus de 3 fois la même personne dans le mois
 */
export async function hasExcessiveRaids(twitchLogin: string): Promise<boolean> {
  const stats = await getMemberRaidStats(twitchLogin);
  
  // Vérifier si une cible a été raidée plus de 3 fois
  for (const count of Object.values(stats.targets)) {
    if (count > 3) {
      return true;
    }
  }
  
  return false;
}

