// Système de suivi des raids TENF
// Stockage dans Netlify Blobs avec format mensuel
// Les raids sont validés par réaction ✔️ ou ❌ sur les messages Discord

import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

interface RaidStats {
  done: number; // Nombre de raids envoyés
  received: number; // Nombre de raids reçus
  targets: Record<string, number>; // Détail des raids vers chaque cible { "discordUserId": count }
}

interface MonthlyRaids {
  [discordUserId: string]: RaidStats;
}

interface PendingRaid {
  messageId: string;
  raiderDiscordId: string;
  targetDiscordId: string;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  timestamp: string;
}

const RAID_BLOB_STORE = "tenf-raids";
const PENDING_RAIDS_KEY = "pending-raids"; // Raids en attente de validation

/**
 * Obtient la clé Blob pour le mois en cours (format: raids-YYYY-MM)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `raids-${year}-${month}`;
}

/**
 * Obtient la clé Blob pour un mois spécifique
 */
export function getMonthKey(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  return `raids-${year}-${monthStr}`;
}

/**
 * Charge les raids du mois en cours depuis Netlify Blobs
 */
export async function loadMonthlyRaids(monthKey?: string): Promise<MonthlyRaids> {
  const key = monthKey || getCurrentMonthKey();
  
  try {
    // Détection dynamique de l'environnement Netlify
    let useBlobs = false;
    try {
      // Vérifier si getStore est disponible (Netlify)
      if (typeof getStore === 'function') {
        const store = getStore(RAID_BLOB_STORE);
        if (store) {
          useBlobs = true;
        }
      }
    } catch {
      // Pas sur Netlify
    }
    
    // Vérifier aussi via les variables d'environnement
    if (!useBlobs && (process.env.NETLIFY || process.env.NETLIFY_DEV)) {
      try {
        const store = getStore(RAID_BLOB_STORE);
        if (store) {
          useBlobs = true;
        }
      } catch {
        // Ignorer
      }
    }
    
    if (useBlobs) {
      try {
        const store = getStore(RAID_BLOB_STORE);
        const data = await store.get(key, { type: "text" });
        if (data) {
          console.log(`[Raids] Chargé depuis Blobs: ${key}, ${data.length} caractères`);
          return JSON.parse(data);
        } else {
          console.log(`[Raids] Aucune donnée trouvée dans Blobs pour ${key}`);
        }
      } catch (error) {
        console.error(`[Raids] Erreur Blobs pour ${key}:`, error);
      }
    }
    
    // Fallback : fichiers locaux (développement)
    const DATA_DIR = path.join(process.cwd(), "data");
    const RAID_FILE = path.join(DATA_DIR, `${key}.json`);
    if (fs.existsSync(RAID_FILE)) {
      const fileContent = fs.readFileSync(RAID_FILE, "utf-8");
      console.log(`[Raids] Chargé depuis fichier local: ${key}`);
      return JSON.parse(fileContent);
    } else {
      console.log(`[Raids] Aucun fichier local trouvé pour ${key}`);
    }
  } catch (error) {
    console.error(`[Raids] Erreur lors du chargement pour ${key}:`, error);
  }
  
  return {};
}

/**
 * Charge les raids en attente de validation
 */
