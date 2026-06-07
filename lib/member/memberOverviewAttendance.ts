/**
 * Détection catégorie « formation » — alignée sur l’API événements (category = "Formation").
 */
export function normalizeEventCategory(value?: string | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isFormationEventCategory(category?: string | null): boolean {
  const key = normalizeEventCategory(category);
  if (!key) return false;
  if (key === "formation") return true;
  return key.includes("formation");
}

export type MemberPresenceRow = {
  event_id: string;
  present: boolean;
  validated_at: string | null;
  created_at: string | null;
};

export type ResolvedMemberEvent = {
  id: string;
  title: string;
  date: Date;
  category: string;
};

export function dedupeMemberPresenceRows(rows: MemberPresenceRow[]): MemberPresenceRow[] {
  const byEvent = new Map<string, MemberPresenceRow>();
  for (const row of rows) {
    const key = String(row.event_id || "");
    if (!key) continue;
    const existing = byEvent.get(key);
    if (!existing) {
      byEvent.set(key, row);
      continue;
    }
    const existingTs = Math.max(safeTs(existing.validated_at), safeTs(existing.created_at));
    const currentTs = Math.max(safeTs(row.validated_at), safeTs(row.created_at));
    if (currentTs >= existingTs) byEvent.set(key, row);
  }
  return Array.from(byEvent.values());
}

function safeTs(value?: string | null): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export function mergeFormationHistoryIntoMap<
  T extends { id: string; title: string; date: string; category: string },
>(map: Map<string, T[]>, formationHistory: Array<{ id: string; title: string; date: string }>): Map<string, T[]> {
  const next = new Map(map);
  for (const item of formationHistory) {
    const monthKey = (item.date ?? "").slice(0, 7);
    if (!monthKey) continue;
    const list = next.get(monthKey) || [];
    const exists = list.some((row) => row.id === item.id && row.date === item.date);
    if (exists) continue;
    list.push({
      id: item.id,
      title: item.title,
      date: item.date,
      category: "Formation",
    } as T);
    next.set(monthKey, list);
  }
  return next;
}

function rowTimestamp(row: MemberPresenceRow): number {
  return Math.max(safeTs(row.validated_at), safeTs(row.created_at));
}

function mapRawPresenceRow(row: Record<string, unknown>): MemberPresenceRow {
  return {
    event_id: String(row.event_id || ""),
    present: Boolean(row.present),
    validated_at: (row.validated_at as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  };
}

function identityMatchesRow(
  row: Record<string, unknown>,
  identity: Set<string>,
  getAliases: (value?: unknown) => string[],
): boolean {
  const twitchAliases = getAliases(row.twitch_login);
  const discordAliases = getAliases(row.discord_id);
  return [...twitchAliases, ...discordAliases].some((alias) => identity.has(alias));
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

/**
 * Charge les présences validées du membre (twitch + discord + alias), avec résolution d'événements.
 */
export async function loadMemberOverviewPresences(input: {
  identity: Set<string>;
  discordId: string;
  memberTwitchLogin: string;
  getIdentityAliases: (value?: unknown) => string[];
  getMemberPresencesWithEvents: (login: string) => Promise<
    Array<{
      presence: { eventId: string; present: boolean; validatedAt?: Date; createdAt?: Date };
      event: { id: string; title: string; date: string; category: string } | null;
    }>
  >;
  queryPresenceRows: (filter: "twitch" | "discord", value: string) => Promise<Record<string, unknown>[]>;
}): Promise<{
  presenceRows: MemberPresenceRow[];
  resolvedEvents: Map<string, ResolvedMemberEvent>;
}> {
  const rowByEvent = new Map<string, MemberPresenceRow>();
  const resolvedEvents = new Map<string, ResolvedMemberEvent>();

  function absorbPresenceRow(row: MemberPresenceRow) {
    if (!row.event_id || !row.present) return;
    const existing = rowByEvent.get(row.event_id);
    if (!existing || rowTimestamp(row) >= rowTimestamp(existing)) {
      rowByEvent.set(row.event_id, row);
    }
  }

  function absorbResolvedEvent(event: { id: string; title: string; date: string; category: string }) {
    const d = new Date(event.date);
    if (Number.isNaN(d.getTime())) return;
    resolvedEvents.set(String(event.id), {
      id: String(event.id),
      title: event.title || "Événement TENF",
      date: d,
      category: event.category || "Événement",
    });
  }

  const login = String(input.memberTwitchLogin || "").trim().toLowerCase();
  if (login) {
    try {
      const entries = await input.getMemberPresencesWithEvents(login);
      for (const entry of entries) {
        if (!entry.presence.present) continue;
        absorbPresenceRow({
          event_id: String(entry.presence.eventId || ""),
          present: true,
          validated_at: toIsoOrNull(entry.presence.validatedAt),
          created_at: toIsoOrNull(entry.presence.createdAt),
        });
        if (entry.event) absorbResolvedEvent(entry.event);
      }
    } catch {
      /* best effort */
    }
  }

  const twitchCandidates = new Set<string>();
  if (login) twitchCandidates.add(login);
  for (const alias of input.identity) {
    if (!alias || alias.length < 2) continue;
    if (/^\d+$/.test(alias)) continue;
    twitchCandidates.add(alias.toLowerCase());
  }

  for (const twitch of twitchCandidates) {
    try {
      const rows = await input.queryPresenceRows("twitch", twitch);
      for (const raw of rows) {
        if (!identityMatchesRow(raw, input.identity, input.getIdentityAliases)) continue;
        absorbPresenceRow(mapRawPresenceRow(raw));
      }
    } catch {
      /* best effort */
    }
  }

  if (input.discordId) {
    try {
      const rows = await input.queryPresenceRows("discord", input.discordId);
      for (const raw of rows) {
        if (!identityMatchesRow(raw, input.identity, input.getIdentityAliases)) continue;
        absorbPresenceRow(mapRawPresenceRow(raw));
      }
    } catch {
      /* best effort */
    }
  }

  return {
    presenceRows: dedupeMemberPresenceRows(Array.from(rowByEvent.values())),
    resolvedEvents,
  };
}
