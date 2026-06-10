import type { AuditLog } from "@/lib/adminAudit";
import {
  IDENTITY_FIELD_LABELS,
  type IdentityFieldKey,
  type IdentityHistoryEntry,
  auditLogMatchesMemberIdentity,
  buildIdentityHistoryFromAuditLogs,
  buildMemberIdentityMatchContext,
  mergeIdentityHistory,
  normalizeIdentityHistory,
} from "@/lib/admin/members-gestion/identityHistory";

export type MemberChangeLogCategory = "identity" | "profile" | "status" | "role" | "notes" | "admin";

export type MemberChangeLogEntry = {
  id: string;
  category: MemberChangeLogCategory;
  field: string;
  label: string;
  fromValue: string | null;
  toValue: string | null;
  changedAt: string;
  changedBy: string;
  changedByUsername?: string;
  reason?: string;
  source: "system" | "audit" | "role_history" | "notes";
  action?: string;
};

export const MEMBER_LOG_CATEGORY_LABELS: Record<MemberChangeLogCategory, string> = {
  identity: "Identite (pseudo / ID)",
  profile: "Profil & infos",
  status: "Statut & validation",
  role: "Role",
  notes: "Notes internes",
  admin: "Actions admin",
};

const IDENTITY_FIELDS = new Set<string>(Object.keys(IDENTITY_FIELD_LABELS));

const PROFILE_FIELD_LABELS: Record<string, string> = {
  description: "Description publique",
  customBio: "Bio personnalisee",
  primaryLanguage: "Langue",
  timezone: "Fuseau horaire",
  countryCode: "Pays",
  parrain: "Parrain",
  mentorTwitchLogin: "Mentor integration",
  birthday: "Date de naissance",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "Twitter",
  integrationDate: "Date integration",
  lastReviewAt: "Derniere revue staff",
  nextReviewAt: "Prochaine revue",
  listId: "Liste membre",
  badges: "Badges",
  twitchAffiliateDate: "Date affiliation Twitch",
  staffNotificationEmail: "Email notification staff",
};

const STATUS_FIELD_LABELS: Record<string, string> = {
  isActive: "Statut actif",
  isVip: "VIP",
  isArchived: "Archive",
  profileValidationStatus: "Validation profil",
  onboardingStatus: "Onboarding",
  shadowbanLives: "Shadowban lives",
};

const TRACKED_FIELDS = new Set<string>([
  ...IDENTITY_FIELDS,
  ...Object.keys(PROFILE_FIELD_LABELS),
  ...Object.keys(STATUS_FIELD_LABELS),
  "role",
  "notesInternes",
]);

function normalizeLogValue(field: string, value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const json = JSON.stringify(value);
    return json.length > 180 ? `${json.slice(0, 177)}…` : json;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (field === "notesInternes" && text.length > 120) return `${text.slice(0, 117)}…`;
  if ((field === "description" || field === "customBio") && text.length > 100) {
    return `${text.slice(0, 97)}…`;
  }
  return text;
}

function fieldLabel(field: string): string {
  if (field in IDENTITY_FIELD_LABELS) return IDENTITY_FIELD_LABELS[field as IdentityFieldKey];
  if (field in PROFILE_FIELD_LABELS) return PROFILE_FIELD_LABELS[field];
  if (field in STATUS_FIELD_LABELS) return STATUS_FIELD_LABELS[field];
  if (field === "role") return "Role";
  if (field === "notesInternes") return "Notes internes";
  return field;
}

function fieldCategory(field: string): MemberChangeLogCategory {
  if (IDENTITY_FIELDS.has(field)) return "identity";
  if (field === "role") return "role";
  if (field === "notesInternes") return "notes";
  if (field in STATUS_FIELD_LABELS) return "status";
  return "profile";
}

function pickComparableFields(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const key of TRACKED_FIELDS) {
    if (key in (raw as Record<string, unknown>)) {
      out[key] = (raw as Record<string, unknown>)[key];
    }
  }
  return out;
}

function entryKey(e: MemberChangeLogEntry): string {
  return `${e.category}|${e.field}|${e.fromValue ?? ""}|${e.toValue ?? ""}|${e.changedAt.slice(0, 16)}`;
}

export function identityHistoryToLogEntries(entries: IdentityHistoryEntry[]): MemberChangeLogEntry[] {
  return entries.map((e) => ({
    id: `identity-${e.id}`,
    category: "identity" as const,
    field: e.field,
    label: IDENTITY_FIELD_LABELS[e.field],
    fromValue: e.fromValue,
    toValue: e.toValue,
    changedAt: e.changedAt,
    changedBy: e.changedBy,
    changedByUsername: e.changedByUsername,
    reason: e.reason,
    source: e.source === "audit" ? "audit" : "system",
  }));
}

