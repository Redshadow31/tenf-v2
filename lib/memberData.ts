// Système centralisé de gestion des données des membres TENF
// Toutes les informations des membres sont stockées ici et synchronisées partout

import { allMembers } from "./members";
import { memberRoles, getMemberRole, type MemberRole } from "./memberRoles";

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

// Stockage en mémoire (à remplacer par une vraie DB en production)
// TODO: Migrer vers une base de données (Prisma, MongoDB, etc.)
let memberDataStore: Record<string, MemberData> = {};

/**
 * Initialise le store avec les données existantes
 */
export function initializeMemberData() {
  // Construire le store à partir des données existantes
  allMembers.forEach((member) => {
    const roleInfo = getMemberRole(member.twitchLogin);
    
    memberDataStore[member.twitchLogin.toLowerCase()] = {
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
  });
}

// Initialiser au chargement
if (typeof window === "undefined") {
  // Côté serveur uniquement
  initializeMemberData();
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
  
  return memberDataStore[login];
}

/**
 * Supprime un membre (fondateurs uniquement)
 */
export function deleteMemberData(twitchLogin: string): boolean {
  const login = twitchLogin.toLowerCase();
  if (memberDataStore[login]) {
    delete memberDataStore[login];
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

