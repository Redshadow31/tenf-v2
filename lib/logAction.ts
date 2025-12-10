// Système de logging des actions administratives
// TODO: Remplacer par une vraie base de données (ex: Prisma, MongoDB, etc.)

interface LogEntry {
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

// Stockage en mémoire pour l'instant (à remplacer par une vraie DB)
const logs: LogEntry[] = [];

/**
 * Enregistre une action administrative dans les logs
 * @param adminId - ID Discord de l'admin
 * @param adminUsername - Nom d'utilisateur Discord de l'admin
 * @param action - Description de l'action (ex: "Désactivation d'un membre")
 * @param target - Cible de l'action (ex: nom du membre)
 * @param details - Détails supplémentaires (ex: { oldStatus: "Actif", newStatus: "Inactif" })
 * @param ipAddress - Adresse IP de l'admin (optionnel)
 */
export async function logAction(
  adminId: string,
  adminUsername: string,
  action: string,
  target: string,
  details: Record<string, any> = {},
  ipAddress?: string
): Promise<void> {
  const logEntry: LogEntry = {
    adminId,
    adminUsername,
    action,
    target,
    details,
    timestamp: new Date(),
    ipAddress,
  };

  logs.push(logEntry);

  // TODO: En production, sauvegarder dans une vraie base de données
  // Exemple avec Prisma:
  // await prisma.log.create({ data: logEntry });

  console.log(`[ADMIN LOG] ${adminUsername} (${adminId}) - ${action} - ${target}`, details);
}

/**
 * Récupère tous les logs (fondateurs uniquement)
 */
export async function getLogs(limit: number = 100): Promise<LogEntry[]> {
  // TODO: Remplacer par une vraie requête DB avec pagination
  return logs.slice(-limit).reverse(); // Les plus récents en premier
}

/**
 * Récupère les logs d'un admin spécifique
 */
export async function getLogsByAdmin(adminId: string, limit: number = 50): Promise<LogEntry[]> {
  // TODO: Remplacer par une vraie requête DB
  return logs
    .filter((log) => log.adminId === adminId)
    .slice(-limit)
    .reverse();
}

/**
 * Récupère les logs pour une action spécifique
 */
export async function getLogsByAction(action: string, limit: number = 50): Promise<LogEntry[]> {
  // TODO: Remplacer par une vraie requête DB
  return logs
    .filter((log) => log.action.includes(action))
    .slice(-limit)
    .reverse();
}

