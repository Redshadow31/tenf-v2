// Rôles et statuts des membres TENF
// TODO: À remplacer par une vraie base de données ou API

import { allMembers } from "./members";

export type MemberRole =
  | "Nouveau"
  | "Affilié"
  | "Développement"
  | "Admin"
  | "Admin Coordinateur"
  | "Modérateur"
  | "Modérateur en formation"
  | "Modérateur en activité réduite"
  | "Modérateur en pause"
  | "Soutien TENF"
  | "Contributeur TENF du Mois"
  | "Créateur Junior"
  | "Les P'tits Jeunes"
  | "Communauté"
  // Compatibilité legacy
  | "Admin Adjoint"
  | "Mentor"
  | "Modérateur Junior";
export type MemberStatus = "active" | "inactive" | "vip";

export type LegacyMemberRole = "Admin Adjoint" | "Mentor" | "Modérateur Junior";

const LEGACY_ROLE_TO_CANONICAL: Record<LegacyMemberRole, MemberRole> = {
  "Admin Adjoint": "Admin Coordinateur",
  Mentor: "Modérateur",
  "Modérateur Junior": "Modérateur en formation",
};

const LEGACY_BADGE_TO_CANONICAL: Record<LegacyMemberRole, string> = {
  "Admin Adjoint": "Admin Coordinateur",
  Mentor: "Modérateur",
  "Modérateur Junior": "Modérateur en formation",
};

export function isLegacyMemberRole(role: string): role is LegacyMemberRole {
  return role === "Admin Adjoint" || role === "Mentor" || role === "Modérateur Junior";
}

const CANONICAL_MEMBER_ROLES: MemberRole[] = [
  "Nouveau",
  "Affilié",
  "Développement",
  "Admin",
  "Admin Coordinateur",
  "Modérateur",
  "Modérateur en formation",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Soutien TENF",
  "Contributeur TENF du Mois",
  "Créateur Junior",
  "Les P'tits Jeunes",
  "Communauté",
];

export function toCanonicalMemberRole(role: string): MemberRole {
  if (isLegacyMemberRole(role)) {
    return LEGACY_ROLE_TO_CANONICAL[role];
  }
  if (CANONICAL_MEMBER_ROLES.includes(role as MemberRole)) {
    return role as MemberRole;
  }
  return "Affilié";
}

export function toCanonicalBadgeLabel(badge: string): string {
  if (badge === "Communauté (mineur)") {
    return "Communauté";
  }
  if (isLegacyMemberRole(badge)) {
    return LEGACY_BADGE_TO_CANONICAL[badge];
  }
  return badge;
}

export function toCanonicalBadges(badges?: string[]): string[] | undefined {
  if (!Array.isArray(badges)) {
    return badges;
  }
  return badges
    .map((badge) => toCanonicalBadgeLabel(badge))
    .filter((badge, index, self) => self.indexOf(badge) === index);
}

export interface MemberWithRole {
  role: MemberRole;
  isVip: boolean;
  isActive: boolean;
  twitchLogin: string; // Obligatoire
}

// Mapping des membres avec leurs rôles et badges
// Liste complète des membres avec leurs rôles et statut VIP

