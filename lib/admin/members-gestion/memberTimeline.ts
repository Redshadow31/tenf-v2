/**
 * Historique membre enrichi (Phase A) — événements manuels + changements système.
 * Stocké dans members.role_history (JSONB).
 */

export type MemberTimelineKind =
  | "role_change"
  | "status_change"
  | "staff_milestone"
  | "note";

export type MemberTimelineSource = "manual" | "system";

export type MemberTimelineEntry = {
  id: string;
  kind: MemberTimelineKind;
  source: MemberTimelineSource;
  changedAt: string;
  changedBy: string;
  reason?: string;
  fromRole?: string;
  toRole?: string;
  summary?: string;
  tags?: string[];
  isBackfill?: boolean;
};

/** Compatibilité : entrées historiques sans kind/id. */
export type LegacyRoleHistoryEntry = {
  fromRole: string;
  toRole: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
  id?: string;
  kind?: MemberTimelineKind;
  source?: MemberTimelineSource;
  summary?: string;
  tags?: string[];
  isBackfill?: boolean;
};

export const TIMELINE_KIND_LABELS: Record<MemberTimelineKind, string> = {
  role_change: "Changement de rôle",
  status_change: "Changement de statut",
  staff_milestone: "Jalon staff",
  note: "Note / contexte",
};

export const TIMELINE_TAG_PRESETS = [
  "promotion",
  "démission",
  "réintégration",
  "congé",
  "sanction",
  "formation",
  "org_chart",
  "pause",
] as const;

export function generateTimelineEntryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function normalizeTimelineEntry(raw: unknown): MemberTimelineEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const changedAt = typeof o.changedAt === "string" ? o.changedAt : null;
  const changedBy = typeof o.changedBy === "string" ? o.changedBy : null;
  if (!changedAt || !changedBy) return null;

  const fromRole = typeof o.fromRole === "string" ? o.fromRole : undefined;
  const toRole = typeof o.toRole === "string" ? o.toRole : undefined;
  const kind = (o.kind as MemberTimelineKind) || (fromRole && toRole ? "role_change" : "note");

  if (kind === "role_change" && (!fromRole || !toRole)) return null;
  if (kind === "status_change" && (!fromRole || !toRole)) return null;

  return {
    id: typeof o.id === "string" ? o.id : generateTimelineEntryId(),
    kind,
    source: o.source === "manual" ? "manual" : "system",
    changedAt,
    changedBy,
    reason: typeof o.reason === "string" ? o.reason : undefined,
    fromRole,
    toRole,
    summary: typeof o.summary === "string" ? o.summary : undefined,
    tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : undefined,
    isBackfill: Boolean(o.isBackfill),
  };
}

export function normalizeTimeline(raw: unknown[] | undefined | null): MemberTimelineEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e) => normalizeTimelineEntry(e))
    .filter((e): e is MemberTimelineEntry => e !== null);
}

/** Entrées qui alimentent la reconstruction des périodes de rôle. */
export function affectsRoleTenure(entry: MemberTimelineEntry): boolean {
  if (entry.kind === "note" || entry.kind === "status_change") return false;
  if (entry.kind === "staff_milestone") {
    return Boolean(entry.fromRole && entry.toRole);
  }
  return entry.kind === "role_change";
}

/** Pour buildRoleTenures : format legacy from/to obligatoire. */
export function toRoleChangeShape(entry: MemberTimelineEntry): {
  fromRole: string;
  toRole: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
} | null {
  if (!affectsRoleTenure(entry)) return null;
  if (entry.kind === "role_change" || (entry.fromRole && entry.toRole)) {
    return {
      fromRole: entry.fromRole || "—",
      toRole: entry.toRole || "—",
      changedAt: entry.changedAt,
      changedBy: entry.changedBy,
      reason: entry.reason ?? entry.summary,
    };
  }
  return null;
}

export function getTimelineEntryTitle(entry: MemberTimelineEntry): string {
  switch (entry.kind) {
    case "note":
      return entry.summary || entry.reason || "Note";
    case "staff_milestone":
      return entry.summary || `Jalon : ${entry.toRole || entry.fromRole || "staff"}`;
    case "status_change":
      return `${entry.fromRole || "?"} → ${entry.toRole || "?"}`;
    case "role_change":
    default:
      return `${entry.fromRole || "?"} → ${entry.toRole || "?"}`;
  }
}

