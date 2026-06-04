/**
 * Historique des changements d'identité (pseudos, IDs) — stocké dans members.identity_history
 * et enrichi depuis les logs d'audit member.create / member.update.
 */

import type { AuditLog } from "@/lib/adminAudit";

export type IdentityFieldKey =
  | "displayName"
  | "twitchLogin"
  | "discordUsername"
  | "discordId"
  | "siteUsername"
  | "twitchId";

export const IDENTITY_FIELD_LABELS: Record<IdentityFieldKey, string> = {
  displayName: "Nom affiché",
  twitchLogin: "Pseudo Twitch",
  discordUsername: "Pseudo Discord",
  discordId: "ID Discord",
  siteUsername: "Pseudo site",
  twitchId: "ID Twitch",
};

export type IdentityHistoryEntry = {
  id: string;
  field: IdentityFieldKey;
  fromValue: string | null;
  toValue: string | null;
  changedAt: string;
  changedBy: string;
  changedByUsername?: string;
  reason?: string;
  source: "system" | "audit";
};

export type IdentitySnapshot = Partial<Record<IdentityFieldKey, string | null>>;

const IDENTITY_FIELD_KEYS: IdentityFieldKey[] = [
  "displayName",
  "twitchLogin",
  "discordUsername",
  "discordId",
  "siteUsername",
  "twitchId",
];

export function generateIdentityHistoryEntryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idh-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeIdentityValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** Extrait les champs d'identité d'un objet membre (audit ou DB). */
export function pickIdentitySnapshot(raw: unknown): IdentitySnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const snap: IdentitySnapshot = {};
  let hasAny = false;
  for (const key of IDENTITY_FIELD_KEYS) {
    if (key in o) {
      snap[key] = normalizeIdentityValue(o[key]);
      hasAny = true;
    }
  }
  return hasAny ? snap : null;
}

export function normalizeIdentityHistory(raw: unknown): IdentityHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: IdentityHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const field = o.field as IdentityFieldKey;
    if (!IDENTITY_FIELD_KEYS.includes(field)) continue;
    const changedAt = typeof o.changedAt === "string" ? o.changedAt : null;
    const changedBy = typeof o.changedBy === "string" ? o.changedBy : null;
    if (!changedAt || !changedBy) continue;
    out.push({
      id: typeof o.id === "string" ? o.id : generateIdentityHistoryEntryId(),
      field,
      fromValue: normalizeIdentityValue(o.fromValue),
      toValue: normalizeIdentityValue(o.toValue),
      changedAt,
      changedBy,
      changedByUsername: typeof o.changedByUsername === "string" ? o.changedByUsername : undefined,
      reason: typeof o.reason === "string" ? o.reason : undefined,
      source: o.source === "audit" ? "audit" : "system",
    });
  }
  return out.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

export function createIdentityChangeEntries(input: {
  before: IdentitySnapshot;
  after: IdentitySnapshot;
  changedBy: string;
  changedByUsername?: string;
  reason?: string;
  changedAt?: string;
}): IdentityHistoryEntry[] {
  const changedAt = input.changedAt || new Date().toISOString();
  const entries: IdentityHistoryEntry[] = [];
  for (const field of IDENTITY_FIELD_KEYS) {
    const fromValue = normalizeIdentityValue(input.before[field]);
    const toValue = normalizeIdentityValue(input.after[field]);
    if (fromValue === toValue) continue;
    entries.push({
      id: generateIdentityHistoryEntryId(),
      field,
      fromValue,
      toValue,
      changedAt,
      changedBy: input.changedBy,
      changedByUsername: input.changedByUsername,
      reason: input.reason,
      source: "system",
    });
  }
  return entries;
}

function entryDedupeKey(e: IdentityHistoryEntry): string {
  return `${e.field}|${e.fromValue ?? ""}|${e.toValue ?? ""}|${e.changedAt.slice(0, 16)}`;
}