export function buildMemberFieldChangesFromAuditLogs(logs: AuditLog[]): MemberChangeLogEntry[] {
  const entries: MemberChangeLogEntry[] = [];

  for (const log of logs) {
    if (log.action !== "member.update" && log.action !== "member.create") continue;

    const before = pickComparableFields(log.previousValue);
    const after = pickComparableFields(log.newValue);
    const fields =
      log.action === "member.create"
        ? Object.keys(after)
        : Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    const reason =
      typeof log.metadata?.reason === "string"
        ? log.metadata.reason
        : undefined;

    for (const field of fields) {
      if (IDENTITY_FIELDS.has(field)) continue;
      const fromValue = normalizeLogValue(field, before[field]);
      const toValue = normalizeLogValue(field, after[field]);
      if (log.action === "member.update" && fromValue === toValue) continue;

      entries.push({
        id: `audit-${log.id}-${field}`,
        category: fieldCategory(field),
        field,
        label: fieldLabel(field),
        fromValue: log.action === "member.create" ? null : fromValue,
        toValue,
        changedAt: log.timestamp,
        changedBy: log.actorDiscordId || "system",
        changedByUsername: log.actorUsername,
        reason,
        source: "audit",
        action: log.action,
      });
    }
  }

  return entries;
}

export function buildRoleHistoryLogEntries(
  roleHistory: Array<{
    fromRole?: string;
    toRole?: string;
    changedAt?: string;
    changedBy?: string;
    reason?: string;
  }> | null | undefined
): MemberChangeLogEntry[] {
  if (!Array.isArray(roleHistory)) return [];
  return roleHistory
    .filter((row) => row.changedAt && row.toRole)
    .map((row, idx) => ({
      id: `role-history-${idx}-${row.changedAt}`,
      category: "role" as const,
      field: "role",
      label: "Role",
      fromValue: row.fromRole ?? null,
      toValue: row.toRole ?? null,
      changedAt: row.changedAt!,
      changedBy: row.changedBy || "system",
      reason: row.reason,
      source: "role_history" as const,
    }));
}

export function buildAdminActionLogEntries(logs: AuditLog[]): MemberChangeLogEntry[] {
  const entries: MemberChangeLogEntry[] = [];
  for (const log of logs) {
    if (log.action === "member.update" || log.action === "member.create") continue;
    if (log.resourceType !== "member") continue;

    const fieldsChanged = Array.isArray(log.metadata?.fieldsChanged)
      ? (log.metadata.fieldsChanged as string[]).join(", ")
      : null;

    entries.push({
      id: `admin-${log.id}`,
      category: "admin",
      field: log.action,
      label: log.action.replace(/\./g, " · "),
      fromValue: null,
      toValue: fieldsChanged,
      changedAt: log.timestamp,
      changedBy: log.actorDiscordId || "system",
      changedByUsername: log.actorUsername,
      reason: typeof log.metadata?.reason === "string" ? log.metadata.reason : undefined,
      source: "audit",
      action: log.action,
    });
  }
  return entries;
}

export function mergeMemberChangeLogs(entries: MemberChangeLogEntry[]): MemberChangeLogEntry[] {
  const seen = new Set<string>();
  const merged: MemberChangeLogEntry[] = [];
  for (const entry of entries) {
    const key = entryKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }
  return merged.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

export function buildFullMemberChangeLog(input: {
  storedIdentityHistory?: unknown;
  roleHistory?: Array<{
    fromRole?: string;
    toRole?: string;
    changedAt?: string;
    changedBy?: string;
    reason?: string;
  }>;
  auditLogs: AuditLog[];
  twitchLogin?: string;
  discordId?: string;
  twitchId?: string;
}): MemberChangeLogEntry[] {
  const storedHistory = normalizeIdentityHistory(input.storedIdentityHistory);
  const matchCtx = buildMemberIdentityMatchContext({
    twitchLogin: input.twitchLogin,
    discordId: input.discordId,
    twitchId: input.twitchId,
    storedHistory,
  });

  const relevantLogs = input.auditLogs.filter((log) => auditLogMatchesMemberIdentity(log, matchCtx));
  const identityFromAudit = buildIdentityHistoryFromAuditLogs(relevantLogs);
  const identityMerged = mergeIdentityHistory(storedHistory, identityFromAudit);

  return mergeMemberChangeLogs([
    ...identityHistoryToLogEntries(identityMerged),
    ...buildMemberFieldChangesFromAuditLogs(relevantLogs),
    ...buildRoleHistoryLogEntries(input.roleHistory),
    ...buildAdminActionLogEntries(relevantLogs),
  ]);
}

export function countByCategory(entries: MemberChangeLogEntry[]): Record<MemberChangeLogCategory, number> {
  const counts: Record<MemberChangeLogCategory, number> = {
    identity: 0,
    profile: 0,
    status: 0,
    role: 0,
    notes: 0,
    admin: 0,
  };
  for (const e of entries) counts[e.category] += 1;
  return counts;
}
