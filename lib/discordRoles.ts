// IDs des rôles Discord TENF
// Ces IDs sont utilisés pour identifier les rôles sur le serveur Discord

export const DISCORD_ROLE_IDS = {
  // Rôles principaux
  AFFILIE: "1278838848608010283", // 💠 Créateurs Affiliés
  DEVELOPPEMENT: "1278839281330163744", // 📈 Créateurs en Développement
  
  // Badges spéciaux (doubles rôles)
  VIP_ELITE: "1296104419146072075", // ✨VIP Élite✨
  MODERATEUR_JUNIOR: "1278837227706650775", // 🔧 Modérateurs Junior
  MODERATEUR_MENTOR: "1278836819231772672", // 🛡️ Modérateurs Mentors
} as const;

export const GUILD_ID = "535244857891880970"; // Serveur Discord TENF

/**
 * Mappe les IDs de rôles Discord vers les rôles du site
 */
export function mapDiscordRoleToSiteRole(discordRoleIds: string[]): {
  role: "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin";
  badges: string[];
} {
  let role: "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin" = "Affilié";
  const badges: string[] = [];

  // Vérifier les badges spéciaux (doubles rôles)
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.VIP_ELITE)) {
    badges.push("VIP Élite");
  }
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR)) {
    badges.push("Modérateur Junior");
  }
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR)) {
    badges.push("Modérateur Mentor");
  }

  // Déterminer le rôle principal
  if (discordRoleIds.includes(DISCORD_ROLE_IDS.DEVELOPPEMENT)) {
    role = "Développement";
  } else if (discordRoleIds.includes(DISCORD_ROLE_IDS.AFFILIE)) {
    role = "Affilié";
  } else if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_MENTOR)) {
    role = "Mentor";
  } else if (discordRoleIds.includes(DISCORD_ROLE_IDS.MODERATEUR_JUNIOR)) {
    role = "Staff";
  }

  return { role, badges };
}

/**
 * Vérifie si un membre a un badge spécifique
 */
export function hasBadge(discordRoleIds: string[], badgeRoleId: string): boolean {
  return discordRoleIds.includes(badgeRoleId);
}

