// Système centralisé de gestion des données des membres TENF
// SÉPARATION ADMIN/BOT : Les modifications manuelles (admin) ont TOUJOURS priorité sur les synchronisations automatiques (bot)

import { allMembers } from "./members";
import { memberRoles, getMemberRole, getBadgesForMember, type MemberRole } from "./memberRoles";
import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

/**
 * Helper pour obtenir un store Netlify Blobs avec configuration explicite
 * Nécessaire pour les routes API Next.js qui n'ont pas le contexte Netlify automatique
 * 
 * Le plugin @netlify/plugin-nextjs en mode Lambda compatibility ne configure pas
 * automatiquement Netlify Blobs, il faut donc fournir siteID et token explicitement.
 */
export function getBlobStore(storeName: string) {
  // Vérifier si on est dans un environnement Netlify
  const isNetlifyEnv = !!(process.env.NETLIFY || process.env.NETLIFY_DEV || process.env.AWS_LAMBDA_FUNCTION_NAME);
  
  if (!isNetlifyEnv) {
    // En développement local, utiliser les fichiers
    throw new Error("Not in Netlify environment - cannot use Blobs");
  }
  
  // Essayer d'abord avec la méthode standard (pour compatibilité avec d'éventuels contextes)
  try {
    return getStore(storeName);
  } catch (error: any) {
    // Si ça échoue, utiliser les variables d'environnement explicites (obligatoire en Lambda mode)
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
    
    if (siteID && token) {
      try {
        return getStore({
          name: storeName,
          siteID,
          token,
        });
      } catch (configError: any) {
        console.error(`Failed to create Blob store with explicit config:`, configError.message);
        throw new Error(`Netlify Blobs configuration failed: ${configError.message}. Please check NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables.`);
      }
    }
    
    // Si aucune méthode ne fonctionne, donner des instructions claires
    const missingVars = [];
    if (!siteID) missingVars.push("NETLIFY_SITE_ID or SITE_ID");
    if (!token) missingVars.push("NETLIFY_AUTH_TOKEN, NETLIFY_BLOBS_TOKEN, or NETLIFY_PERSONAL_ACCESS_TOKEN");
    
    throw new Error(
      `Netlify Blobs not configured. Missing environment variables: ${missingVars.join(", ")}. ` +
      `Please add these in Netlify Dashboard → Site settings → Environment variables. ` +
      `Original error: ${error.message}`
    );
  }
}

export interface MemberData {
  // Identifiants
  twitchLogin: string; // Login Twitch (ex: nexou31)
  twitchId?: string; // ID numérique Twitch (ex: 123456789) - résolu automatiquement depuis twitchLogin
  twitchUrl: string; // URL complète de la chaîne Twitch
  discordId?: string; // ID Discord (ex: 535244297214361603)
  discordUsername?: string; // Pseudo Discord (ex: NeXou31)
  
  // Informations de base
  displayName: string; // Nom d'affichage par défaut
  siteUsername?: string; // Pseudo choisi sur le site (peut différer du displayName)
  
  // Rôles et statuts
  role: MemberRole;
  isVip: boolean;
  isActive: boolean;
  badges?: string[]; // Badges personnalisés (ex: "VIP Élite", "Modérateur Junior", etc.)
  listId?: number; // ID de la liste (1, 2, ou 3) - pour gérer 3 listes séparées modifiables depuis le dashboard
  roleManuallySet?: boolean; // Si true, le rôle ne sera pas écrasé par la synchronisation Discord
  
  // Informations Twitch (synchronisées)
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
    title?: string;
    thumbnailUrl?: string;
  };
  
  // Informations personnalisées (modifiables par les fondateurs)
  description?: string; // Description personnalisée du membre
  customBio?: string; // Bio personnalisée (remplace la bio Twitch si définie)
  
  // Réseaux sociaux (remplis par le membre, validés par admin)
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  profileValidationStatus?: 'non_soumis' | 'en_cours_examen' | 'valide';
  
  // Métadonnées
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string; // ID Discord de l'admin qui a modifié
  
  // Suivi staff
  integrationDate?: Date; // Date de réunion d'intégration validée
  roleHistory?: Array<{
    fromRole: string;
    toRole: string;
    changedAt: string; // ISO date string
    changedBy: string; // ID Discord ou "admin"
    reason?: string;
  }>;
  parrain?: string; // Pseudo/nom du membre parrain
}

// Stockage en mémoire (fusionné des deux sources)
let memberDataStore: Record<string, MemberData> = {};

// Chemins des fichiers de persistance (pour développement local)
const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_DATA_FILE = path.join(DATA_DIR, "admin-members.json");
const BOT_DATA_FILE = path.join(DATA_DIR, "bot-members.json");
const MEMBERS_DATA_FILE = path.join(DATA_DIR, "members.json"); // Fichier fusionné (lecture seule)