// Liste des membres VIP Élite (badge) - utilisant les logins Twitch réels depuis lib/members.ts
const VIP_ELITE_MEMBERS = [
  "lyxo6z", "aaabaddoncroc2pomme", "afirics", "alicornedejais", "alx_r1v3r", "bainetaine",
  "barneigaming", "batje76", "benzzootv", "chtifou95", "emilysims76",
  "enthistv", "frostyquinn94_js", "gaara_san_84", "h2_narvalo", "hellgate80",
  "isa_chieuze_7ds", "jooblack__", "kalyshin", "kolomiso_twitch", "lagameuseninie",
  "mageekobus", "mat_le_suisse_gaming", "mechant_karma", "mmesigurdson64",
  "noxmower", "oxiwanted13", "patrick_patoix", "pierrotofficiel", "predix07",
  "roisephiboo", "sethtv1", "sigurdson64", "simon_le7", "skadi_style",
  "snoopyange87", "tania2507", "theboss974hd", "thony1384", "voodkas_",
  "wirox104", "zekpower42", "zelephs", "zer0sang", "zeronova59",
  "red_shadow_31", "clarastonewall", "nexou31", "selena_akemi", "tabs_up",
  "loulangegaming", "jenny31200", "rebelle_7ds", "livio_on", "rubbycrea",
  "thedark_sand", "yaya_romali", "face_bcd", "leb1nx", "lespydyverse",
  "nico_73_79", "zylkao"
].map(login => login.toLowerCase());

// FONDATEURS (Admin)
const FONDATEURS = ["red_shadow_31", "clarastonewall", "nexou31"].map(login => login.toLowerCase());

// ADMINS ADJOINTS
const ADMINS_ADJOINTS = ["selena_akemi", "tabs_up", "loulangegaming", "jenny31200"].map(login => login.toLowerCase());

// MODOS MENTORS
const MODOS_MENTORS = ["rebelle_7ds", "livio_on", "rubbycrea", "thedark_sand", "yaya_romali"].map(login => login.toLowerCase());

// MODOS JUNIORS
const MODOS_JUNIORS = ["face_bcd", "leb1nx", "lespydyverse", "nico_73_79", "sigurdson64", "simon_le7", "zylkao"].map(login => login.toLowerCase());

// Fonction pour déterminer le rôle d'un membre
function getRoleForMember(login: string): MemberRole {
  const lowerLogin = login.toLowerCase();
  
  if (FONDATEURS.includes(lowerLogin)) {
    return "Admin";
  }
  if (ADMINS_ADJOINTS.includes(lowerLogin)) {
    return "Admin Coordinateur";
  }
  if (MODOS_MENTORS.includes(lowerLogin)) {
    return "Modérateur";
  }
  if (MODOS_JUNIORS.includes(lowerLogin)) {
    return "Modérateur en formation";
  }
  
  return "Affilié";
}

// Fonction pour obtenir les badges d'un membre (exportée pour utilisation dans memberData)
export function getBadgesForMember(login: string): string[] {
  const lowerLogin = login.toLowerCase();
  const badges: string[] = [];
  const role = getRoleForMember(login);
  
  // VIP Élite est toujours un badge s'il est dans la liste
  if (VIP_ELITE_MEMBERS.includes(lowerLogin)) {
    badges.push("VIP Élite");
  }
  
  // Modérateur en formation est toujours un badge pour les membres dans cette liste
  if (MODOS_JUNIORS.includes(lowerLogin)) {
    badges.push("Modérateur en formation");
  }
  
  // Modérateur est toujours un badge pour les membres dans cette liste
  if (MODOS_MENTORS.includes(lowerLogin)) {
    badges.push("Modérateur");
  }
  
  // Admin Coordinateur est toujours un badge pour les membres dans cette liste
  if (ADMINS_ADJOINTS.includes(lowerLogin)) {
    badges.push("Admin Coordinateur");
  }
  
  // Admin Fondateurs est toujours un badge pour les membres dans cette liste
  if (FONDATEURS.includes(lowerLogin)) {
    badges.push("Admin Fondateurs");
  }
  
  return badges;
}

// Générer le mapping pour tous les membres
export const memberRoles: Record<string, MemberWithRole> = {};

// Initialiser les rôles pour tous les membres de allMembers
allMembers.forEach((member) => {
  const login = member.twitchLogin.toLowerCase();
  const role = getRoleForMember(login);
  const isVip = VIP_ELITE_MEMBERS.includes(login);
  
  memberRoles[login] = {
    role,
    isVip,
    isActive: true,
    twitchLogin: member.twitchLogin,
  };
});

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

