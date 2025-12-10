// Système centralisé de gestion des données des membres TENF
// Toutes les informations des membres sont stockées ici et synchronisées partout

import { allMembers } from "./members";
import { memberRoles, getMemberRole, type MemberRole } from "./memberRoles";
import fs from "fs";
import path from "path";

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

// Stockage en mémoire avec persistance dans un fichier JSON
let memberDataStore: Record<string, MemberData> = {};

// Chemin du fichier de persistance
const DATA_DIR = path.join(process.cwd(), "data");
const MEMBERS_DATA_FILE = path.join(DATA_DIR, "members.json");

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
 */
export function initializeMemberData() {
  // Charger les données sauvegardées depuis le fichier
  const savedData = loadMemberDataFromFile();
  
  // Si des données sauvegardées existent, les utiliser
  if (Object.keys(savedData).length > 0) {
    memberDataStore = savedData;
    return;
  }

  // Sinon, construire le store à partir des données existantes (première initialisation)
  allMembers.forEach((member) => {
    const roleInfo = getMemberRole(member.twitchLogin);
    const login = member.twitchLogin.toLowerCase();
    
    // Ne pas écraser si le membre existe déjà dans les données sauvegardées
    if (!memberDataStore[login]) {
      memberDataStore[login] = {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        siteUsername: member.displayName, // Par défaut, utiliser le displayName
        twitchUrl: member.twitchUrl,
        discordUsername: member.discordUsername,
        role: roleInfo.role,
        isVip: roleInfo.isVip,
        isActive: roleInfo.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  });

  // Sauvegarder après l'initialisation (seulement si on a créé de nouveaux membres)
  if (Object.keys(savedData).length === 0 && Object.keys(memberDataStore).length > 0) {
    saveMemberDataToFile();
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
 * Met à jour les données d'un membre (fondateurs uniquement)
 */
export function updateMemberData(
  twitchLogin: string,
  updates: Partial<MemberData>,
  updatedBy: string
): MemberData | null {
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
    saveMemberDataToFile();
  }
  
  return memberDataStore[login];
}

/**
 * Crée un nouveau membre (fondateurs uniquement)
 */
export function createMemberData(
  memberData: Omit<MemberData, "createdAt" | "updatedAt" | "updatedBy">,
  createdBy: string
): MemberData {
  const login = memberData.twitchLogin.toLowerCase();
  
  memberDataStore[login] = {
    ...memberData,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: createdBy,
  };
  
  // Sauvegarder après création
  if (typeof window === "undefined") {
    saveMemberDataToFile();
  }
  
  return memberDataStore[login];
}

/**
 * Supprime un membre (fondateurs uniquement)
 */
export function deleteMemberData(twitchLogin: string): boolean {
  const login = twitchLogin.toLowerCase();
  if (memberDataStore[login]) {
    delete memberDataStore[login];
    
    // Sauvegarder après suppression
    if (typeof window === "undefined") {
      saveMemberDataToFile();
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

