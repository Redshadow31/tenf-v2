// Système centralisé de gestion des données des membres TENF
// SÉPARATION ADMIN/BOT : Les modifications manuelles (admin) ont TOUJOURS priorité sur les synchronisations automatiques (bot)

import { allMembers } from "./members";
import { memberRoles, getMemberRole, getBadgesForMember, type MemberRole } from "./memberRoles";
import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

export interface MemberData {
  // Identifiants
  twitchLogin: string; // Login Twitch (ex: nexou31)
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
  
  // Métadonnées
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string; // ID Discord de l'admin qui a modifié
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
 * Charge les données admin depuis Netlify Blobs
 */
async function loadAdminDataFromBlob(): Promise<Record<string, MemberData>> {
  try {
    const store = getStore(ADMIN_BLOB_STORE);
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
    const store = getStore(BOT_BLOB_STORE);
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
    const store = getStore(ADMIN_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
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
    const store = getStore(BOT_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(data)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
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
    const store = getStore(MERGED_BLOB_STORE);
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberDataStore)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
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
  
  // D'abord, ajouter toutes les données bot
  for (const [key, botMember] of Object.entries(botData)) {
    merged[key] = { ...botMember };
  }
  
  // Ensuite, écraser avec les données admin (priorité absolue)
  for (const [key, adminMember] of Object.entries(adminData)) {
    if (merged[key]) {
      // Fusionner : admin a priorité sur tous les champs
      merged[key] = {
        ...merged[key], // Base bot
        ...adminMember, // Écraser avec admin (priorité absolue)
        // Préserver certains champs de bot si admin ne les a pas définis
        twitchStatus: adminMember.twitchStatus || merged[key].twitchStatus,
      };
    } else {
      // Membre uniquement dans admin
      merged[key] = { ...adminMember };
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
  
  if (isNetlify()) {
    // Charger depuis Netlify Blobs
    adminData = await loadAdminDataFromBlob();
    botData = await loadBotDataFromBlob();
  } else {
    // Charger depuis les fichiers locaux
    adminData = loadAdminDataFromFile();
    botData = loadBotDataFromFile();
  }
  
  // Fusionner avec priorité admin
  memberDataStore = mergeAdminAndBotData(adminData, botData);
  
  // Sauvegarder le fichier fusionné (pour lecture rapide)
  if (typeof window === "undefined") {
    if (isNetlify()) {
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
  if (isNetlify()) {
    return await loadAdminDataFromBlob();
  } else {
    return loadAdminDataFromFile();
  }
}

/**
 * Charge uniquement les données bot (pour la synchronisation)
 */
export async function loadBotDataFromStorage(): Promise<Record<string, MemberData>> {
  if (isNetlify()) {
    return await loadBotDataFromBlob();
  } else {
    return loadBotDataFromFile();
  }
}

/**
 * Sauvegarde les données admin (appelé uniquement depuis le dashboard)
 */
export async function saveAdminData(data: Record<string, MemberData>): Promise<void> {
  if (typeof window === "undefined") {
    if (isNetlify()) {
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
 */
export async function saveBotData(data: Record<string, MemberData>): Promise<void> {
  if (typeof window === "undefined") {
    if (isNetlify()) {
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
 * Récupère toutes les données d'un membre
 */
export function getMemberData(twitchLogin: string): MemberData | null {
  const login = twitchLogin.toLowerCase();
  return memberDataStore[login] || null;
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
 */
export async function updateMemberData(
  twitchLogin: string,
  updates: Partial<MemberData>,
  updatedBy: string
): Promise<MemberData | null> {
  const login = twitchLogin.toLowerCase();
  
  // Charger les données admin et bot séparément
  const adminData = await loadAdminDataFromStorage();
  const botData = await loadBotDataFromStorage();
  
  // Charger les données fusionnées pour avoir la vue complète
  await loadMemberDataFromStorage();
  const existing = memberDataStore[login];
  
  if (!existing) {
    return null;
  }
  
  // Si le membre existe déjà dans admin, préserver ses données et fusionner avec les updates
  // Sinon, créer une nouvelle entrée admin basée sur les données fusionnées
  const existingAdminMember = adminData[login];
  
  if (existingAdminMember) {
    // Membre existe dans admin : préserver ses données et appliquer les updates
    adminData[login] = {
      ...existingAdminMember, // Préserver les données admin existantes
      ...updates, // Appliquer les nouvelles modifications
      updatedAt: new Date(),
      updatedBy,
    };
  } else {
    // Membre n'existe pas dans admin : créer une nouvelle entrée admin
    // Utiliser les données fusionnées comme base, mais les updates ont priorité
    adminData[login] = {
      ...existing, // Base depuis les données fusionnées
      ...updates, // Appliquer les modifications
      updatedAt: new Date(),
      updatedBy,
    };
  }
  
  // Sauvegarder les données admin
  await saveAdminData(adminData);
  
  return adminData[login];
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
  
  // Vérifier si le membre existe déjà dans admin
  if (adminData[login]) {
    // Membre existe déjà : mettre à jour au lieu de créer
    adminData[login] = {
      ...adminData[login],
      ...memberData,
      updatedAt: new Date(),
      updatedBy: createdBy,
    };
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
 * Supprime un membre (DASHBOARD ADMIN - supprime de admin-members-data)
 */
export async function deleteMemberData(twitchLogin: string, deletedBy?: string): Promise<boolean> {
  const login = twitchLogin.toLowerCase();
  
  // Charger les données admin actuelles
  const adminData = await loadAdminDataFromStorage();
  
  if (adminData[login]) {
    delete adminData[login];
    await saveAdminData(adminData);
    return true;
  }
  
  return false;
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
