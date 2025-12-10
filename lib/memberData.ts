// Système centralisé de gestion des données des membres TENF
// Toutes les informations des membres sont stockées ici et synchronisées partout

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

// Stockage en mémoire avec persistance dans un fichier JSON ou Netlify Blobs
let memberDataStore: Record<string, MemberData> = {};

// Chemin du fichier de persistance (pour développement local)
const DATA_DIR = path.join(process.cwd(), "data");
const MEMBERS_DATA_FILE = path.join(DATA_DIR, "members.json");

// Clé pour Netlify Blobs
const BLOB_STORE_NAME = "tenf-members";
const BLOB_KEY = "members-data";

/**
 * Détecte si on est sur Netlify
 */
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.VERCEL === undefined // Si pas Vercel, probablement Netlify
  );
}

/**
 * Charge les données depuis Netlify Blobs
 */
async function loadMemberDataFromBlob(): Promise<Record<string, MemberData>> {
  try {
    const store = getStore(BLOB_STORE_NAME);
    
    const data = await store.get(BLOB_KEY, { type: "text" });
    
    if (!data) {
      return {};
    }
    
    const parsed = JSON.parse(data);
    
    // Convertir les dates string en objets Date
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
    console.error("Erreur lors du chargement des données depuis Netlify Blobs:", error);
    return {};
  }
}

/**
 * Sauvegarde les données dans Netlify Blobs
 */
async function saveMemberDataToBlob(): Promise<void> {
  try {
    const store = getStore(BLOB_STORE_NAME);
    
    // Convertir les dates en string pour la sérialisation JSON
    const serializableStore: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberDataStore)) {
      serializableStore[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
      };
    }
    
    await store.set(BLOB_KEY, JSON.stringify(serializableStore, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données dans Netlify Blobs:", error);
  }
}

/**
 * Charge les données depuis le fichier JSON
 */
