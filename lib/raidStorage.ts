// Nouveau système de stockage des raids TENF
// Architecture mensuelle avec fichiers séparés: raids-faits.json, raids-recus.json, alerts.json

import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

// ============================================
// TYPES
// ============================================

export interface RaidFait {
  raider: string; // Discord ID ou Twitch Login
  target: string; // Discord ID ou Twitch Login
  date: string; // ISO timestamp
  count: number; // Nombre de raids (par défaut 1)
  manual: boolean; // true si modifié par un admin
  source?: "discord" | "twitch-live" | "manual" | "bot" | "admin"; // Source du raid
  messageId?: string; // ID du message Discord (si source Discord)
  viewers?: number; // Nombre de viewers (si source Twitch)
}

export interface RaidRecu {
  target: string; // Discord ID ou Twitch Login
  raider: string; // Discord ID ou Twitch Login
  date: string; // ISO timestamp
  manual: boolean; // true si modifié par un admin
  source?: "discord" | "twitch-live" | "manual" | "bot" | "admin"; // Source du raid
  messageId?: string; // ID du message Discord (si source Discord)
  viewers?: number; // Nombre de viewers (si source Twitch)
}

export interface RaidAlert {
  raider: string; // Discord ID ou Twitch Login
  target: string; // Discord ID ou Twitch Login
  count: number; // Nombre de raids répétés
  type: "repetition"; // Type d'alerte
  manual: boolean; // true si modifié par un admin
  source?: "discord" | "twitch-live" | "manual" | "bot" | "admin"; // Source de l'alerte
}

// ============================================
// CONSTANTES
// ============================================

const RAID_STORE_NAME = "tenf-raids";

// ============================================
// UTILITAIRES
// ============================================

/**
 * Obtient le format de mois YYYY-MM
 */
export function getMonthKey(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  return `${year}-${monthStr}`;
}

/**
 * Obtient le mois en cours au format YYYY-MM
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Vérifie si on est sur Netlify
 */
function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

/**
 * Obtient le chemin du dossier pour un mois donné
 */
function getMonthFolderPath(monthKey: string): string {
  return path.join(process.cwd(), "data", "tenf-raids", monthKey);
}

/**
 * Obtient le chemin d'un fichier pour un mois donné
 */
function getFilePath(monthKey: string, filename: string): string {
  return path.join(getMonthFolderPath(monthKey), filename);
}

// ============================================
// STOCKAGE NETLIFY BLOBS
// ============================================

/**
 * Charge un fichier depuis Netlify Blobs
 */
async function loadFromBlobs(monthKey: string, filename: string): Promise<string | null> {
  if (!isNetlify()) {
    return null;
  }

  try {
    const store = getStore(RAID_STORE_NAME);
    const key = `${monthKey}/${filename}`;
    const data = await store.get(key, { type: "text" });
    return data || null;
  } catch (error) {
    console.error(`[RaidStorage] Erreur Blobs pour ${monthKey}/${filename}:`, error);
    return null;
  }
}

/**
 * Sauvegarde un fichier dans Netlify Blobs
 */
async function saveToBlobs(monthKey: string, filename: string, content: string): Promise<void> {
  if (!isNetlify()) {
    return;
  }

  try {
    const store = getStore(RAID_STORE_NAME);
    const key = `${monthKey}/${filename}`;
    await store.set(key, content);
    console.log(`[RaidStorage] Sauvegardé dans Blobs: ${key}`);
  } catch (error) {
    console.error(`[RaidStorage] Erreur sauvegarde Blobs pour ${monthKey}/${filename}:`, error);
    throw error;
  }
}

// ============================================
// STOCKAGE FICHIERS LOCAUX
// ============================================

/**
 * Charge un fichier depuis le système de fichiers local
 * Ne fait rien si on est sur Netlify (utilise uniquement Blobs)
 */
function loadFromFile(filePath: string): string | null {
  // Ne pas essayer de lire en local sur Netlify
  if (isNetlify()) {
    return null;
  }

  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.error(`[RaidStorage] Erreur lecture fichier ${filePath}:`, error);
  }
  return null;
}

/**
 * Sauvegarde un fichier dans le système de fichiers local
 * Ne fait rien si on est sur Netlify (utilise uniquement Blobs)
 */
