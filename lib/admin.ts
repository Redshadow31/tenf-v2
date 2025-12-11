// Utilitaires pour la gestion des permissions admin et Safe Mode
// Note: Les fonctions serveur utilisent cookies() de next/headers
// Les fonctions client doivent utiliser getDiscordUser() de lib/discord

export type AdminRole = "Modérateur" | "Admin" | "Fondateur";

// Liste des fondateurs (IDs Discord) - À configurer selon votre serveur
const FOUNDER_IDS: string[] = [
  "333001130705420299", // clarastonewall
  "535244297214361603", // nexou31
  "1021398088474169414", // red_shadow_31
];

// Liste des admins (IDs Discord)
const ADMIN_IDS: string[] = [
  // Ajoutez les IDs Discord des admins ici si nécessaire
  // Exemple: "987654321098765432"
];

/**
 * Vérifie si un utilisateur Discord est un fondateur
 */
export function isFounder(discordId: string): boolean {
  return FOUNDER_IDS.includes(discordId);
}

/**
 * Vérifie si un utilisateur Discord est un admin
 */
export function isAdmin(discordId: string): boolean {
  return ADMIN_IDS.includes(discordId) || isFounder(discordId);
}

/**
 * Vérifie si un utilisateur Discord est un modérateur ou plus
 */
export function isModerator(discordId: string): boolean {
  // Pour l'instant, tous les admins sont considérés comme modérateurs
  // TODO: Ajouter une vraie liste de modérateurs si nécessaire
  return isAdmin(discordId);
}

/**
 * Vérifie si un utilisateur Discord est Admin Adjoint
 * Cette fonction vérifie dans memberData (nécessite d'être appelée après chargement des données)
 */
export function isAdminAdjoint(discordId: string, memberRole?: string): boolean {
  if (memberRole) {
    return memberRole === "Admin Adjoint";
  }
  // Si pas de rôle fourni, retourner false (nécessite chargement depuis memberData)
  return false;
}

/**
 * Vérifie si un utilisateur a accès au dashboard admin (Fondateur, Admin, ou Admin Adjoint)
 * Cette fonction vérifie dans memberData si nécessaire
 */
export function hasAdminDashboardAccess(discordId: string, memberRole?: string): boolean {
  // Fondateurs et Admins ont toujours accès
  if (isFounder(discordId) || isAdmin(discordId)) {
    return true;
  }
  // Admin Adjoint a aussi accès
  if (isAdminAdjoint(discordId, memberRole)) {
    return true;
  }
  return false;
}

/**
 * Récupère le rôle d'un utilisateur Discord
 */
export function getAdminRole(discordId: string): AdminRole | null {
  if (isFounder(discordId)) return "Fondateur";
  if (isAdmin(discordId)) return "Admin";
  if (isModerator(discordId)) return "Modérateur";
  return null;
}

/**
 * Récupère l'utilisateur Discord connecté depuis les cookies (serveur uniquement)
 * Pour le client, utilisez getDiscordUser() de lib/discord puis vérifiez avec getAdminRole()
 */
export async function getCurrentAdmin() {
  // Cette fonction doit être utilisée uniquement côté serveur (API routes)
  // Pour le client, utilisez getDiscordUser() puis getAdminRole()
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const userId = cookieStore.get("discord_user_id")?.value;
    const username = cookieStore.get("discord_username")?.value;

    if (!userId) {
      return null;
    }

    const role = getAdminRole(userId);
    if (!role) {
      return null;
    }

    return {
      id: userId,
      username: username || "Unknown",
      role,
    };
  } catch (error) {
    // Si appelé côté client, retourner null
    return null;
  }
}

/**
 * Vérifie si le Safe Mode est activé
 * Le Safe Mode ne peut être activé/désactivé que par les fondateurs
 */
let safeModeEnabled = false;

export function isSafeModeEnabled(): boolean {
  // TODO: Récupérer depuis une base de données ou variable d'environnement
  return safeModeEnabled;
}

export function setSafeMode(enabled: boolean, founderId: string): boolean {
  if (!isFounder(founderId)) {
    return false; // Seuls les fondateurs peuvent activer/désactiver le Safe Mode
  }

  safeModeEnabled = enabled;
  // TODO: Sauvegarder dans une base de données
  return true;
}

/**
 * Vérifie si un utilisateur peut effectuer une action administrative
 * En Safe Mode, seuls les fondateurs peuvent modifier des données
 * Cette fonction peut être utilisée côté client et serveur
 */
export function canPerformAction(discordId: string, action: "read" | "write", safeModeEnabled: boolean = false): boolean {
  if (action === "read") {
    // En lecture, tous les modérateurs peuvent voir
    return isModerator(discordId);
  }

  // En écriture
  if (safeModeEnabled || isSafeModeEnabled()) {
    // En Safe Mode, seuls les fondateurs peuvent modifier
    return isFounder(discordId);
  }

  // En mode normal, tous les modérateurs peuvent modifier
  return isModerator(discordId);
}