function loadMemberDataFromFile(): Record<string, MemberData> {
  try {
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Si le fichier existe, le charger
    if (fs.existsSync(MEMBERS_DATA_FILE)) {
      const fileContent = fs.readFileSync(MEMBERS_DATA_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      
      // Convertir les dates string en objets Date
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
    console.error("Erreur lors du chargement des données membres:", error);
  }
  return {};
}

/**
 * Sauvegarde les données dans le fichier JSON
 */
function saveMemberDataToFile(): void {
  try {
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Convertir les dates en string pour la sérialisation JSON
    const serializableStore: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberDataStore)) {
      serializableStore[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
      };
    }

    fs.writeFileSync(MEMBERS_DATA_FILE, JSON.stringify(serializableStore, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données membres:", error);
  }
}

/**
 * Initialise le store avec les données existantes
 * Note: Cette fonction est synchrone pour le chargement initial
 * Les données seront rechargées depuis Blobs lors des appels API
 */
export function initializeMemberData() {
  // En développement local, charger depuis le fichier
  if (!isNetlify()) {
    const savedData = loadMemberDataFromFile();
    
    // Si des données sauvegardées existent, les utiliser
    if (Object.keys(savedData).length > 0) {
      memberDataStore = savedData;
      return;
    }
  }
  // Sur Netlify, on ne charge pas ici (sera chargé à la demande dans les API)

  // Sinon, construire le store à partir des données existantes (première initialisation)
  allMembers.forEach((member) => {
    const roleInfo = getMemberRole(member.twitchLogin);
    const login = member.twitchLogin.toLowerCase();
    
    // Ne pas écraser si le membre existe déjà dans les données sauvegardées
    if (!memberDataStore[login]) {
      // Déterminer les badges selon les rôles
      const badges = getBadgesForMember(member.twitchLogin);
      
      memberDataStore[login] = {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        siteUsername: member.displayName, // Par défaut, utiliser le displayName
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
      // Mettre à jour les badges si le membre existe déjà (synchroniser avec les rôles)
      const badges = getBadgesForMember(member.twitchLogin);
      if (badges.length > 0) {
        memberDataStore[login].badges = badges;
        // Mettre à jour aussi le rôle et VIP si nécessaire
        memberDataStore[login].role = roleInfo.role;
        memberDataStore[login].isVip = roleInfo.isVip;
        memberDataStore[login].updatedAt = new Date();
      }
    }
  });

  // Sauvegarder après l'initialisation (seulement si on a créé de nouveaux membres)
  // En développement local uniquement
  if (!isNetlify() && Object.keys(memberDataStore).length > 0) {
    saveMemberDataToFile();
  }
}

/**
 * Charge les données depuis le stockage persistant (Blobs ou fichier)
 * À appeler dans les API routes pour s'assurer d'avoir les dernières données
 * Fusionne les données au lieu de les remplacer pour préserver les modifications en mémoire
 */
export async function loadMemberDataFromStorage(): Promise<void> {
  let savedData: Record<string, MemberData> = {};
  
  if (isNetlify()) {
    savedData = await loadMemberDataFromBlob();
  } else {
    savedData = loadMemberDataFromFile();
  }
  
  // Fusionner les données sauvegardées avec le store en mémoire
  // Les données en mémoire (plus récentes) ont priorité
  if (Object.keys(savedData).length > 0) {
    // Pour chaque membre sauvegardé, l'ajouter seulement s'il n'existe pas déjà
    // ou si la version sauvegardée est plus récente
    for (const [key, savedMember] of Object.entries(savedData)) {
      const existingMember = memberDataStore[key];
      
      if (!existingMember) {
        // Membre n'existe pas en mémoire, l'ajouter
        memberDataStore[key] = savedMember;
      } else {
        // Membre existe, comparer les dates de mise à jour
        const savedUpdatedAt = savedMember.updatedAt ? new Date(savedMember.updatedAt).getTime() : 0;
        const existingUpdatedAt = existingMember.updatedAt ? new Date(existingMember.updatedAt).getTime() : 0;
        
        // Si la version sauvegardée est plus récente, l'utiliser
        if (savedUpdatedAt > existingUpdatedAt) {
          memberDataStore[key] = savedMember;
        }
        // Sinon, garder la version en mémoire (plus récente)
      }
    }
  }
}

// Variable pour éviter les initialisations multiples
let isInitialized = false;

// Initialiser au chargement (une seule fois)
if (typeof window === "undefined" && !isInitialized) {
  // Côté serveur uniquement
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
 * Inclut aussi les membres sans listId pour la rétrocompatibilité
 */
export function getAllActiveMemberDataFromAllLists(): MemberData[] {
  return Object.values(memberDataStore).filter(
    (member) => {
      if (!member.isActive) return false;
      // Inclure les membres avec listId 1, 2, ou 3
      if (member.listId === 1 || member.listId === 2 || member.listId === 3) return true;
      // Inclure aussi les membres sans listId (rétrocompatibilité)
      if (!member.listId) return true;
      // Exclure les membres avec un listId invalide
      return false;
    }
  );
}

/**
 * Met à jour les données d'un membre (fondateurs uniquement)
 */
export async function updateMemberData(
  twitchLogin: string,
  updates: Partial<MemberData>,
  updatedBy: string
): Promise<MemberData | null> {
  const login = twitchLogin.toLowerCase();
  const existing = memberDataStore[login];
  
  if (!existing) {
    return null;
  }
  
  memberDataStore[login] = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
    updatedBy,
  };
  
  // Sauvegarder après modification
  if (typeof window === "undefined") {
    if (isNetlify()) {
      await saveMemberDataToBlob();
    } else {
      saveMemberDataToFile();
    }
  }
  
  return memberDataStore[login];
}

/**
 * Crée un nouveau membre (fondateurs uniquement)
 */
export async function createMemberData(
  memberData: Omit<MemberData, "createdAt" | "updatedAt" | "updatedBy">,
  createdBy: string
): Promise<MemberData> {
  const login = memberData.twitchLogin.toLowerCase();
  
  memberDataStore[login] = {
    ...memberData,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: createdBy,
  };
  
  // Sauvegarder après création
  if (typeof window === "undefined") {
    if (isNetlify()) {
      await saveMemberDataToBlob();
    } else {
      saveMemberDataToFile();
    }
  }
  
  return memberDataStore[login];
}

/**
 * Supprime un membre (fondateurs uniquement)
 */
export async function deleteMemberData(twitchLogin: string): Promise<boolean> {
  const login = twitchLogin.toLowerCase();
  if (memberDataStore[login]) {
    delete memberDataStore[login];
    
    // Sauvegarder après suppression
    if (typeof window === "undefined") {
      if (isNetlify()) {
        await saveMemberDataToBlob();
      } else {
        saveMemberDataToFile();
      }
    }
    
    return true;
  }
  return false;
}

/**
 * Met à jour le statut Twitch d'un membre
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
 * Récupère tous les membres avec leurs données complètes
 */
export function getAllMemberData(): MemberData[] {
  return Object.values(memberDataStore);
}