function saveToFile(filePath: string, content: string): void {
  // Ne pas essayer de sauvegarder en local sur Netlify
  if (isNetlify()) {
    return;
  }

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[RaidStorage] Sauvegardé en local: ${filePath}`);
  } catch (error) {
    console.error(`[RaidStorage] Erreur sauvegarde fichier ${filePath}:`, error);
    throw error;
  }
}

// ============================================
// FONCTIONS DE CHARGEMENT
// ============================================

/**
 * Charge les raids faits pour un mois donné
 */
export async function loadRaidsFaits(monthKey: string): Promise<RaidFait[]> {
  const filename = "raids-faits.json";
  
  // Essayer Blobs d'abord
  const blobData = await loadFromBlobs(monthKey, filename);
  if (blobData) {
    try {
      return JSON.parse(blobData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing Blobs ${filename}:`, error);
    }
  }

  // Fallback: fichiers locaux
  const filePath = getFilePath(monthKey, filename);
  const fileData = loadFromFile(filePath);
  if (fileData) {
    try {
      return JSON.parse(fileData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing fichier ${filename}:`, error);
    }
  }

  // Fichier n'existe pas, retourner tableau vide
  return [];
}

/**
 * Charge les raids reçus pour un mois donné
 */
export async function loadRaidsRecus(monthKey: string): Promise<RaidRecu[]> {
  const filename = "raids-recus.json";
  
  // Essayer Blobs d'abord
  const blobData = await loadFromBlobs(monthKey, filename);
  if (blobData) {
    try {
      return JSON.parse(blobData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing Blobs ${filename}:`, error);
    }
  }

  // Fallback: fichiers locaux
  const filePath = getFilePath(monthKey, filename);
  const fileData = loadFromFile(filePath);
  if (fileData) {
    try {
      return JSON.parse(fileData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing fichier ${filename}:`, error);
    }
  }

  // Fichier n'existe pas, retourner tableau vide
  return [];
}

/**
 * Charge les alertes pour un mois donné
 */
export async function loadAlerts(monthKey: string): Promise<RaidAlert[]> {
  const filename = "alerts.json";
  
  // Essayer Blobs d'abord
  const blobData = await loadFromBlobs(monthKey, filename);
  if (blobData) {
    try {
      return JSON.parse(blobData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing Blobs ${filename}:`, error);
    }
  }

  // Fallback: fichiers locaux
  const filePath = getFilePath(monthKey, filename);
  const fileData = loadFromFile(filePath);
  if (fileData) {
    try {
      return JSON.parse(fileData);
    } catch (error) {
      console.error(`[RaidStorage] Erreur parsing fichier ${filename}:`, error);
    }
  }

  // Fichier n'existe pas, retourner tableau vide
  return [];
}

// ============================================
// FONCTIONS DE SAUVEGARDE
// ============================================

/**
 * Sauvegarde les raids faits pour un mois donné
 */
export async function saveRaidsFaits(monthKey: string, raids: RaidFait[]): Promise<void> {
  const filename = "raids-faits.json";
  const content = JSON.stringify(raids, null, 2);

  // Sauvegarder dans Blobs (toujours)
  await saveToBlobs(monthKey, filename, content);

  // Sauvegarder aussi en local (uniquement si pas sur Netlify)
  if (!isNetlify()) {
    const filePath = getFilePath(monthKey, filename);
    saveToFile(filePath, content);
  }
}

/**
 * Sauvegarde les raids reçus pour un mois donné
 */
export async function saveRaidsRecus(monthKey: string, raids: RaidRecu[]): Promise<void> {
  const filename = "raids-recus.json";
  const content = JSON.stringify(raids, null, 2);

  // Sauvegarder dans Blobs (toujours)
  await saveToBlobs(monthKey, filename, content);

  // Sauvegarder aussi en local (uniquement si pas sur Netlify)
  if (!isNetlify()) {
    const filePath = getFilePath(monthKey, filename);
    saveToFile(filePath, content);
  }
}

/**
 * Sauvegarde les alertes pour un mois donné
 */