// Stores Netlify Blobs
const ADMIN_BLOB_STORE = "tenf-admin-members";
const BOT_BLOB_STORE = "tenf-bot-members";
const ADMIN_BLOB_KEY = "admin-members-data";
const BOT_BLOB_KEY = "bot-members-data";
const MERGED_BLOB_STORE = "tenf-members";
const MERGED_BLOB_KEY = "members-data"; // Fichier fusionné (généré automatiquement)

/**
 * Détecte si on est sur Netlify de façon fiable
 * Sur Netlify, on doit TOUJOURS utiliser Blobs, jamais le système de fichiers
 */
function isNetlify(): boolean {
  // Vérifier les variables d'environnement Netlify
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  
  // Vérifier si on est dans un environnement Lambda (Netlify Functions)
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  
  // Vérifier si on est dans un environnement serverless (Netlify)
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  
  // Si on est dans un environnement Next.js déployé (pas Vercel), c'est probablement Netlify
  // Mais on vérifie d'abord si on peut accéder à getStore (Netlify Blobs)
  try {
    if (typeof window === "undefined") {
      // Tester si getStore est disponible (Netlify Blobs)
      const { getStore } = require("@netlify/blobs");
      if (getStore) {
        // Si getStore est disponible, on est probablement sur Netlify
        // Mais on vérifie aussi qu'on n'est pas en développement local avec fichiers
        const fs = require("fs");
        const path = require("path");
        const dataDir = path.join(process.cwd(), "data");
        // Si le dossier data existe et est accessible, on est en développement local
        try {
          if (fs.existsSync(dataDir) && fs.statSync(dataDir).isDirectory()) {
            // En développement local, on peut utiliser les fichiers
            return false;
          }
        } catch {
          // Si on ne peut pas accéder au système de fichiers, on est sur Netlify
          return true;
        }
      }
    }
  } catch {
    // Si getStore n'est pas disponible, on n'est pas sur Netlify
  }
  
  // Par défaut, si on n'est pas sur Vercel et qu'on n'a pas de fichiers locaux, on est sur Netlify
  // Mais on privilégie toujours Blobs si disponible
  return process.env.VERCEL === undefined;
}

/**
 * Charge les données admin depuis Netlify Blobs
 */
async function loadAdminDataFromBlob(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(ADMIN_BLOB_STORE);
    const data = await store.get(ADMIN_BLOB_KEY, { type: "text" });
    
    if (!data) {
      return {};
    }
    
    const parsed = JSON.parse(data);
    const storeData: Record<string, MemberData> = {};
    for (const [key, member] of Object.entries(parsed)) {
      storeData[key] = {
        ...(member as any),
        createdAt: (member as any).createdAt ? new Date((member as any).createdAt) : undefined,
        updatedAt: (member as any).updatedAt ? new Date((member as any).updatedAt) : undefined,
        integrationDate: (member as any).integrationDate ? new Date((member as any).integrationDate) : undefined,
        roleHistory: (member as any).roleHistory || [],
      };
    }
    
    return storeData;
  } catch (error) {
    console.error("Erreur lors du chargement des données admin depuis Netlify Blobs:", error);
    return {};
  }
}

/**
 * Charge les données bot depuis Netlify Blobs
 */
async function loadBotDataFromBlob(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(BOT_BLOB_STORE);
    const data = await store.get(BOT_BLOB_KEY, { type: "text" });
    
    if (!data) {
      return {};
    }
    
    const parsed = JSON.parse(data);
    const storeData: Record<string, MemberData> = {};
    for (const [key, member] of Object.entries(parsed)) {
      storeData[key] = {
        ...(member as any),
        createdAt: (member as any).createdAt ? new Date((member as any).createdAt) : undefined,
        updatedAt: (member as any).updatedAt ? new Date((member as any).updatedAt) : undefined,
        integrationDate: (member as any).integrationDate ? new Date((member as any).integrationDate) : undefined,
        roleHistory: (member as any).roleHistory || [],
      };
    }
    
    return storeData;
  } catch (error) {
    console.error("Erreur lors du chargement des données bot depuis Netlify Blobs:", error);
    return {};
  }
}

/**
 * Sauvegarde les données admin dans Netlify Blobs
 */