export function createSystemRoleChangeEntry(params: {
  fromRole: string;
  toRole: string;
  changedBy: string;
  reason?: string;
}): MemberTimelineEntry {
  return {
    id: generateTimelineEntryId(),
    kind: "role_change",
    source: "system",
    changedAt: new Date().toISOString(),
    changedBy: params.changedBy,
    fromRole: params.fromRole,
    toRole: params.toRole,
    reason: params.reason,
  };
}

export type CreateManualTimelineInput = {
  kind: MemberTimelineKind;
  changedAt: string;
  reason?: string;
  summary?: string;
  fromRole?: string;
  toRole?: string;
  tags?: string[];
  isBackfill?: boolean;
};

export function validateManualTimelineInput(input: CreateManualTimelineInput): string | null {
  if (!input.changedAt) return "La date est obligatoire.";
  const d = new Date(input.changedAt);
  if (Number.isNaN(d.getTime())) return "Date invalide.";

  switch (input.kind) {
    case "role_change":
      if (!input.fromRole?.trim() || !input.toRole?.trim()) {
        return "Les rôles « de » et « vers » sont obligatoires.";
      }
      break;
    case "status_change":
      if (!input.fromRole?.trim() || !input.toRole?.trim()) {
        return "Les statuts « de » et « vers » sont obligatoires (Actif / Inactif).";
      }
      break;
    case "staff_milestone":
      if (!input.summary?.trim() && !input.reason?.trim()) {
        return "Un libellé ou un détail est obligatoire pour un jalon staff.";
      }
      break;
    case "note":
      if (!input.summary?.trim() && !input.reason?.trim()) {
        return "Le texte de la note est obligatoire.";
      }
      break;
    default:
      return "Type d'événement invalide.";
  }
  return null;
}

export function createManualTimelineEntry(
  input: CreateManualTimelineInput,
  changedBy: string,
): MemberTimelineEntry {
  const err = validateManualTimelineInput(input);
  if (err) throw new Error(err);

  const changedAt = new Date(input.changedAt).toISOString();

  return {
    id: generateTimelineEntryId(),
    kind: input.kind,
    source: "manual",
    changedAt,
    changedBy,
    reason: input.reason?.trim() || undefined,
    summary: input.summary?.trim() || undefined,
    fromRole: input.fromRole?.trim() || undefined,
    toRole: input.toRole?.trim() || undefined,
    tags: input.tags?.length ? input.tags : undefined,
    isBackfill: Boolean(input.isBackfill),
  };
}

export function appendTimelineEntry(
  history: MemberTimelineEntry[] | undefined,
  entry: MemberTimelineEntry,
): MemberTimelineEntry[] {
  return [...normalizeTimeline(history as unknown[]), entry];
}

export function updateTimelineEntry(
  history: MemberTimelineEntry[] | undefined,
  id: string,
  patch: Partial<CreateManualTimelineInput>,
): MemberTimelineEntry[] {
  const list = normalizeTimeline(history as unknown[]);
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error("Événement introuvable.");
  const existing = list[idx];
  if (existing.source !== "manual") {
    throw new Error("Seuls les événements manuels peuvent être modifiés.");
  }

  const merged: CreateManualTimelineInput = {
    kind: patch.kind ?? existing.kind,
    changedAt: patch.changedAt ?? existing.changedAt,
    reason: patch.reason !== undefined ? patch.reason : existing.reason,
    summary: patch.summary !== undefined ? patch.summary : existing.summary,
    fromRole: patch.fromRole !== undefined ? patch.fromRole : existing.fromRole,
    toRole: patch.toRole !== undefined ? patch.toRole : existing.toRole,
    tags: patch.tags !== undefined ? patch.tags : existing.tags,
    isBackfill: patch.isBackfill !== undefined ? patch.isBackfill : existing.isBackfill,
  };

  const err = validateManualTimelineInput(merged);
  if (err) throw new Error(err);

  const updated = createManualTimelineEntry(merged, existing.changedBy);
  updated.id = existing.id;

  const next = [...list];
  next[idx] = updated;
  return next;
}

export function deleteTimelineEntry(
  history: MemberTimelineEntry[] | undefined,
  id: string,
): MemberTimelineEntry[] {
  const list = normalizeTimeline(history as unknown[]);
  const entry = list.find((e) => e.id === id);
  if (!entry) throw new Error("Événement introuvable.");
  if (entry.source !== "manual") {
    throw new Error("Seuls les événements manuels peuvent être supprimés.");
  }
  return list.filter((e) => e.id !== id);
}
