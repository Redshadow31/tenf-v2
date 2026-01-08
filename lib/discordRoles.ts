// IDs des rôles Discord TENF
// Ces IDs sont utilisés pour identifier les rôles sur le serveur Discord

export const DISCORD_ROLE_IDS = {
  // Rôles Admin (hiérarchie la plus haute)
  ADMIN_FONDATEURS: "1278836152870240267", // 🏛️Admin Fondateurs
  ADMIN_ADJOINT: "1316198303645564978", // 🏛️Admin Adjoint
  
  // Rôles Staff/Modérateurs
  MODERATEUR_MENTOR: "1278836819231772672", // 🛡️ Modérateurs Mentors
  MODERATEUR_JUNIOR: "1278837227706650775", // 🔧 Modérateurs Junior
  
  // Badge VIP
  VIP_ELITE: "1296104419146072075", // ✨VIP Élite✨
  
  // Rôles Créateurs (hiérarchie la plus basse)
  CREATEUR_JUNIOR: "1279061402606370920", // 🎓 Créateurs Juniors
  CREATEUR_AFFILIE: "1278838848608010283", // 💠 Créateurs Affiliés
  CREATEUR_DEVELOPPEMENT: "1278839281330163744", // 📈 Créateurs en Développement
} as const;

export const GUILD_ID = "535244857891880970"; // Serveur Discord TENF

// Hiérarchie des rôles (du plus haut au plus bas)
// Utilisé pour déterminer le rôle principal en cas de double rôle
const ROLE_HIERARCHY = [
  DISCORD_ROLE_IDS.ADMIN_FONDATEURS,
  DISCORD_ROLE_IDS.ADMIN_ADJOINT,
  DISCORD_ROLE_IDS.MODERATEUR_MENTOR,
  DISCORD_ROLE_IDS.MODERATEUR_JUNIOR,
  DISCORD_ROLE_IDS.VIP_ELITE,
  DISCORD_ROLE_IDS.CREATEUR_JUNIOR,
  DISCORD_ROLE_IDS.CREATEUR_AFFILIE,
  DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT,
] as const;

/**
 * Trouve le rôle le plus haut dans la hiérarchie parmi les rôles du membre
 */
function getHighestRole(discordRoleIds: string[]): string | null {
  for (const roleId of ROLE_HIERARCHY) {
    if (discordRoleIds.includes(roleId)) {
      return roleId;
    }
  }
  return null;
}

/**
 * Mappe les IDs de rôles Discord vers les rôles du site
 * Pour les doubles rôles ou plus, on prend le rôle le plus haut dans la hiérarchie
 */
export function mapDiscordRoleToSiteRole(discordRoleIds: string[]): {
  role: "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior";
  badges: string[];
} {
  const highestRoleId = getHighestRole(discordRoleIds);
  const badges: string[] = [];

  // Déterminer le rôle principal selon la hiérarchie (rôle le plus haut)
  if (!highestRoleId) {
    return { role: "Affilié", badges };
  }

  let mainRole: "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" = "Affilié";

  switch (highestRoleId) {
    case DISCORD_ROLE_IDS.ADMIN_FONDATEURS:
      mainRole = "Admin";
      break;
    case DISCORD_ROLE_IDS.ADMIN_ADJOINT:
      mainRole = "Admin Adjoint";
      break;
    case DISCORD_ROLE_IDS.MODERATEUR_MENTOR:
      mainRole = "Mentor";
      break;
    case DISCORD_ROLE_IDS.MODERATEUR_JUNIOR:
      mainRole = "Modérateur Junior";
      break;
    case DISCORD_ROLE_IDS.VIP_ELITE:
      // VIP Élite peut être un badge, mais si c'est le rôle le plus haut, on le traite comme badge seulement
      mainRole = "Affilié";
      break;
    case DISCORD_ROLE_IDS.CREATEUR_JUNIOR:
      mainRole = "Créateur Junior";
      break;
    case DISCORD_ROLE_IDS.CREATEUR_AFFILIE:
      mainRole = "Affilié";
      break;
    case DISCORD_ROLE_IDS.CREATEUR_DEVELOPPEMENT:
      mainRole = "Développement";
      break;
    default:
      mainRole = "Affilié";
  }

  // Ajouter les badges (rôles secondaires qui ne sont pas le rôle principal)
  // VIP Élite est toujours un badge s'il est présent
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.VIP_ELITE)) {
    badges.push("VIP Élite");
  }
  // Modérateur Junior est un badge s'il n'est pas le rôle principal
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR) && highestRoleId !== DISCORD_ROLE_IDS.MODERATEUR_JUNIOR) {
    badges.push("Modérateur Junior");
  }
  // Modérateur Mentor est un badge s'il n'est pas le rôle principal
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR) && highestRoleId !== DISCORD_ROLE_IDS.MODERATEUR_MENTOR) {
    badges.push("Modérateur Mentor");
  }
  // Admin Adjoint est un badge s'il n'est pas le rôle principal
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.ADMIN_ADJOINT) && highestRoleId !== DISCORD_ROLE_IDS.ADMIN_ADJOINT) {
    badges.push("Admin Adjoint");
  }
  // Admin Fondateurs est un badge s'il n'est pas le rôle principal
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.ADMIN_FONDATEURS) && highestRoleId !== DISCORD_ROLE_IDS.ADMIN_FONDATEURS) {
    badges.push("Admin Fondateurs");
  }

  return { role: mainRole, badges };
}

/**
 * Vérifie si un membre a un badge spécifique
 */
export function hasBadge(discordRoleIds: string[], badgeRoleId: string): boolean {
  return discordRoleIds.includes(badgeRoleId);
}