async function saveAdminDataToBlob(data: Record<string, MemberData>): Promise<void> {
  try {
    const store = getBlobStore(ADMIN_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    await store.set(ADMIN_BLOB_KEY, JSON.stringify(serializableData, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données admin dans Netlify Blobs:", error);
    throw error;
  }
}

/**
 * Sauvegarde les données bot dans Netlify Blobs
 */
async function saveBotDataToBlob(data: Record<string, MemberData>): Promise<void> {
  try {
    const store = getBlobStore(BOT_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    await store.set(BOT_BLOB_KEY, JSON.stringify(serializableData, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données bot dans Netlify Blobs:", error);
    throw error;
  }
}

/**
 * Génère et sauvegarde le fichier fusionné dans Netlify Blobs
 */
async function saveMergedDataToBlob(): Promise<void> {
  try {
    const store = getBlobStore(MERGED_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberDataStore)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    await store.set(MERGED_BLOB_KEY, JSON.stringify(serializableData, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données fusionnées dans Netlify Blobs:", error);
  }
}

/**
 * Charge les données admin depuis le fichier JSON (développement local)
 */
function loadAdminDataFromFile(): Record<string, MemberData> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ADMIN_DATA_FILE)) {
      const fileContent = fs.readFileSync(ADMIN_DATA_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      const store: Record<string, MemberData> = {};
      for (const [key, member] of Object.entries(parsed)) {
        store[key] = {
          ...(member as any),
          createdAt: (member as any).createdAt ? new Date((member as any).createdAt) : undefined,
          updatedAt: (member as any).updatedAt ? new Date((member as any).updatedAt) : undefined,
          integrationDate: (member as any).integrationDate ? new Date((member as any).integrationDate) : undefined,
          roleHistory: (member as any).roleHistory || [],
        };
      }
      return store;
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données admin:", error);
  }
  return {};
}

/**
 * Charge les données bot depuis le fichier JSON (développement local)
 */
function loadBotDataFromFile(): Record<string, MemberData> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(BOT_DATA_FILE)) {
      const fileContent = fs.readFileSync(BOT_DATA_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      const store: Record<string, MemberData> = {};
      for (const [key, member] of Object.entries(parsed)) {
        store[key] = {
          ...(member as any),
          createdAt: (member as any).createdAt ? new Date((member as any).createdAt) : undefined,
          updatedAt: (member as any).updatedAt ? new Date((member as any).updatedAt) : undefined,
          integrationDate: (member as any).integrationDate ? new Date((member as any).integrationDate) : undefined,
          roleHistory: (member as any).roleHistory || [],
        };
      }
      return store;
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données bot:", error);
  }
  return {};
}

/**
 * Sauvegarde les données admin dans le fichier JSON (développement local)
 */
function saveAdminDataToFile(data: Record<string, MemberData>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    fs.writeFileSync(ADMIN_DATA_FILE, JSON.stringify(serializableData, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données admin:", error);
  }
}

/**
 * Sauvegarde les données bot dans le fichier JSON (développement local)
 */
function saveBotDataToFile(data: Record<string, MemberData>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    fs.writeFileSync(BOT_DATA_FILE, JSON.stringify(serializableData, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données bot:", error);
  }
}

/**
 * Sauvegarde le fichier fusionné (développement local)
 */
function saveMergedDataToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberDataStore)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
        roleHistory: member.roleHistory, // Déjà en format JSON (array d'objets)
      };
    }
    fs.writeFileSync(MEMBERS_DATA_FILE, JSON.stringify(serializableData, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données fusionnées:", error);
  }
}

/**
 * Fusionne les données admin et bot en donnant TOUJOURS priorité aux données admin
 */
function mergeAdminAndBotData(
  adminData: Record<string, MemberData>,
  botData: Record<string, MemberData>
): Record<string, MemberData> {
  const merged: Record<string, MemberData> = {};
  
  // Créer une liste des membres supprimés depuis adminData
  const deletedMembers = new Set<string>();
  for (const [key, adminMember] of Object.entries(adminData)) {
    if (key.startsWith("__deleted_")) {
      // Extraire le login depuis la clé __deleted_<login>
      const login = key.replace("__deleted_", "");
      deletedMembers.add(login);
    } else if ((adminMember as any).deleted === true) {
      // Membre marqué comme supprimé
      deletedMembers.add(adminMember.twitchLogin.toLowerCase());
    }
  }
  
  // D'abord, ajouter toutes les données bot (sauf les membres supprimés)
  for (const [key, botMember] of Object.entries(botData)) {
    const login = botMember.twitchLogin.toLowerCase();
    if (!deletedMembers.has(login)) {
      merged[login] = { ...botMember };
    }
  }
  
  // Ensuite, écraser avec les données admin (priorité absolue)
  // Exclure les entrées de suppression (__deleted_*)
  for (const [key, adminMember] of Object.entries(adminData)) {
    // Ignorer les entrées de suppression
    if (key.startsWith("__deleted_")) {
      continue;
    }
    
    // Ignorer les membres marqués comme supprimés
    if ((adminMember as any).deleted === true) {
      continue;
    }
    
    const login = adminMember.twitchLogin.toLowerCase();
    // Ignorer si le membre est dans la liste des supprimés
    if (deletedMembers.has(login)) {
      continue;
    }
    
    if (merged[login]) {
      // Fusionner : admin a priorité sur tous les champs
      merged[login] = {
        ...merged[login], // Base bot
        ...adminMember, // Écraser avec admin (priorité absolue)
        // Préserver certains champs de bot si admin ne les a pas définis
        twitchStatus: adminMember.twitchStatus || merged[login].twitchStatus,
      };
    } else {
      // Membre uniquement dans admin
      merged[login] = { ...adminMember };
    }
  }
  
  return merged;
}

/**
 * Charge et fusionne les données depuis le stockage persistant
 * Les données admin ont TOUJOURS priorité sur les données bot
 */
export async function loadMemberDataFromStorage(): Promise<void> {
  let adminData: Record<string, MemberData> = {};
  let botData: Record<string, MemberData> = {};
  
  // Vérifier si on peut utiliser Blobs (Netlify)
  let useBlobs = false;
  try {
    const { getStore } = require("@netlify/blobs");
    if (getStore) {
      const testStore = getBlobStore("tenf-admin-members");
      if (testStore) {
        useBlobs = true;
      }
    }
  } catch {
    // getStore non disponible
  }
  
  // Si on n'est pas sur Netlify, vérifier si on peut utiliser les fichiers
  if (!useBlobs) {
    try {
      const fs = require("fs");
      const path = require("path");
      const dataDir = path.join(process.cwd(), "data");
      if (fs.existsSync(dataDir) || fs.existsSync(process.cwd())) {
        // En développement local, utiliser les fichiers
        adminData = loadAdminDataFromFile();
        botData = loadBotDataFromFile();
      } else {
        // Si fichiers non disponibles, forcer Blobs
        useBlobs = true;
      }
    } catch {
      // Si on ne peut pas accéder au système de fichiers, forcer Blobs
      useBlobs = true;
    }
  }
  
  // Sur Netlify ou si fichiers non disponibles, utiliser Blobs
  if (useBlobs) {
    adminData = await loadAdminDataFromBlob();
    botData = await loadBotDataFromBlob();
  }
  
  // Fusionner avec priorité admin
  memberDataStore = mergeAdminAndBotData(adminData, botData);
  
  // Sauvegarder le fichier fusionné (pour lecture rapide)
  if (typeof window === "undefined") {
    if (useBlobs) {
      await saveMergedDataToBlob();
    } else {
      saveMergedDataToFile();
    }
  }
}

/**
 * Charge uniquement les données admin (pour le dashboard)
 */
export async function loadAdminDataFromStorage(): Promise<Record<string, MemberData>> {
  // Vérifier si on peut utiliser Blobs (Netlify)
  let useBlobs = false;
  try {
    const { getStore } = require("@netlify/blobs");
    if (getStore) {
      const testStore = getBlobStore("tenf-admin-members");
      if (testStore) {
        useBlobs = true;
      }
    }
  } catch {
    // getStore non disponible
  }
  
  // Si on n'est pas sur Netlify, vérifier si on peut utiliser les fichiers
  if (!useBlobs) {
    try {
      const fs = require("fs");
      const path = require("path");
      const dataDir = path.join(process.cwd(), "data");
      if (fs.existsSync(dataDir) || fs.existsSync(process.cwd())) {
        // En développement local, utiliser les fichiers
        return loadAdminDataFromFile();
      } else {
        // Si fichiers non disponibles, forcer Blobs
        useBlobs = true;
      }
    } catch {
      // Si on ne peut pas accéder au système de fichiers, forcer Blobs
      useBlobs = true;
    }
  }
  
  // Sur Netlify ou si fichiers non disponibles, utiliser Blobs
  if (useBlobs) {
    return await loadAdminDataFromBlob();
  } else {
    return loadAdminDataFromFile();
  }
}

/**
 * Charge uniquement les données bot (pour la synchronisation)
 */
export async function loadBotDataFromStorage(): Promise<Record<string, MemberData>> {
  // Vérifier si on peut utiliser Blobs (Netlify)
  let useBlobs = false;
  try {
    const { getStore } = require("@netlify/blobs");
    if (getStore) {
      const testStore = getBlobStore("tenf-bot-members");
      if (testStore) {
        useBlobs = true;
      }
    }
  } catch {
    // getStore non disponible
  }
  
  // Si on n'est pas sur Netlify, vérifier si on peut utiliser les fichiers
  if (!useBlobs) {
    try {
      const fs = require("fs");
      const path = require("path");
      const dataDir = path.join(process.cwd(), "data");
      if (fs.existsSync(dataDir) || fs.existsSync(process.cwd())) {
        // En développement local, utiliser les fichiers
        return loadBotDataFromFile();
      } else {
        // Si fichiers non disponibles, forcer Blobs
        useBlobs = true;
      }
    } catch {
      // Si on ne peut pas accéder au système de fichiers, forcer Blobs
      useBlobs = true;
    }
  }
  
  // Sur Netlify ou si fichiers non disponibles, utiliser Blobs
  if (useBlobs) {
    return await loadBotDataFromBlob();
  } else {
    return loadBotDataFromFile();
  }
}

/**
 * Sauvegarde les données admin (appelé uniquement depuis le dashboard)
 * IMPORTANT: Sur Netlify, on utilise TOUJOURS Blobs, jamais le système de fichiers
 */
export async function saveAdminData(data: Record<string, MemberData>): Promise<void> {
  if (typeof window === "undefined") {
    // Vérifier si on peut utiliser Blobs (Netlify)
    let useBlobs = false;
    try {
      const { getStore } = require("@netlify/blobs");
      if (getStore) {
        // Tester si on peut créer un store (on est sur Netlify)
        const testStore = getBlobStore("tenf-admin-members");
        if (testStore) {
          useBlobs = true;
        }
      }
    } catch {
      // getStore non disponible, on n'est pas sur Netlify
    }
    
    // Si on n'est pas sur Netlify, vérifier si on peut utiliser les fichiers
    if (!useBlobs) {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataDir = path.join(process.cwd(), "data");
        // Si le dossier data existe et est accessible, on est en développement local
        if (fs.existsSync(dataDir) || fs.existsSync(process.cwd())) {
          // En développement local, utiliser les fichiers
          saveAdminDataToFile(data);
          await loadMemberDataFromStorage();
          return;
        }
      } catch {
        // Si on ne peut pas accéder au système de fichiers, forcer Blobs
        useBlobs = true;
      }
    }
    
    // Sur Netlify ou si fichiers non disponibles, utiliser Blobs
    if (useBlobs) {
      await saveAdminDataToBlob(data);
    } else {
      saveAdminDataToFile(data);
    }
    
    // Recharger et fusionner après sauvegarde
    await loadMemberDataFromStorage();
  }
}

/**
 * Sauvegarde les données bot (appelé uniquement depuis les scripts de synchronisation)
 * IMPORTANT: Sur Netlify, on utilise TOUJOURS Blobs, jamais le système de fichiers
 */
export async function saveBotData(data: Record<string, MemberData>): Promise<void> {
  if (typeof window === "undefined") {
    // Vérifier si on peut utiliser Blobs (Netlify)
    let useBlobs = false;
    try {
      const { getStore } = require("@netlify/blobs");
      if (getStore) {
        // Tester si on peut créer un store (on est sur Netlify)
        const testStore = getBlobStore("tenf-bot-members");
        if (testStore) {
          useBlobs = true;
        }
      }
    } catch {
      // getStore non disponible, on n'est pas sur Netlify
    }
    
    // Si on n'est pas sur Netlify, vérifier si on peut utiliser les fichiers
    if (!useBlobs) {
      try {
        const fs = require("fs");
        const path = require("path");
        const dataDir = path.join(process.cwd(), "data");
        // Si le dossier data existe et est accessible, on est en développement local
        if (fs.existsSync(dataDir) || fs.existsSync(process.cwd())) {
          // En développement local, utiliser les fichiers
          saveBotDataToFile(data);
          await loadMemberDataFromStorage();
          return;
        }
      } catch {
        // Si on ne peut pas accéder au système de fichiers, forcer Blobs
        useBlobs = true;
      }
    }
    
    // Sur Netlify ou si fichiers non disponibles, utiliser Blobs
    if (useBlobs) {
      await saveBotDataToBlob(data);
    } else {
      saveBotDataToFile(data);
    }
    
    // Recharger et fusionner après sauvegarde
    await loadMemberDataFromStorage();
  }
}

/**
 * Initialise le store avec les données existantes
 */
export function initializeMemberData() {
  // En développement local, charger depuis les fichiers
  if (!isNetlify()) {
    const adminData = loadAdminDataFromFile();
    const botData = loadBotDataFromFile();
    
    if (Object.keys(adminData).length > 0 || Object.keys(botData).length > 0) {
      memberDataStore = mergeAdminAndBotData(adminData, botData);
      return;
    }
  }
  
  // Sinon, construire le store à partir des données existantes (première initialisation)
  allMembers.forEach((member) => {
    const roleInfo = getMemberRole(member.twitchLogin);
    const login = member.twitchLogin.toLowerCase();
    
    if (!memberDataStore[login]) {
      const badges = getBadgesForMember(member.twitchLogin);
      
      memberDataStore[login] = {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        siteUsername: member.displayName,
        twitchUrl: member.twitchUrl,
        discordUsername: member.discordUsername,
        role: roleInfo.role,
        isVip: roleInfo.isVip,
        isActive: roleInfo.isActive,
        badges: badges.length > 0 ? badges : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      const badges = getBadgesForMember(member.twitchLogin);
      if (badges.length > 0) {
        memberDataStore[login].badges = badges;
      }
      if (!memberDataStore[login].roleManuallySet) {
        memberDataStore[login].role = roleInfo.role;
        memberDataStore[login].isVip = roleInfo.isVip;
        memberDataStore[login].updatedAt = new Date();
      }
    }
  });
}

// Variable pour éviter les initialisations multiples
let isInitialized = false;

// Initialiser au chargement (une seule fois)
if (typeof window === "undefined" && !isInitialized) {
  initializeMemberData();
  isInitialized = true;
}

/**
 * Récupère toutes les données d'un membre par son login Twitch
 */
export function getMemberData(twitchLogin: string): MemberData | null {
  const login = twitchLogin.toLowerCase();
  return memberDataStore[login] || null;
}

/**
 * Trouve un membre par son identifiant stable (discordId ou twitchId en priorité)
 */
export function findMemberByIdentifier(options: {
  discordId?: string;
  twitchId?: string;
  twitchLogin?: string;
}): MemberData | null {
  // Priorité 1: Chercher par discordId (le plus stable)
  if (options.discordId) {
    const found = Object.values(memberDataStore).find(
      m => m.discordId === options.discordId
    );
    if (found) {
      console.log(`[findMemberByIdentifier] Trouvé par discordId: ${options.discordId}`);
      return found;
    }
  }

  // Priorité 2: Chercher par twitchId (stable aussi)
  if (options.twitchId) {
    const found = Object.values(memberDataStore).find(
      m => m.twitchId === options.twitchId
    );
    if (found) {
      console.log(`[findMemberByIdentifier] Trouvé par twitchId: ${options.twitchId}`);
      return found;
    }
  }

  // Priorité 3: Chercher par twitchLogin (peut changer)
  if (options.twitchLogin) {
    const login = options.twitchLogin.toLowerCase();
    const found = memberDataStore[login];
    if (found) {
      console.log(`[findMemberByIdentifier] Trouvé par twitchLogin: ${login}`);
      return found;
    }
  }

  console.warn(`[findMemberByIdentifier] Membre non trouvé avec:`, options);
  return null;
}

/**
 * Récupère toutes les données des membres actifs
 */
export function getAllActiveMemberData(): MemberData[] {
  return Object.values(memberDataStore).filter((member) => member.isActive);
}

/**
 * Récupère toutes les données des membres VIP
 */
export function getAllVipMemberData(): MemberData[] {
  return Object.values(memberDataStore).filter((member) => member.isVip && member.isActive);
}

/**
 * Récupère les données des membres par rôle
 */
export function getMemberDataByRole(role: MemberRole): MemberData[] {
  return Object.values(memberDataStore).filter(
    (member) => member.role === role && member.isActive
  );
}

/**
 * Récupère les membres d'une liste spécifique (1, 2, ou 3)
 */
export function getMemberDataByList(listId: number): MemberData[] {
  return Object.values(memberDataStore).filter(
    (member) => member.isActive && member.listId === listId
  );
}

/**
 * Récupère tous les membres actifs de toutes les listes (1, 2, et 3 combinées)
 */
export function getAllActiveMemberDataFromAllLists(): MemberData[] {
  return Object.values(memberDataStore).filter(
    (member) => {
      if (!member.isActive) return false;
      if (member.listId === 1 || member.listId === 2 || member.listId === 3) return true;
      if (!member.listId) return true;
      return false;
    }
  );
}

/**
 * Met à jour les données d'un membre (DASHBOARD ADMIN - écrit dans admin-members-data)
 * IMPORTANT: Cette fonction préserve les données admin existantes et fusionne avec les données bot
 * 
 * @param identifier - Identifiant du membre (peut être twitchLogin, discordId, ou twitchId)
 * @param updates - Mises à jour à appliquer
 * @param updatedBy - ID Discord de l'admin qui fait la modification
 */
export async function updateMemberData(
  identifier: string | { discordId?: string; twitchId?: string; twitchLogin?: string },
  updates: Partial<MemberData>,
  updatedBy: string
): Promise<MemberData | null> {
  // Charger les données admin et bot séparément
  const adminData = await loadAdminDataFromStorage();
  const botData = await loadBotDataFromStorage();
  
  // Charger les données fusionnées pour avoir la vue complète
  await loadMemberDataFromStorage();
  
  // Identifier le membre existant
  let existing: MemberData | null = null;
  let existingLogin: string | null = null;
  let existingAdminMember: MemberData | undefined;

  if (typeof identifier === 'string') {
    // Mode legacy: identifier est un twitchLogin
    existingLogin = identifier.toLowerCase();
    existing = memberDataStore[existingLogin] || null;
    existingAdminMember = adminData[existingLogin];
  } else {
    // Mode nouveau: identifier est un objet avec discordId/twitchId/twitchLogin
    existing = findMemberByIdentifier(identifier);
    if (existing) {
      existingLogin = existing.twitchLogin.toLowerCase();
      existingAdminMember = adminData[existingLogin];
    }
  }

  if (!existing || !existingLogin) {
    console.error(`[updateMemberData] Membre non trouvé avec identifiant:`, identifier);
    return null;
  }

  console.log(`[updateMemberData] Mise à jour membre id=${existingLogin} (discordId: ${existing.discordId}, twitchId: ${existing.twitchId})`);
  
  // Créer createdAt automatiquement si absent (seulement si l'utilisateur ne le modifie pas manuellement)
  if (updates.createdAt === undefined) {
    // Si createdAt n'est pas dans les updates, créer automatiquement seulement si absent
    if (!existingAdminMember?.createdAt && !existing?.createdAt) {
      updates.createdAt = new Date();
    }
  }
  // Si updates.createdAt est défini (modification manuelle), on le garde tel quel (déjà un Date)

  // Gérer l'historique des rôles si le rôle change
  let roleHistory = existingAdminMember?.roleHistory || existing?.roleHistory || [];
  if (updates.role && existing.role && updates.role !== existing.role) {
    roleHistory = [
      ...roleHistory,
      {
        fromRole: existing.role,
        toRole: updates.role,
        changedAt: new Date().toISOString(),
        changedBy: updatedBy || "admin",
        reason: (updates as any).roleChangeReason,
      },
    ];
    updates.roleHistory = roleHistory;
    
    // Enregistrer l'événement role_changed (utiliser discordId ou twitchId si disponible pour l'identifiant du membre)
    try {
      const { recordMemberEvent } = await import('@/lib/memberEvents');
      // Utiliser discordId en priorité pour l'identifiant stable, sinon twitchLogin
      const memberIdentifier = existing.discordId || existing.twitchId || existingLogin;
      await recordMemberEvent(memberIdentifier, 'role_changed', {
        source: 'manual',
        actor: updatedBy || 'admin',
        payload: {
          fromRole: existing.role,
          toRole: updates.role,
          reason: (updates as any).roleChangeReason,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'événement role_changed:', error);
    }
  }
  
  // Enregistrer l'événement integration_validated si la date d'intégration est ajoutée/modifiée
  if (updates.integrationDate !== undefined) {
    const hadIntegrationDate = existingAdminMember?.integrationDate || existing?.integrationDate;
    const hasNewIntegrationDate = updates.integrationDate !== null && updates.integrationDate !== undefined;
    
    // Si on passe de "pas de date" à "une date", ou si la date change
    if ((!hadIntegrationDate && hasNewIntegrationDate) || 
        (hadIntegrationDate && hasNewIntegrationDate && 
         new Date(updates.integrationDate).getTime() !== new Date(hadIntegrationDate).getTime())) {
      try {
        const { recordMemberEvent } = await import('@/lib/memberEvents');
        // Utiliser discordId en priorité pour l'identifiant stable, sinon twitchLogin
        const memberIdentifier = existing.discordId || existing.twitchId || existingLogin;
        await recordMemberEvent(memberIdentifier, 'integration_validated', {
          source: 'manual',
          actor: updatedBy || 'admin',
          payload: {
            date: updates.integrationDate instanceof Date 
              ? updates.integrationDate.toISOString() 
              : updates.integrationDate,
            previousDate: hadIntegrationDate 
              ? (hadIntegrationDate instanceof Date ? hadIntegrationDate.toISOString() : hadIntegrationDate)
              : null,
          },
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'événement integration_validated:', error);
      }
    }
  }
  
  // Enregistrer l'événement manual_note_updated si les notes internes changent
  // Note: On ne stocke pas les notes internes dans MemberData, donc on vérifie si elles sont dans updates
  if ((updates as any).notesInternes !== undefined) {
    const previousNotes = (existingAdminMember as any)?.notesInternes || (existing as any)?.notesInternes;
    const newNotes = (updates as any).notesInternes;
    
    if (previousNotes !== newNotes) {
      try {
        const { recordMemberEvent } = await import('@/lib/memberEvents');
        // Utiliser discordId en priorité pour l'identifiant stable, sinon twitchLogin
        const memberIdentifier = existing.discordId || existing.twitchId || existingLogin;
        await recordMemberEvent(memberIdentifier, 'manual_note_updated', {
          source: 'manual',
          actor: updatedBy || 'admin',
          payload: {
            // Ne pas stocker le contenu des notes pour la confidentialité, juste indiquer qu'elles ont changé
            hasNotes: !!newNotes,
            notesLength: newNotes ? newNotes.length : 0,
          },
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'événement manual_note_updated:', error);
      }
    }
  }

  // Si le twitchLogin change, on doit mettre à jour la clé dans le store
  const newTwitchLogin = updates.twitchLogin || existing.twitchLogin;
  const newLogin = newTwitchLogin.toLowerCase();
  const loginChanged = newLogin !== existingLogin;

  // Préparer les données mises à jour
  const updatedMemberData: MemberData = existingAdminMember 
    ? {
        ...existingAdminMember, // Préserver les données admin existantes
        ...updates, // Appliquer les nouvelles modifications
        roleHistory: updates.roleHistory || existingAdminMember.roleHistory,
        updatedAt: new Date(),
        updatedBy,
      }
    : {
        ...existing, // Base depuis les données fusionnées
        ...updates, // Appliquer les modifications
        roleHistory: updates.roleHistory || existing.roleHistory,
        updatedAt: new Date(),
        updatedBy,
      };

  // Log pour vérifier que parrain est bien inclus
  if (updates.parrain !== undefined) {
    console.log(`[updateMemberData] Parrain sauvegardé pour ${newLogin}:`, updates.parrain);
  }

  // Si le login a changé, supprimer l'ancienne entrée et créer la nouvelle
  if (loginChanged) {
    console.log(`[updateMemberData] Login changé: ${existingLogin} → ${newLogin}, mise à jour de la clé`);
    delete adminData[existingLogin];
    delete memberDataStore[existingLogin];
  }

  // Sauvegarder avec la nouvelle clé (ou l'ancienne si pas changé)
  adminData[newLogin] = updatedMemberData;
  memberDataStore[newLogin] = updatedMemberData;
  
  // Sauvegarder les données admin
  await saveAdminData(adminData);
  
  // Mettre à jour le store fusionné en mémoire (les données fusionnées seront régénérées au prochain loadMemberDataFromStorage)
  memberDataStore[newLogin] = updatedMemberData;
  
  console.log(`[updateMemberData] ✅ Membre mis à jour avec succès (clé: ${newLogin})`);
  return adminData[newLogin];
}

/**
 * Crée un nouveau membre (DASHBOARD ADMIN - écrit dans admin-members-data)
 * Vérifie d'abord si le membre existe déjà pour éviter les doublons
 */
export async function createMemberData(
  memberData: Omit<MemberData, "createdAt" | "updatedAt" | "updatedBy">,
  createdBy: string
): Promise<MemberData> {
  const login = memberData.twitchLogin.toLowerCase();
  
  // Charger les données admin actuelles
  const adminData = await loadAdminDataFromStorage();
  
  // Supprimer l'entrée de suppression si elle existe (pour permettre la recréation)
  const deletedKey = `__deleted_${login}`;
  if (adminData[deletedKey]) {
    delete adminData[deletedKey];
    console.log(`[Create Member] Suppression de l'entrée __deleted_${login} pour permettre la recréation`);
  }
  
  // Vérifier si le membre existe déjà dans admin
  if (adminData[login]) {
    // Membre existe déjà : mettre à jour au lieu de créer
    // Vérifier aussi s'il est marqué comme supprimé
    const existingMember = adminData[login] as any;
    if (existingMember.deleted === true) {
      // Réactiver le membre en supprimant le flag deleted
      delete existingMember.deleted;
    }
    // Créer le nouveau membre sans le flag deleted
    const { deleted, ...memberDataWithoutDeleted } = existingMember as any;
    adminData[login] = {
      ...memberDataWithoutDeleted,
      ...memberData,
      updatedAt: new Date(),
      updatedBy: createdBy,
    } as MemberData;
  } else {
    // Nouveau membre : créer
    adminData[login] = {
      ...memberData,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: createdBy,
    };
  }
  
  // Sauvegarder les données admin
  await saveAdminData(adminData);
  
  return adminData[login];
}

/**
 * Supprime complètement un membre du système (DASHBOARD ADMIN)
 * - Supprime de adminData
 * - Supprime de botData
 * - Crée une entrée de suppression dans adminData pour empêcher la resynchronisation
 * - Recharge les données fusionnées
 */
export async function deleteMemberData(twitchLogin: string, deletedBy?: string): Promise<boolean> {
  const login = twitchLogin.toLowerCase();
  
  // Charger les données fusionnées pour vérifier si le membre existe
  await loadMemberDataFromStorage();
  const existing = memberDataStore[login];
  
  if (!existing) {
    // Membre n'existe pas du tout
    return false;
  }
  
  // Charger les données admin et bot séparément
  const adminData = await loadAdminDataFromStorage();
  const botData = await loadBotDataFromStorage();
  
  // Supprimer de adminData si présent
  if (adminData[login]) {
    delete adminData[login];
  }
  
  // Supprimer de botData si présent
  if (botData[login]) {
    delete botData[login];
  }
  
  // Créer une entrée de suppression dans adminData pour empêcher la resynchronisation
  // Cette entrée sera utilisée pour exclure le membre de la fusion et empêcher la resynchronisation Discord
  adminData[`__deleted_${login}`] = {
    twitchLogin: login,
    twitchUrl: existing.twitchUrl || `https://www.twitch.tv/${login}`,
    displayName: existing.displayName || login,
    role: existing.role || "Affilié",
    isVip: false,
    isActive: false,
    deleted: true, // Flag spécial pour indiquer que c'est une suppression
    updatedAt: new Date(),
    updatedBy: deletedBy || "admin",
  } as any;
  
  // Sauvegarder les données admin (avec l'entrée de suppression)
  await saveAdminData(adminData);
  
  // Sauvegarder les données bot (sans le membre supprimé)
  await saveBotData(botData);
  
  // Recharger les données fusionnées pour mettre à jour memberDataStore
  await loadMemberDataFromStorage();
  
  // Vérifier que le membre a bien été supprimé de memberDataStore
  if (memberDataStore[login]) {
    console.warn(`[Delete Member] Le membre ${login} est toujours présent dans memberDataStore après suppression`);
  }
  
  return true;
}

/**
 * Met à jour le statut Twitch d'un membre (ne modifie pas les stores, juste en mémoire)
 */
export function updateTwitchStatus(
  twitchLogin: string,
  status: MemberData["twitchStatus"]
): void {
  const login = twitchLogin.toLowerCase();
  if (memberDataStore[login]) {
    memberDataStore[login].twitchStatus = status;
    memberDataStore[login].updatedAt = new Date();
  }
}

/**
 * Récupère tous les membres avec leurs données complètes (fusionnées)
 */
export function getAllMemberData(): MemberData[] {
  return Object.values(memberDataStore);
}
