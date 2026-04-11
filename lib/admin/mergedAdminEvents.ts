import { supabaseAdmin } from "@/lib/db/supabase";
import { eventRepository } from "@/lib/repositories";

export function eventMergeKey(eventLike: {
  id?: string;
  legacyEventId?: string;
  title?: string;
  date?: Date | string;
}): string {
  const title = String(eventLike.title || "").trim().toLowerCase();
  const dateRaw = eventLike.date;
  const dateIso = dateRaw instanceof Date ? dateRaw.toISOString() : String(dateRaw || "");
  return `${title}__${dateIso}`;
}

async function loadEventsWithoutCache(): Promise<any[]> {
  const tryCommunityStartsAt = await supabaseAdmin
    .from("community_events")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(1000);

  const tryCommunityDate = await supabaseAdmin
    .from("community_events")
    .select("*")
    .order("date", { ascending: false })
    .limit(1000);

  const tryLegacyDate = await supabaseAdmin
    .from("events")
    .select("*")
    .order("date", { ascending: false })
    .limit(1000);

  const tryLegacyStartsAt = await supabaseAdmin
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(1000);

  const communityRows = [
    ...(tryCommunityStartsAt.error ? [] : tryCommunityStartsAt.data || []),
    ...(tryCommunityDate.error ? [] : tryCommunityDate.data || []),
  ];
  const legacyRows = [
    ...(tryLegacyDate.error ? [] : tryLegacyDate.data || []),
    ...(tryLegacyStartsAt.error ? [] : tryLegacyStartsAt.data || []),
  ];

  const dedupCommunity = new Map<string, any>();
  for (const row of communityRows) {
    if (!row?.id) continue;
    dedupCommunity.set(String(row.id), row);
  }
  const community = Array.from(dedupCommunity.values());

  const representedLegacy = new Set<string>();
  const representedTitleDate = new Set<string>();
  for (const row of community) {
    if (row?.legacy_event_id) {
      representedLegacy.add(String(row.legacy_event_id));
    }
    const key = `${String(row?.title || "").trim().toLowerCase()}__${String(row?.starts_at || row?.date || "")}`;
    representedTitleDate.add(key);
  }

  const legacyOnly: any[] = [];
  const seenLegacyId = new Set<string>();
  for (const row of legacyRows) {
    const legacyId = String(row?.id || "");
    if (!legacyId || seenLegacyId.has(legacyId)) continue;
    seenLegacyId.add(legacyId);

    const key = `${String(row?.title || "").trim().toLowerCase()}__${String(row?.date || row?.starts_at || "")}`;
    if (representedLegacy.has(legacyId) || representedTitleDate.has(key)) {
      continue;
    }
    legacyOnly.push(row);
  }

  return [...community, ...legacyOnly];
}

export type MergedAdminEventLite = {
  id: string;
  title: string;
  category: string;
  date: Date;
};

/**
 * Liste fusionnée (community_events + legacy) alignée sur la logique de
 * `/api/admin/events/registrations`, pour statistiques admin.
 */
export async function loadMergedAdminEventsLite(): Promise<MergedAdminEventLite[]> {
  let events = await eventRepository.findAll(1000, 0);
  const directRows = await loadEventsWithoutCache();
  const directEvents = directRows.map((row: any) => ({
    id: String(row.id),
    title: row.title || "Sans titre",
    description: row.description || "",
    image: row.image || undefined,
    date: new Date(row.starts_at || row.date || row.created_at || row.updated_at || new Date().toISOString()),
    category: row.category || "Non classé",
    location: row.location || undefined,
    invitedMembers: row.invited_members || [],
    isPublished: row.is_published ?? row.isPublished ?? false,
    createdAt: new Date(row.created_at || new Date().toISOString()),
    createdBy: row.created_by || "system",
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    legacyEventId: row.legacy_event_id ? String(row.legacy_event_id) : undefined,
  }));

  const byId = new Map<string, any>();
  const byLegacyId = new Map<string, string>();
  const byTitleDate = new Map<string, string>();

  for (const event of events) {
    byId.set(String(event.id), event);
    const legacy = (event as any).legacyEventId;
    if (legacy) byLegacyId.set(String(legacy), String(event.id));
    byTitleDate.set(eventMergeKey(event), String(event.id));
  }

  for (const event of directEvents) {
    const directId = String(event.id);
    if (byId.has(directId)) continue;

    if (event.legacyEventId && byLegacyId.has(event.legacyEventId)) {
      continue;
    }

    const key = eventMergeKey(event);
    if (byTitleDate.has(key)) {
      continue;
    }

    byId.set(directId, event);
    if (event.legacyEventId) byLegacyId.set(event.legacyEventId, directId);
    byTitleDate.set(key, directId);
  }

  events = Array.from(byId.values());

  return events.map((e: any) => ({
    id: String(e.id),
    title: String(e.title || ""),
    category: String(e.category || "Non classé").trim() || "Non classé",
    date: e.date instanceof Date ? e.date : new Date(e.date),
  }));
}
