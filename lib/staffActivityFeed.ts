import type { AuditLog } from "@/lib/adminAudit";
import { getStaffActivityAuditLogs } from "@/lib/adminAudit";

export type StaffActivityFeedItem = {
  id: string;
  headline: string;
  subline: string;
  timestamp: string;
  timestampIso: string;
};

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function relativeTimeFr(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffMs = Date.now() - ts;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "À l’instant";
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 30) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Il y a ${diffMonths} mois`;
}

/**
 * Titre lisible pour le fil d’activité staff (audit métier).
 */
export function staffActivityHeadline(log: AuditLog): string {
  const rid = log.resourceId?.trim();

  switch (log.action) {
    case "member.create":
      return rid ? `Nouveau membre intégré · ${rid}` : "Nouveau membre intégré";
    case "member.update":
      return rid ? `Fiche membre mise à jour · ${rid}` : "Fiche membre mise à jour";
    case "member.delete":
      return rid ? `Membre retiré ou supprimé · ${rid}` : "Membre retiré ou supprimé";
    case "admin.access.create":
      return "Accès dashboard staff accordé";
    case "admin.access.update":
      return "Rôle ou accès staff modifié";
    case "admin.access.delete":
      return "Accès dashboard staff retiré";
    case "admin.advanced_access.add":
      return "Accès administrateur avancé ajouté";
    case "admin.advanced_access.remove":
      return "Accès administrateur avancé retiré";
    case "admin.advanced_access.renew":
      return "Accès administrateur avancé renouvelé";
    case "event.create":
      return rid ? `Événement créé · ${truncate(rid, 36)}` : "Événement créé";
    case "event.update":
      return rid ? `Événement mis à jour · ${truncate(rid, 36)}` : "Événement mis à jour";
    case "event.delete":
      return rid ? `Événement supprimé · ${truncate(rid, 36)}` : "Événement supprimé";
    case "evaluation.override_final_note":
      return rid ? `Note finale d’évaluation ajustée · ${truncate(rid, 36)}` : "Note finale d’évaluation ajustée";
    case "evaluation.bonus.update":
      return "Bonus d’évaluation mis à jour";
    case "update_member_status":
      return rid ? `Statut membre (évaluation) mis à jour · ${rid}` : "Statut membre (évaluation) mis à jour";
    default:
      if (log.resourceType === "evaluation") {
        return rid
          ? `Évaluation / synthèse · ${truncate(rid, 36)}`
          : `Évaluation · ${truncate(log.action, 42)}`;
      }
      if (log.resourceType === "event") {
        return rid ? `Événement · ${truncate(rid, 36)}` : truncate(log.action, 48);
      }
      return `${log.resourceType} · ${truncate(log.action, 44)}`;
  }
}

export function staffActivitySubline(log: AuditLog): string {
  const who = log.actorUsername?.trim() || "Un administrateur";
  return `Par ${who}`;
}

export async function buildStaffActivityFeed(limit = 20): Promise<StaffActivityFeedItem[]> {
  const logs = await getStaffActivityAuditLogs(6, Math.max(limit, 40));
  return logs.slice(0, limit).map((log) => ({
    id: log.id,
    headline: staffActivityHeadline(log),
    subline: staffActivitySubline(log),
    timestamp: relativeTimeFr(log.timestamp),
    timestampIso: log.timestamp,
  }));
}
