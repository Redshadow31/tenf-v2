/**
 * Helper centralisé pour logger toutes les actions admin
 * Utilise le système audit existant (lib/adminAudit.ts)
 */

import { logAdminAction } from "@/lib/adminAudit";
import { getCurrentAdmin } from "@/lib/admin";
import { getAdminRole, type AdminRole } from "@/lib/adminRoles";

export interface LogActionParams {
  /** Type d'action (ex: "member.create", "spotlight.update") */
  action: string;
  /** Type de ressource (ex: "member", "spotlight", "event") */
  resourceType: string;
  /** ID de la ressource modifiée (optionnel) */
  resourceId?: string;
  /** Valeur avant modification (optionnel, pour audit) */
  previousValue?: any;
  /** Valeur après modification (optionnel, pour audit) */
  newValue?: any;
  /** Métadonnées supplémentaires (ex: fieldsChanged, reason, sourcePage) */
  metadata?: Record<string, any>;
}

/**
 * Logger une action admin de manière centralisée et sécurisée
 * 
 * @param params Paramètres de l'action à logger
 * @returns Promise<AuditLog | null> Le log créé, ou null si l'action n'a pas pu être loggée
 * 
 * @example
 * await logAction({
 *   action: "member.update",
 *   resourceType: "member",
 *   resourceId: member.twitchLogin,
 *   previousValue: oldMember,
 *   newValue: updatedMember,
 *   metadata: { fieldsChanged: ["role", "status"], sourcePage: "/admin/membres/gestion" }
 * });
 */
export async function logAction(params: LogActionParams): Promise<any | null> {
  try {
    // Récupérer l'admin actuel (peut être null si appelé hors contexte admin)
    let admin: { id: string; username?: string } | null = null;
    try {
      admin = await getCurrentAdmin();
    } catch (error) {
      console.warn("[Logger] Impossible de récupérer l'admin actuel:", error);
    }

    // Fallback safe : si admin n'est pas disponible, utiliser "unknown"
    const actorDiscordId = admin?.id || "unknown";
    const actorUsername = admin?.username || undefined;

    // Récupérer le rôle admin (avec fallback)
    let role: AdminRole = "MODO_JUNIOR"; // Rôle par défaut (le moins privilégié)
    try {
      if (admin?.id) {
        const adminRole = getAdminRole(admin.id);
        if (adminRole) {
          role = adminRole;
        }
      }
    } catch (error) {
      console.warn("[Logger] Impossible de récupérer le rôle admin:", error);
    }

    // Logger l'action via le système audit existant
    const auditLog = await logAdminAction(
      actorDiscordId,
      role,
      params.action,
      params.resourceType,
      {
        actorUsername,
        resourceId: params.resourceId,
        previousValue: params.previousValue,
        newValue: params.newValue,
        metadata: {
          ...params.metadata,
          timestamp: new Date().toISOString(),
        },
      }
    );

    return auditLog;
  } catch (error) {
    // Ne jamais bloquer l'opération si le logging échoue
    console.error("[Logger] Erreur lors du logging de l'action:", error);
    console.error("[Logger] Action non loggée:", params);
    return null;
  }
}

/**
 * Helper pour logger une création de ressource
 */
export async function logCreate(
  resourceType: string,
  resourceId: string,
  newValue: any,
  metadata?: Record<string, any>
) {
  return logAction({
    action: `${resourceType}.create`,
    resourceType,
    resourceId,
    newValue,
    metadata,
  });
}

/**
 * Helper pour logger une mise à jour de ressource
 */
export async function logUpdate(
  resourceType: string,
  resourceId: string,
  previousValue: any,
  newValue: any,
  metadata?: Record<string, any>
) {
  return logAction({
    action: `${resourceType}.update`,
    resourceType,
    resourceId,
    previousValue,
    newValue,
    metadata,
  });
}

/**
 * Helper pour logger une suppression de ressource
 */
export async function logDelete(
  resourceType: string,
  resourceId: string,
  previousValue: any,
  metadata?: Record<string, any>
) {
  return logAction({
    action: `${resourceType}.delete`,
    resourceType,
    resourceId,
    previousValue,
    metadata,
  });
}

/**
 * Optimise une valeur pour l'audit (limite la taille pour éviter les payloads énormes)
 * @param value La valeur à optimiser
 * @param maxSize Taille maximale en octets (par défaut 50KB)
 * @returns La valeur optimisée
 */
export function optimizeAuditValue(value: any, maxSize: number = 50000): any {
  if (!value || typeof value !== "object") {
    return value;
  }

  // Convertir en JSON pour calculer la taille
  const jsonString = JSON.stringify(value);
  const sizeInBytes = Buffer.byteLength(jsonString, "utf8");

  // Si la taille est acceptable, retourner tel quel
  if (sizeInBytes <= maxSize) {
    return value;
  }

  // Sinon, créer un résumé avec seulement les champs importants
  if (Array.isArray(value)) {
    // Pour les tableaux, garder seulement les premiers éléments + info de taille
    const summary = value.slice(0, 10).map((item, idx) => ({
      ...optimizeAuditValue(item, maxSize / 10),
      _index: idx,
    }));
    return {
      _type: "array",
      _totalLength: value.length,
      _truncated: true,
      _sample: summary,
    };
  }

  // Pour les objets, garder seulement les champs de premier niveau importants
  const importantFields: Record<string, any> = {};
  const keysToKeep = [
    "id",
    "name",
    "title",
    "displayName",
    "twitchLogin",
    "discordId",
    "role",
    "status",
    "isActive",
    "isVip",
    "date",
    "timestamp",
    "type",
    "category",
  ];

  for (const key of keysToKeep) {
    if (key in value && value[key] !== undefined) {
      importantFields[key] = value[key];
    }
  }

  return {
    _type: "object",
    _truncated: true,
    _originalSize: sizeInBytes,
    _totalKeys: Object.keys(value).length,
    ...importantFields,
  };
}

/**
 * Helper pour capturer l'état avant/après de manière optimisée
 * @param before État avant
 * @param after État après
 * @returns Objet avec before/after optimisés
 */
export function prepareAuditValues(before?: any, after?: any): {
  previousValue?: any;
  newValue?: any;
} {
  return {
    previousValue: before ? optimizeAuditValue(before) : undefined,
    newValue: after ? optimizeAuditValue(after) : undefined,
  };
}
