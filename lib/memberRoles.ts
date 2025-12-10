// Rôles et statuts des membres TENF
// TODO: À remplacer par une vraie base de données ou API

import { allMembers } from "./members";

export type MemberRole = "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin";
export type MemberStatus = "active" | "inactive" | "vip";

export interface MemberWithRole {
  role: MemberRole;
  isVip: boolean;
  isActive: boolean;
  twitchLogin?: string; // Optionnel pour le déploiement
}

// Mapping des membres avec leurs rôles (mock pour l'instant)
// TODO: Remplacer par une vraie base de données
export const memberRoles: Record<string, MemberWithRole> = {
  // Exemples - à compléter avec tous les membres
  nexou31: { role: "Affilié", isVip: false, isActive: true },
  clarastonewall: { role: "Affilié", isVip: true, isActive: true },
  red_shadow_31: { role: "Affilié", isVip: false, isActive: true },
  yaya_romali: { role: "Développement", isVip: false, isActive: true },
  misslyliee: { role: "Affilié", isVip: true, isActive: true },
  jenny31200: { role: "Mentor", isVip: false, isActive: true },
  loulangegaming: { role: "Développement", isVip: false, isActive: true },
  // Par défaut, tous les autres membres sont Affiliés et actifs
};

// Fonction pour obtenir le rôle d'un membre
export function getMemberRole(twitchLogin: string): MemberWithRole {
  const login = twitchLogin.toLowerCase();
  return memberRoles[login] || { 
    role: "Affilié", 
    isVip: false, 
    isActive: true,
    twitchLogin: login 
  };
}

// Fonction pour obtenir tous les membres actifs
export function getActiveMembers() {
  return allMembers.filter((member) => {
    const role = getMemberRole(member.twitchLogin);
    return role.isActive;
  });
}

// Fonction pour obtenir les membres VIP
export function getVipMembers() {
  return allMembers.filter((member) => {
    const role = getMemberRole(member.twitchLogin);
    return role.isVip;
  });
}

// Fonction pour obtenir les membres par rôle
export function getMembersByRole(role: MemberRole) {
  return allMembers.filter((member) => {
    const memberRole = getMemberRole(member.twitchLogin);
    return memberRole.role === role;
  });
}

