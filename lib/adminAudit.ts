// Système de logging et audit pour toutes les actions admin
// Stockage dans Netlify Blobs

import { getStore } from "@netlify/blobs";
import { AdminRole } from "./adminRoles";

export interface AuditLog {
  id: string; // UUID unique
  actorDiscordId: string;
  actorUsername?: string;
  role: AdminRole;
  timestamp: string; // ISO timestamp
  action: string; // Type d'action (ex: "member.update", "raid.add", etc.)
  resourceType: string; // Type de ressource (ex: "member", "raid", etc.)
  resourceId?: string; // ID de la ressource modifiée
  previousValue?: any; // Valeur avant modification
  newValue?: any; // Valeur après modification
  reverted: boolean; // Si cette action a été annulée
  revertedBy?: string; // Discord ID de celui qui a annulé
  revertedAt?: string; // Timestamp de l'annulation
  revertLogId?: string; // ID du log de revert
  metadata?: Record<string, any>; // Données supplémentaires
}

const AUDIT_STORE_NAME = "tenf-audit";

/**
 * Crée un nouveau log d'audit
 */
export async function logAdminAction(
  actorDiscordId: string,
  role: AdminRole,
  action: string,
  resourceType: string,
  options: {
    actorUsername?: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  } = {}
): Promise<AuditLog> {
  const store = getStore(AUDIT_STORE_NAME);

  const logId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const log: AuditLog = {
    id: logId,
    actorDiscordId,
    actorUsername: options.actorUsername,
    role,
    timestamp: new Date().toISOString(),
    action,
    resourceType,
    resourceId: options.resourceId,
    previousValue: options.previousValue,
    newValue: options.newValue,
    reverted: false,
    metadata: options.metadata,
  };

  // Stocker dans un fichier mensuel pour faciliter la recherche
  const monthKey = getMonthKey(new Date());
  const key = `audit-${monthKey}`;

  try {
    // Charger les logs existants
    const existingLogs = await store.get(key, { type: "json" }) as AuditLog[] || [];
    
    // Ajouter le nouveau log
    existingLogs.push(log);
    
    // Sauvegarder (garder les 1000 derniers logs par mois)
    const logsToSave = existingLogs.slice(-1000);
    await store.setJSON(key, logsToSave);
    
    console.log(`[Audit] Action logged: ${action} by ${actorDiscordId} (${role})`);
    
    return log;
  } catch (error) {
    console.error("[Audit] Erreur lors de l'enregistrement du log:", error);
    throw error;
  }
}

/**
 * Récupère les logs d'audit pour un mois donné
 */
export async function getAuditLogs(
  monthKey?: string,
  filters?: {
    actorDiscordId?: string;
    action?: string;
    resourceType?: string;
    reverted?: boolean;
  }
): Promise<AuditLog[]> {
  const store = getStore(AUDIT_STORE_NAME);

  const key = monthKey || getMonthKey(new Date());
  const fullKey = `audit-${key}`;

  try {
    const logs = (await store.get(fullKey, { type: "json" }) as AuditLog[]) || [];

    // Appliquer les filtres
    let filteredLogs = logs;
    
    if (filters?.actorDiscordId) {
      filteredLogs = filteredLogs.filter(log => log.actorDiscordId === filters.actorDiscordId);
    }
    
    if (filters?.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }
    
    if (filters?.resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === filters.resourceType);
    }
    
    if (filters?.reverted !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.reverted === filters.reverted);
    }

    // Trier par timestamp décroissant (plus récent en premier)
    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("[Audit] Erreur lors de la récupération des logs:", error);
    return [];
  }
}

/**
 * Récupère tous les logs d'audit (tous les mois)
 */