export async function loadPendingRaids(): Promise<PendingRaid[]> {
  try {
    let useBlobs = false;
    try {
      const store = getStore(RAID_BLOB_STORE);
      if (store) {
        useBlobs = true;
      }
    } catch {
      // Pas sur Netlify
    }
    
    if (useBlobs) {
      const store = getStore(RAID_BLOB_STORE);
      const data = await store.get(PENDING_RAIDS_KEY, { type: "text" });
      if (data) {
        return JSON.parse(data);
      }
    } else {
      const DATA_DIR = path.join(process.cwd(), "data");
      const PENDING_FILE = path.join(DATA_DIR, `${PENDING_RAIDS_KEY}.json`);
      if (fs.existsSync(PENDING_FILE)) {
        const fileContent = fs.readFileSync(PENDING_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement des raids en attente:", error);
  }
  
  return [];
}

/**
 * Sauvegarde les raids en attente de validation
 */
export async function savePendingRaids(raids: PendingRaid[]): Promise<void> {
  try {
    let useBlobs = false;
    try {
      const store = getStore(RAID_BLOB_STORE);
      if (store) {
        useBlobs = true;
      }
    } catch {
      // Pas sur Netlify
    }
    
    if (useBlobs) {
      const store = getStore(RAID_BLOB_STORE);
      await store.set(PENDING_RAIDS_KEY, JSON.stringify(raids, null, 2));
    } else {
      const DATA_DIR = path.join(process.cwd(), "data");
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const PENDING_FILE = path.join(DATA_DIR, `${PENDING_RAIDS_KEY}.json`);
      fs.writeFileSync(PENDING_FILE, JSON.stringify(raids, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des raids en attente:", error);
    throw error;
  }
}

/**
 * Sauvegarde les raids du mois en cours dans Netlify Blobs
 */
export async function saveMonthlyRaids(raids: MonthlyRaids, monthKey?: string): Promise<void> {
  const key = monthKey || getCurrentMonthKey();
  
  try {
    // Détection dynamique de l'environnement Netlify
    let useBlobs = false;
    try {
      // Vérifier si getStore est disponible (Netlify)
      if (typeof getStore === 'function') {
        const store = getStore(RAID_BLOB_STORE);
        if (store) {
          useBlobs = true;
        }
      }
    } catch {
      // Pas sur Netlify
    }
    
    // Vérifier aussi via les variables d'environnement
    if (!useBlobs && (process.env.NETLIFY || process.env.NETLIFY_DEV)) {
      try {
        const store = getStore(RAID_BLOB_STORE);
        if (store) {
          useBlobs = true;
        }
      } catch {
        // Ignorer
      }
    }
    
    if (useBlobs) {
      try {
        const store = getStore(RAID_BLOB_STORE);
        const jsonData = JSON.stringify(raids, null, 2);
        await store.set(key, jsonData);
        console.log(`[Raids] Sauvegardé dans Blobs: ${key}, ${Object.keys(raids).length} membres`);
      } catch (error) {
        console.error(`[Raids] Erreur lors de la sauvegarde dans Blobs pour ${key}:`, error);
        throw error;
      }
    }
    
    // Toujours sauvegarder aussi en local (pour backup et développement)
    const DATA_DIR = path.join(process.cwd(), "data");
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const RAID_FILE = path.join(DATA_DIR, `${key}.json`);
    fs.writeFileSync(RAID_FILE, JSON.stringify(raids, null, 2), "utf-8");
    console.log(`[Raids] Sauvegardé en local: ${key}, ${Object.keys(raids).length} membres`);
  } catch (error) {
    console.error(`[Raids] Erreur lors de la sauvegarde pour ${key}:`, error);
    throw error;
  }
}

/**
 * Enregistre un raid validé (user1 raid user2) par Discord ID
 * Ne fusionne pas, incrémente simplement les compteurs
 */
export async function recordRaidByDiscordId(
  raiderDiscordId: string,
  targetDiscordId: string
): Promise<void> {
  const raids = await loadMonthlyRaids();
  
  // Initialiser les stats du raider si nécessaire
  if (!raids[raiderDiscordId]) {
    raids[raiderDiscordId] = {
      done: 0,
      received: 0,
      targets: {},
    };
  }
  
  // Initialiser les stats de la cible si nécessaire
  if (!raids[targetDiscordId]) {
    raids[targetDiscordId] = {
      done: 0,
      received: 0,
      targets: {},
    };
  }
  
  // Incrémenter les compteurs (ne pas écraser, additionner)
  raids[raiderDiscordId].done++;
  raids[raiderDiscordId].targets[targetDiscordId] = (raids[raiderDiscordId].targets[targetDiscordId] || 0) + 1;
  
  raids[targetDiscordId].received++;
  
  console.log(`[Raids] Raid enregistré: ${raiderDiscordId} → ${targetDiscordId} (mois en cours)`);
  
  // Sauvegarder
  await saveMonthlyRaids(raids);
}

/**
 * Retire un raid validé précédemment (pour annulation)
 */
export async function removeRaidByDiscordId(
  raiderDiscordId: string,
  targetDiscordId: string
): Promise<void> {
  const raids = await loadMonthlyRaids();
  
  if (raids[raiderDiscordId] && raids[raiderDiscordId].done > 0) {
    raids[raiderDiscordId].done--;
    if (raids[raiderDiscordId].targets[targetDiscordId] > 0) {
      raids[raiderDiscordId].targets[targetDiscordId]--;
      if (raids[raiderDiscordId].targets[targetDiscordId] === 0) {
        delete raids[raiderDiscordId].targets[targetDiscordId];
      }
    }
  }
  
  if (raids[targetDiscordId] && raids[targetDiscordId].received > 0) {
    raids[targetDiscordId].received--;
  }
  
  // Sauvegarder
  await saveMonthlyRaids(raids);
}

/**
 * Ajoute un raid en attente de validation
 */
export async function addPendingRaid(
  messageId: string,
  raiderDiscordId: string,
  targetDiscordId: string,
  raiderTwitchLogin?: string,
  targetTwitchLogin?: string
): Promise<void> {
  const pendingRaids = await loadPendingRaids();
  
  // Vérifier si ce message n'est pas déjà en attente
  const existing = pendingRaids.find(r => r.messageId === messageId);
  if (existing) {
    return; // Déjà en attente
  }
  
  pendingRaids.push({
    messageId,
    raiderDiscordId,
    targetDiscordId,
    raiderTwitchLogin,
    targetTwitchLogin,
    timestamp: new Date().toISOString(),
  });
  
  await savePendingRaids(pendingRaids);
}

/**
 * Valide un raid en attente (réaction ✔️)
 */
export async function validatePendingRaid(messageId: string): Promise<boolean> {
  const pendingRaids = await loadPendingRaids();
  const raid = pendingRaids.find(r => r.messageId === messageId);
  
  if (!raid) {
    return false; // Raid non trouvé
  }
  
  // Enregistrer le raid validé
  await recordRaidByDiscordId(raid.raiderDiscordId, raid.targetDiscordId);
  
  // Retirer de la liste des raids en attente
  const updated = pendingRaids.filter(r => r.messageId !== messageId);
  await savePendingRaids(updated);
  
  return true;
}

/**
 * Rejette un raid en attente (réaction ❌)
 */
export async function rejectPendingRaid(messageId: string): Promise<boolean> {
  const pendingRaids = await loadPendingRaids();
  const raid = pendingRaids.find(r => r.messageId === messageId);
  
  if (!raid) {
    return false; // Raid non trouvé
  }
  
  // Retirer de la liste des raids en attente
  const updated = pendingRaids.filter(r => r.messageId !== messageId);
  await savePendingRaids(updated);
  
  // Si le raid avait été validé précédemment, le retirer
  await removeRaidByDiscordId(raid.raiderDiscordId, raid.targetDiscordId);
  
  return true;
}

/**
 * Récupère les stats de raids d'un membre par Discord ID pour le mois en cours
 */
export async function getMemberRaidStatsByDiscordId(discordId: string): Promise<RaidStats> {
  const raids = await loadMonthlyRaids();
  
  return raids[discordId] || {
    done: 0,
    received: 0,
    targets: {},
  };
}

/**
 * Récupère les stats de raids d'un membre par Twitch Login pour le mois en cours
 * Nécessite de charger les membres pour faire la conversion
 */
export async function getMemberRaidStatsByTwitchLogin(
  twitchLogin: string,
  membersMap?: Map<string, string>
): Promise<RaidStats> {
  const raids = await loadMonthlyRaids();
  
  // Si un map est fourni, chercher le Discord ID
  if (membersMap) {
    const discordId = membersMap.get(twitchLogin.toLowerCase());
    if (discordId && raids[discordId]) {
      return raids[discordId];
    }
  }
  
  return {
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
 * Vérifie si un membre a raidé plus de 3 fois la même personne dans le mois (par Discord ID)
 */
export async function hasExcessiveRaidsByDiscordId(discordId: string): Promise<boolean> {
  const stats = await getMemberRaidStatsByDiscordId(discordId);
  
  // Vérifier si une cible a été raidée plus de 3 fois
  for (const count of Object.values(stats.targets)) {
    if (count > 3) {
      return true;
    }
  }
  
  return false;
}

