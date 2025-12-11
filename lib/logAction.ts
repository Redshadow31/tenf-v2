// Système de logging des actions administratives avec persistance
import { getStore } from "@netlify/blobs";

// Imports Node.js uniquement côté serveur
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;

if (typeof window === "undefined") {
  // Côté serveur uniquement
  fs = require("fs");
  path = require("path");
}

export interface LogEntry {
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

// Stockage en mémoire
let logs: LogEntry[] = [];

// Chemin du fichier de persistance (pour développement local)
// Ces constantes seront initialisées côté serveur uniquement
let DATA_DIR: string = "";
let LOGS_DATA_FILE: string = "";

if (typeof window === "undefined") {
  const pathModule = require("path");
  DATA_DIR = pathModule.join(process.cwd(), "data");
  LOGS_DATA_FILE = pathModule.join(DATA_DIR, "admin-logs.json");
}

// Clé pour Netlify Blobs
const BLOB_STORE_NAME = "tenf-logs";
const BLOB_KEY = "admin-logs";

/**
 * Détecte si on est sur Netlify
 */
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.VERCEL === undefined
  );
}

/**
 * Charge les logs depuis Netlify Blobs
 */
async function loadLogsFromBlob(): Promise<LogEntry[]> {
  try {
    const store = getStore(BLOB_STORE_NAME);
    const data = await store.get(BLOB_KEY, { type: "text" });
    
    if (!data) {
      return [];
    }
    
    const parsed = JSON.parse(data);
    
    // Convertir les dates string en objets Date
    return parsed.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des logs depuis Netlify Blobs:", error);
    return [];
  }
}

/**
 * Sauvegarde les logs dans Netlify Blobs
 */
async function saveLogsToBlob(): Promise<void> {
  try {
    const store = getStore(BLOB_STORE_NAME);
    
    // Convertir les dates en string pour la sérialisation JSON
    const serializableLogs = logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));
    
    await store.set(BLOB_KEY, JSON.stringify(serializableLogs, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des logs dans Netlify Blobs:", error);
  }
}

/**
 * Charge les logs depuis le fichier JSON
 */
function loadLogsFromFile(): LogEntry[] {
  if (!fs || !path) {
    return [];
  }
  
  try {
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Si le fichier existe, le charger
    if (fs.existsSync(LOGS_DATA_FILE)) {
      const fileContent = fs.readFileSync(LOGS_DATA_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      
      // Convertir les dates string en objets Date
      return parsed.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch (error) {
    console.error("Erreur lors du chargement des logs depuis le fichier:", error);
  }
  return [];
}

/**
 * Sauvegarde les logs dans le fichier JSON
 */
function saveLogsToFile(): void {
  if (!fs || !path) {
    return;
  }
  
  try {
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Convertir les dates en string pour la sérialisation JSON
    const serializableLogs = logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    fs.writeFileSync(LOGS_DATA_FILE, JSON.stringify(serializableLogs, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des logs:", error);
  }
}

/**
 * Charge les logs depuis le stockage persistant
 */
async function loadLogsFromStorage(): Promise<void> {
  let savedLogs: LogEntry[] = [];
  
  if (isNetlify()) {
    savedLogs = await loadLogsFromBlob();
  } else {
    savedLogs = loadLogsFromFile();
  }
  
  // Fusionner avec les logs en mémoire (éviter les doublons)
  if (savedLogs.length > 0) {
    // Ajouter seulement les logs qui n'existent pas déjà
    const existingTimestamps = new Set(logs.map(log => log.timestamp.getTime()));
    for (const log of savedLogs) {
      if (!existingTimestamps.has(log.timestamp.getTime())) {
        logs.push(log);
      }
    }
    // Trier par date (plus récents en premier)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

/**
 * Initialise les logs au démarrage
 */
export async function initializeLogs(): Promise<void> {
  if (typeof window === "undefined") {
    await loadLogsFromStorage();
  }
}

/**
 * Enregistre une action administrative dans les logs
 * @param adminId - ID Discord de l'admin
 * @param adminUsername - Nom d'utilisateur Discord de l'admin
 * @param action - Description de l'action (ex: "Désactivation d'un membre")
 * @param target - Cible de l'action (ex: nom du membre)
 * @param details - Détails supplémentaires (ex: { oldStatus: "Actif", newStatus: "Inactif" })
 * @param ipAddress - Adresse IP de l'admin (optionnel)
 */
export async function logAction(
  adminId: string,
  adminUsername: string,
  action: string,
  target: string,
  details: Record<string, any> = {},
  ipAddress?: string
): Promise<void> {
  const logEntry: LogEntry = {
    adminId,
    adminUsername,
    action,
    target,
    details,
    timestamp: new Date(),
    ipAddress,
  };

  logs.push(logEntry);
  
  // Trier par date (plus récents en premier) et limiter à 10000 entrées
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  if (logs.length > 10000) {
    logs = logs.slice(0, 10000);
  }

  // Sauvegarder de façon persistante
  if (typeof window === "undefined") {
    if (isNetlify()) {
      await saveLogsToBlob();
    } else {
      saveLogsToFile();
    }
  }

  console.log(`[ADMIN LOG] ${adminUsername} (${adminId}) - ${action} - ${target}`, details);
}

/**
 * Récupère tous les logs
 */
export async function getLogs(limit: number = 100): Promise<LogEntry[]> {
  // Charger depuis le stockage si nécessaire
  if (typeof window === "undefined") {
    await loadLogsFromStorage();
  }
  
  return logs.slice(0, limit);
}

/**
 * Récupère les logs d'un admin spécifique
 */
export async function getLogsByAdmin(adminId: string, limit: number = 50): Promise<LogEntry[]> {
  // Charger depuis le stockage si nécessaire
  if (typeof window === "undefined") {
    await loadLogsFromStorage();
  }
  
  return logs
    .filter((log) => log.adminId === adminId)
    .slice(0, limit);
}

/**
 * Récupère les logs pour une action spécifique
 */
export async function getLogsByAction(action: string, limit: number = 50): Promise<LogEntry[]> {
  // Charger depuis le stockage si nécessaire
  if (typeof window === "undefined") {
    await loadLogsFromStorage();
  }
  
  return logs
    .filter((log) => log.action.includes(action))
    .slice(0, limit);
}