/** Fusionne historique persisté + entrées dérivées des audits (sans doublons). */
export function mergeIdentityHistory(
  stored: IdentityHistoryEntry[],
  fromAudit: IdentityHistoryEntry[]
): IdentityHistoryEntry[] {
  const seen = new Set<string>();
  const merged: IdentityHistoryEntry[] = [];
  for (const e of [...stored, ...fromAudit]) {
    const key = entryDedupeKey(e);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(e);
  }
  return merged.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

export type MemberIdentityMatchContext = {
  twitchLogins: Set<string>;
  discordIds: Set<string>;
  twitchIds: Set<string>;
};

export function buildMemberIdentityMatchContext(input: {
  twitchLogin?: string | null;
  discordId?: string | null;
  twitchId?: string | null;
  storedHistory?: IdentityHistoryEntry[];
}): MemberIdentityMatchContext {
  const twitchLogins = new Set<string>();
  const discordIds = new Set<string>();
  const twitchIds = new Set<string>();

  const addTwitch = (v?: string | null) => {
    const n = (v || "").trim().toLowerCase();
    if (n) twitchLogins.add(n);
  };
  const addDiscord = (v?: string | null) => {
    const n = (v || "").trim();
    if (n) discordIds.add(n);
  };
  const addTwitchId = (v?: string | null) => {
    const n = (v || "").trim();
    if (n) twitchIds.add(n);
  };

  addTwitch(input.twitchLogin);
  addDiscord(input.discordId);
  addTwitchId(input.twitchId);

  for (const entry of input.storedHistory || []) {
    if (entry.field === "twitchLogin") {
      addTwitch(entry.fromValue);
      addTwitch(entry.toValue);
    }
    if (entry.field === "discordId") {
      addDiscord(entry.fromValue);
      addDiscord(entry.toValue);
    }
    if (entry.field === "twitchId") {
      addTwitchId(entry.fromValue);
      addTwitchId(entry.toValue);
    }
  }

  return { twitchLogins, discordIds, twitchIds };
}

export function auditLogMatchesMemberIdentity(
  log: AuditLog,
  ctx: MemberIdentityMatchContext
): boolean {
  if (log.resourceType !== "member") return false;
  const rid = (log.resourceId || "").trim().toLowerCase();
  if (rid && ctx.twitchLogins.has(rid)) return true;

  for (const raw of [log.previousValue, log.newValue]) {
    const snap = pickIdentitySnapshot(raw);
    if (!snap) continue;
    const tl = (snap.twitchLogin || "").toLowerCase();
    const di = snap.discordId || "";
    const ti = snap.twitchId || "";
    if (tl && ctx.twitchLogins.has(tl)) return true;
    if (di && ctx.discordIds.has(di)) return true;
    if (ti && ctx.twitchIds.has(ti)) return true;
  }
  return false;
}

export function buildIdentityHistoryFromAuditLogs(logs: AuditLog[]): IdentityHistoryEntry[] {
  const entries: IdentityHistoryEntry[] = [];

  for (const log of logs) {
    if (log.action !== "member.update" && log.action !== "member.create") continue;

    const before = pickIdentitySnapshot(log.previousValue) || {};
    const after = pickIdentitySnapshot(log.newValue) || {};
    const changedBy = log.actorDiscordId || "system";
    const reason =
      typeof log.metadata?.reason === "string"
        ? log.metadata.reason
        : typeof log.metadata?.fieldsChanged === "object"
          ? undefined
          : undefined;

    const batch = createIdentityChangeEntries({
      before,
      after,
      changedBy,
      changedByUsername: log.actorUsername,
      reason,
      changedAt: log.timestamp,
    });

    for (const e of batch) {
      entries.push({ ...e, source: "audit" });
    }
  }

  return entries;
}

/** Mappe le formulaire modal (nom / discord / twitch) vers un snapshot API. */
export function memberFormToIdentitySnapshot(member: {
  nom?: string;
  twitch?: string;
  discord?: string;
  discordId?: string;
  twitchId?: string;
  siteUsername?: string;
}): IdentitySnapshot {
  return {
    displayName: normalizeIdentityValue(member.nom),
    twitchLogin: normalizeIdentityValue(member.twitch)?.toLowerCase() ?? null,
    discordUsername: normalizeIdentityValue(member.discord),
    discordId: normalizeIdentityValue(member.discordId),
    siteUsername: normalizeIdentityValue(member.siteUsername ?? member.nom),
    twitchId: normalizeIdentityValue(member.twitchId),
  };
}

export function memberDataToIdentitySnapshot(member: {
  displayName?: string;
  twitchLogin?: string;
  discordUsername?: string;
  discordId?: string;
  siteUsername?: string;
  twitchId?: string;
}): IdentitySnapshot {
  return {
    displayName: normalizeIdentityValue(member.displayName),
    twitchLogin: normalizeIdentityValue(member.twitchLogin)?.toLowerCase() ?? null,
    discordUsername: normalizeIdentityValue(member.discordUsername),
    discordId: normalizeIdentityValue(member.discordId),
    siteUsername: normalizeIdentityValue(member.siteUsername),
    twitchId: normalizeIdentityValue(member.twitchId),
  };
}