export async function saveAlerts(monthKey: string, alerts: RaidAlert[]): Promise<void> {
  const filename = "alerts.json";
  const content = JSON.stringify(alerts, null, 2);

  // Sauvegarder dans Blobs (toujours)
  await saveToBlobs(monthKey, filename, content);

  // Sauvegarder aussi en local (uniquement si pas sur Netlify)
  if (!isNetlify()) {
    const filePath = getFilePath(monthKey, filename);
    saveToFile(filePath, content);
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifie si un raid existe déjà (pour éviter les doublons)
 */
export function raidExists(
  raids: RaidFait[],
  raider: string,
  target: string,
  date?: string
): boolean {
  return raids.some(raid => {
    const sameRaider = raid.raider === raider;
    const sameTarget = raid.target === target;
    if (date) {
      return sameRaider && sameTarget && raid.date === date;
    }
    return sameRaider && sameTarget;
  });
}

/**
 * Recalcule les alertes pour un mois donné
 */
export async function recalculateAlerts(monthKey: string): Promise<void> {
  const raidsFaits = await loadRaidsFaits(monthKey);
  
  // Compter les raids par raider -> target
  const raidCounts: Record<string, Record<string, number>> = {};
  
  for (const raid of raidsFaits) {
    if (!raidCounts[raid.raider]) {
      raidCounts[raid.raider] = {};
    }
    if (!raidCounts[raid.raider][raid.target]) {
      raidCounts[raid.raider][raid.target] = 0;
    }
    raidCounts[raid.raider][raid.target] += raid.count || 1;
  }

  // Créer les alertes pour les raids répétés (3+ fois)
  const alerts: RaidAlert[] = [];
  for (const [raider, targets] of Object.entries(raidCounts)) {
    for (const [target, count] of Object.entries(targets)) {
      if (count >= 3) {
        // Vérifier si l'alerte existe déjà (pour préserver manual flag)
        const existingAlerts = await loadAlerts(monthKey);
        const existingAlert = existingAlerts.find(
          a => a.raider === raider && a.target === target
        );
        
        // Déterminer la source de l'alerte (basée sur les raids)
        const raidsForAlert = raidsFaits.filter(
          r => r.raider === raider && r.target === target
        );
        const sources = raidsForAlert.map(r => r.source || "twitch-live");
        const primarySource = sources.includes("twitch-live") ? "twitch-live" : 
                             sources.includes("manual") ? "manual" : "twitch-live";
        
        alerts.push({
          raider,
          target,
          count,
          type: "repetition",
          manual: existingAlert?.manual || false,
          source: existingAlert?.source || primarySource,
        });
      }
    }
  }

  await saveAlerts(monthKey, alerts);
}

// ============================================
// OPÉRATIONS CRUD
// ============================================

/**
 * Ajoute un raid fait (manuel ou automatique)
 */
export async function addRaidFait(
  monthKey: string,
  raider: string,
  target: string,
  date: string,
  manual: boolean = false,
  messageId?: string,
  source?: "discord" | "twitch-live" | "manual" | "bot" | "admin",
  viewers?: number
): Promise<void> {
  const raids = await loadRaidsFaits(monthKey);
  
  // Vérifier si le raid existe déjà (éviter les doublons)
  // Pour les raids manuels, on permet les doublons (même raider→target) car ils peuvent être légitimes
  // Pour Twitch, on tolère un écart de quelques secondes pour éviter les doublons
  if (source !== "manual" && !manual) {
    const existingRaid = raids.find(r => {
      if (r.raider === raider && r.target === target) {
        if (source === "twitch-live") {
          // Pour Twitch, vérifier si la date est très proche (moins de 5 secondes)
          const raidDate = new Date(r.date);
          const newDate = new Date(date);
          const diffSeconds = Math.abs((newDate.getTime() - raidDate.getTime()) / 1000);
          return diffSeconds < 5;
        } else {
          return r.date === date;
        }
      }
      return false;
    });

    if (existingRaid) {
      console.log(`[RaidStorage] Raid déjà existant: ${raider} → ${target} (${date})`);
      return;
    }
  }

  raids.push({
    raider,
    target,
    date,
    count: 1,
    manual,
    source: source || (manual ? "manual" : "twitch-live"),
    messageId,
    viewers,
  });

  await saveRaidsFaits(monthKey, raids);

  // Ajouter aussi dans raids-reçus
  const raidsRecus = await loadRaidsRecus(monthKey);
  raidsRecus.push({
    target,
    raider,
    date,
    manual,
    source: source || (manual ? "manual" : "twitch-live"),
    messageId,
    viewers,
  });
  await saveRaidsRecus(monthKey, raidsRecus);

  // Recalculer les alertes
  await recalculateAlerts(monthKey);
}

/**
 * Ajoute un raid reçu (manuel ou automatique)
 */
export async function addRaidRecu(
  monthKey: string,
  target: string,
  raider: string,
  date: string,
  manual: boolean = false,
  messageId?: string,
  source?: "discord" | "twitch-live" | "manual" | "bot" | "admin",
  viewers?: number
): Promise<void> {
  const raids = await loadRaidsRecus(monthKey);
  
  // Vérifier si le raid existe déjà
  const exists = raids.some(
    r => r.target === target && r.raider === raider && r.date === date
  );
  
  if (exists) {
    console.log(`[RaidStorage] Raid reçu déjà existant: ${raider} → ${target} (${date})`);
    return;
  }

  raids.push({
    target,
    raider,
    date,
    manual,
    source: source || (manual ? "admin" : "bot"),
    messageId,
    viewers,
  });

  await saveRaidsRecus(monthKey, raids);
}

/**
 * Supprime un raid fait
 */
export async function removeRaidFait(
  monthKey: string,
  raider: string,
  target: string,
  date?: string
): Promise<boolean> {
  const raids = await loadRaidsFaits(monthKey);
  const initialLength = raids.length;

  const filtered = raids.filter(raid => {
    if (date) {
      return !(raid.raider === raider && raid.target === target && raid.date === date);
    }
    return !(raid.raider === raider && raid.target === target);
  });

  if (filtered.length === initialLength) {
    return false; // Aucun raid supprimé
  }

  await saveRaidsFaits(monthKey, filtered);

  // Supprimer aussi dans raids-reçus
  const raidsRecus = await loadRaidsRecus(monthKey);
  const filteredRecus = raidsRecus.filter(raid => {
    if (date) {
      return !(raid.target === target && raid.raider === raider && raid.date === date);
    }
    return !(raid.target === target && raid.raider === raider);
  });
  await saveRaidsRecus(monthKey, filteredRecus);

  // Recalculer les alertes
  await recalculateAlerts(monthKey);

  return true;
}

/**
 * Modifie un raid fait (réassignation raider/target)
 */
export async function updateRaidFait(
  monthKey: string,
  oldRaider: string,
  oldTarget: string,
  oldDate: string,
  newRaider: string,
  newTarget: string,
  newDate?: string
): Promise<boolean> {
  const raids = await loadRaidsFaits(monthKey);
  const raidIndex = raids.findIndex(
    r => r.raider === oldRaider && r.target === oldTarget && r.date === oldDate
  );

  if (raidIndex === -1) {
    return false;
  }

  // Marquer comme manuel si modifié
  raids[raidIndex] = {
    ...raids[raidIndex],
    raider: newRaider,
    target: newTarget,
    date: newDate || oldDate,
    manual: true,
  };

  await saveRaidsFaits(monthKey, raids);

  // Mettre à jour aussi dans raids-reçus
  const raidsRecus = await loadRaidsRecus(monthKey);
  const recuIndex = raidsRecus.findIndex(
    r => r.target === oldTarget && r.raider === oldRaider && r.date === oldDate
  );

  if (recuIndex !== -1) {
    raidsRecus[recuIndex] = {
      ...raidsRecus[recuIndex],
      target: newTarget,
      raider: newRaider,
      date: newDate || oldDate,
      manual: true,
    };
    await saveRaidsRecus(monthKey, raidsRecus);
  }

  // Recalculer les alertes
  await recalculateAlerts(monthKey);

  return true;
}

/**
 * Vérifie si un raid est manuel (ne doit pas être écrasé par le bot)
 */
export async function isRaidManual(
  monthKey: string,
  raider: string,
  target: string,
  date: string
): Promise<boolean> {
  const raids = await loadRaidsFaits(monthKey);
  const raid = raids.find(
    r => r.raider === raider && r.target === target && r.date === date
  );
  return raid?.manual || false;
}

// ============================================
// MIGRATION DES DONNÉES LEGACY
// ============================================

/**
 * Migre les données de l'ancien format vers le nouveau format
 */
export async function migrateLegacyData(monthKey: string): Promise<{
  raidsFaitsMigres: number;
  raidsRecusMigres: number;
  alertsMigres: number;
}> {
  try {
    // Charger les données de l'ancien système
    const { loadMonthlyRaids } = await import('./raids');
    const oldRaids = await loadMonthlyRaids(monthKey);

    const raidsFaits: RaidFait[] = [];
    const raidsRecus: RaidRecu[] = [];
    const alerts: RaidAlert[] = [];

    // Parcourir les anciennes données
    for (const [discordId, stats] of Object.entries(oldRaids)) {
      // Migrer les raids faits
      if (stats.raids && stats.raids.length > 0) {
        for (const raid of stats.raids) {
          raidsFaits.push({
            raider: discordId,
            target: raid.targetDiscordId,
            date: raid.timestamp,
            count: 1,
            manual: false, // Toutes les données migrées sont marquées comme automatiques
            messageId: raid.messageId,
          });
        }
      } else if (stats.done > 0) {
        // Si pas de détails mais des compteurs, créer des entrées avec date estimée
        const monthDate = new Date(monthKey + '-01');
        for (let i = 0; i < stats.done; i++) {
          const estimatedDate = new Date(monthDate);
          estimatedDate.setDate(estimatedDate.getDate() + Math.floor(i * (30 / stats.done)));
          
          // Utiliser les targets si disponibles
          if (Object.keys(stats.targets).length > 0) {
            for (const [targetId, count] of Object.entries(stats.targets)) {
              for (let j = 0; j < count; j++) {
                raidsFaits.push({
                  raider: discordId,
                  target: targetId,
                  date: estimatedDate.toISOString(),
                  count: 1,
                  manual: false,
                });
              }
            }
          } else {
            // Pas de targets, créer une entrée générique
            raidsFaits.push({
              raider: discordId,
              target: 'unknown',
              date: estimatedDate.toISOString(),
              count: 1,
              manual: false,
            });
          }
        }
      }

      // Migrer les raids reçus
      if (stats.receivedRaids && stats.receivedRaids.length > 0) {
        for (const raid of stats.receivedRaids) {
          raidsRecus.push({
            target: discordId,
            raider: raid.targetDiscordId, // Dans receivedRaids, targetDiscordId contient le raider
            date: raid.timestamp,
            manual: false,
            messageId: raid.messageId,
          });
        }
      } else if (stats.received > 0) {
        // Si pas de détails mais des compteurs, créer des entrées avec date estimée
        const monthDate = new Date(monthKey + '-01');
        for (let i = 0; i < stats.received; i++) {
          const estimatedDate = new Date(monthDate);
          estimatedDate.setDate(estimatedDate.getDate() + Math.floor(i * (30 / stats.received)));
          
          raidsRecus.push({
            target: discordId,
            raider: 'unknown',
            date: estimatedDate.toISOString(),
            manual: false,
          });
        }
      }

      // Migrer les alertes (raids répétés 3+ fois)
      for (const [targetId, count] of Object.entries(stats.targets || {})) {
        if (count >= 3) {
          alerts.push({
            raider: discordId,
            target: targetId,
            count,
            type: "repetition",
            manual: false,
          });
        }
      }
    }

    // Sauvegarder les données migrées
    await saveRaidsFaits(monthKey, raidsFaits);
    await saveRaidsRecus(monthKey, raidsRecus);
    await saveAlerts(monthKey, alerts);

    return {
      raidsFaitsMigres: raidsFaits.length,
      raidsRecusMigres: raidsRecus.length,
      alertsMigres: alerts.length,
    };
  } catch (error) {
    console.error(`[RaidStorage] Erreur lors de la migration pour ${monthKey}:`, error);
    throw error;
  }
}

/**
 * Vérifie si les données ont déjà été migrées pour un mois donné
 */
export async function isMonthMigrated(monthKey: string): Promise<boolean> {
  const raidsFaits = await loadRaidsFaits(monthKey);
  return raidsFaits.length > 0;
}