export async function getAllAuditLogs(
  filters?: {
    actorDiscordId?: string;
    action?: string;
    resourceType?: string;
    reverted?: boolean;
    limit?: number;
  }
): Promise<AuditLog[]> {
  const store = getStore(AUDIT_STORE_NAME);

  try {
    // Récupérer les clés des 12 derniers mois
    const now = new Date();
    const allLogs: AuditLog[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = getMonthKey(date);
      const key = `audit-${monthKey}`;
      
      try {
        const logs = (await store.get(key, { type: "json" }) as AuditLog[]) || [];
        allLogs.push(...logs);
      } catch (error) {
        // Ignorer les erreurs pour les mois sans logs
        console.warn(`[Audit] Aucun log trouvé pour ${monthKey}`);
      }
    }

    // Appliquer les filtres
    let filteredLogs = allLogs;
    
    if (filters?.actorDiscordId) {
      filteredLogs = filteredLogs.filter(log => log.actorDiscordId === filters.actorDiscordId);
    }
    
    if (filters?.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }
    
    if (filters?.resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === filters.resourceType);
    }
    
    if (filters?.reverted !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.reverted === filters.reverted);
    }

    // Trier par timestamp décroissant
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limiter si demandé
    if (filters?.limit) {
      return filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  } catch (error) {
    console.error("[Audit] Erreur lors de la récupération de tous les logs:", error);
    return [];
  }
}

/**
 * Annule une action (revert) - crée un nouveau log
 */
export async function revertAction(
  logId: string,
  reverterDiscordId: string,
  reverterRole: AdminRole,
  reverterUsername?: string
): Promise<AuditLog> {
  const store = getStore(AUDIT_STORE_NAME);

  // Trouver le log original
  const allLogs = await getAllAuditLogs();
  const originalLog = allLogs.find(log => log.id === logId);

  if (!originalLog) {
    throw new Error(`Log ${logId} non trouvé`);
  }

  if (originalLog.reverted) {
    throw new Error(`L'action ${logId} a déjà été annulée`);
  }

  // Marquer le log original comme annulé
  const monthKey = getMonthKey(new Date(originalLog.timestamp));
  const key = `audit-${monthKey}`;
  const logs = (await store.get(key, { type: "json" }) as AuditLog[]) || [];
  
  const logIndex = logs.findIndex(log => log.id === logId);
  if (logIndex !== -1) {
    logs[logIndex].reverted = true;
    logs[logIndex].revertedBy = reverterDiscordId;
    logs[logIndex].revertedAt = new Date().toISOString();
    await store.setJSON(key, logs);
  }

  // Créer un nouveau log pour le revert
  const revertLogId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const revertLog: AuditLog = {
    id: revertLogId,
    actorDiscordId: reverterDiscordId,
    actorUsername: reverterUsername,
    role: reverterRole,
    timestamp: new Date().toISOString(),
    action: `${originalLog.action}.revert`,
    resourceType: originalLog.resourceType,
    resourceId: originalLog.resourceId,
    previousValue: originalLog.newValue, // La valeur actuelle devient l'ancienne
    newValue: originalLog.previousValue, // On restaure l'ancienne valeur
    reverted: false,
    metadata: {
      revertedLogId: logId,
      originalAction: originalLog.action,
      originalActor: originalLog.actorDiscordId,
    },
  };

  // Sauvegarder le log de revert
  const currentMonthKey = getMonthKey(new Date());
  const revertKey = `audit-${currentMonthKey}`;
  const revertLogs = (await store.get(revertKey, { type: "json" }) as AuditLog[]) || [];
  revertLogs.push(revertLog);
  await store.setJSON(revertKey, revertLogs.slice(-1000));

  // Mettre à jour le log original avec l'ID du revert
  if (logIndex !== -1) {
    logs[logIndex].revertLogId = revertLogId;
    await store.setJSON(key, logs);
  }

  console.log(`[Audit] Action ${logId} revertée par ${reverterDiscordId} (${reverterRole})`);
  
  return revertLog;
}

/**
 * Utilité pour générer une clé de mois
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

