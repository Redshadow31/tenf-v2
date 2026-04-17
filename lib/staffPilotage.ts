import { supabaseAdmin } from "@/lib/db/supabase";

export const PILOTAGE_LANE_KEYS = [
  "discord_points",
  "raids",
  "member_integration",
  "member_profile_verification",
] as const;

export type PilotageLaneKey = (typeof PILOTAGE_LANE_KEYS)[number];

export const PILOTAGE_LANE_LABELS: Record<PilotageLaneKey, string> = {
  discord_points: "Points Discord (suivi / relevés)",
  raids: "Raids (coordination)",
  member_integration: "Intégration des nouveaux membres",
  member_profile_verification: "Vérification des informations membres",
};

export type StaffPilotageEventLead = {
  eventId: string;
  primaryDiscordId: string;
  secondaryDiscordId: string | null;
  notes: string | null;
  updatedAt: string;
  updatedByDiscordId: string | null;
};

export type StaffPilotageLaneOwner = {
  laneKey: PilotageLaneKey;
  primaryDiscordId: string;
  secondaryDiscordId: string | null;
  notes: string | null;
  updatedAt: string;
  updatedByDiscordId: string | null;
};

export type StaffPilotageScheduledCategory = "integration_meeting" | "action" | "raid_window" | "other";

export type StaffPilotageScheduledItem = {
  id: string;
  category: StaffPilotageScheduledCategory;
  title: string;
  scheduledAt: string | null;
  endsAt: string | null;
  primaryDiscordId: string | null;
  secondaryDiscordId: string | null;
  status: string;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  updatedByDiscordId: string | null;
};

function mapLead(row: Record<string, unknown>): StaffPilotageEventLead {
  return {
    eventId: String(row.event_id),
    primaryDiscordId: String(row.primary_discord_id || ""),
    secondaryDiscordId: row.secondary_discord_id != null ? String(row.secondary_discord_id) : null,
    notes: row.notes != null ? String(row.notes) : null,
    updatedAt: String(row.updated_at || ""),
    updatedByDiscordId: row.updated_by_discord_id != null ? String(row.updated_by_discord_id) : null,
  };
}

function mapLane(row: Record<string, unknown>): StaffPilotageLaneOwner {
  return {
    laneKey: String(row.lane_key) as PilotageLaneKey,
    primaryDiscordId: String(row.primary_discord_id || ""),
    secondaryDiscordId: row.secondary_discord_id != null ? String(row.secondary_discord_id) : null,
    notes: row.notes != null ? String(row.notes) : null,
    updatedAt: String(row.updated_at || ""),
    updatedByDiscordId: row.updated_by_discord_id != null ? String(row.updated_by_discord_id) : null,
  };
}

function mapScheduled(row: Record<string, unknown>): StaffPilotageScheduledItem {
  return {
    id: String(row.id),
    category: String(row.category) as StaffPilotageScheduledCategory,
    title: String(row.title || ""),
    scheduledAt: row.scheduled_at != null ? String(row.scheduled_at) : null,
    endsAt: row.ends_at != null ? String(row.ends_at) : null,
    primaryDiscordId: row.primary_discord_id != null ? String(row.primary_discord_id) : null,
    secondaryDiscordId: row.secondary_discord_id != null ? String(row.secondary_discord_id) : null,
    status: String(row.status || "planned"),
    notes: row.notes != null ? String(row.notes) : null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    updatedByDiscordId: row.updated_by_discord_id != null ? String(row.updated_by_discord_id) : null,
  };
}

export async function listEventLeads(): Promise<StaffPilotageEventLead[]> {
  const { data, error } = await supabaseAdmin.from("staff_pilotage_event_leads").select("*");
  if (error) {
    console.error("[staffPilotage] listEventLeads:", error.message);
    throw error;
  }
  return (data || []).map((r) => mapLead(r as Record<string, unknown>));
}

export async function upsertEventLead(
  input: {
    eventId: string;
    primaryDiscordId: string;
    secondaryDiscordId?: string | null;
    notes?: string | null;
    updatedByDiscordId: string;
  },
  options?: { deleteIfEmpty?: boolean }
): Promise<void> {
  const primary = input.primaryDiscordId.trim();
  if (!primary) {
    if (options?.deleteIfEmpty) {
      const { error } = await supabaseAdmin.from("staff_pilotage_event_leads").delete().eq("event_id", input.eventId);
      if (error) throw error;
    }
    return;
  }

  const row = {
    event_id: input.eventId,
    primary_discord_id: primary.slice(0, 64),
    secondary_discord_id: input.secondaryDiscordId?.trim() ? input.secondaryDiscordId.trim().slice(0, 64) : null,
    notes: input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null,
    updated_at: new Date().toISOString(),
    updated_by_discord_id: input.updatedByDiscordId,
  };

  const { error } = await supabaseAdmin.from("staff_pilotage_event_leads").upsert(row, { onConflict: "event_id" });
  if (error) throw error;
}

export async function listLaneOwners(): Promise<StaffPilotageLaneOwner[]> {
  const { data, error } = await supabaseAdmin.from("staff_pilotage_lane_owners").select("*");
  if (error) {
    console.error("[staffPilotage] listLaneOwners:", error.message);
    throw error;
  }
  return (data || []).map((r) => mapLane(r as Record<string, unknown>));
}

export async function upsertLaneOwner(input: {
  laneKey: PilotageLaneKey;
  primaryDiscordId: string;
  secondaryDiscordId?: string | null;
  notes?: string | null;
  updatedByDiscordId: string;
}): Promise<void> {
  const primary = input.primaryDiscordId.trim();
  if (!primary) {
    const { error } = await supabaseAdmin.from("staff_pilotage_lane_owners").delete().eq("lane_key", input.laneKey);
    if (error) throw error;
    return;
  }

  const row = {
    lane_key: input.laneKey,
    primary_discord_id: primary.slice(0, 64),
    secondary_discord_id: input.secondaryDiscordId?.trim() ? input.secondaryDiscordId.trim().slice(0, 64) : null,
    notes: input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null,
    updated_at: new Date().toISOString(),
    updated_by_discord_id: input.updatedByDiscordId,
  };

  const { error } = await supabaseAdmin.from("staff_pilotage_lane_owners").upsert(row, { onConflict: "lane_key" });
  if (error) throw error;
}

export async function listScheduledItems(limit = 200): Promise<StaffPilotageScheduledItem[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_pilotage_scheduled_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("[staffPilotage] listScheduledItems:", error.message);
    throw error;
  }
  return (data || []).map((r) => mapScheduled(r as Record<string, unknown>));
}

export async function createScheduledItem(input: {
  category: StaffPilotageScheduledCategory;
  title: string;
  scheduledAt?: string | null;
  endsAt?: string | null;
  primaryDiscordId?: string | null;
  secondaryDiscordId?: string | null;
  status?: string;
  notes?: string | null;
  sortOrder?: number;
  updatedByDiscordId: string;
}): Promise<StaffPilotageScheduledItem> {
  const row = {
    category: input.category,
    title: input.title.trim().slice(0, 300),
    scheduled_at: input.scheduledAt?.trim() || null,
    ends_at: input.endsAt?.trim() || null,
    primary_discord_id: input.primaryDiscordId?.trim() || null,
    secondary_discord_id: input.secondaryDiscordId?.trim() || null,
    status: input.status?.trim() || "planned",
    notes: input.notes?.trim() ? input.notes.trim().slice(0, 4000) : null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
    updated_by_discord_id: input.updatedByDiscordId,
  };

  const { data, error } = await supabaseAdmin.from("staff_pilotage_scheduled_items").insert(row).select().single();
  if (error) throw error;
  return mapScheduled(data as Record<string, unknown>);
}

export async function updateScheduledItem(
  id: string,
  patch: {
    category?: StaffPilotageScheduledCategory;
    title?: string;
    scheduledAt?: string | null;
    endsAt?: string | null;
    primaryDiscordId?: string | null;
    secondaryDiscordId?: string | null;
    status?: string;
    notes?: string | null;
    sortOrder?: number;
    updatedByDiscordId: string;
  }
): Promise<StaffPilotageScheduledItem | null> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by_discord_id: patch.updatedByDiscordId,
  };
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.title !== undefined) updates.title = patch.title.trim().slice(0, 300);
  if (patch.scheduledAt !== undefined) updates.scheduled_at = patch.scheduledAt?.trim() || null;
  if (patch.endsAt !== undefined) updates.ends_at = patch.endsAt?.trim() || null;
  if (patch.primaryDiscordId !== undefined) {
    updates.primary_discord_id = patch.primaryDiscordId?.trim() || null;
  }
  if (patch.secondaryDiscordId !== undefined) {
    updates.secondary_discord_id = patch.secondaryDiscordId?.trim() || null;
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.notes !== undefined) updates.notes = patch.notes?.trim() ? patch.notes.trim().slice(0, 4000) : null;
  if (patch.sortOrder !== undefined) updates.sort_order = patch.sortOrder;

  const { data, error } = await supabaseAdmin
    .from("staff_pilotage_scheduled_items")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapScheduled(data as Record<string, unknown>);
}

export async function deleteScheduledItem(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("staff_pilotage_scheduled_items").delete().eq("id", id);
  if (error) throw error;
}

/** Fusionne les lignes connues avec les 4 lanes attendues (valeurs vides si absent en base). */
export function mergeLaneOwners(rows: StaffPilotageLaneOwner[]): StaffPilotageLaneOwner[] {
  const byKey = new Map(rows.map((r) => [r.laneKey, r]));
  return PILOTAGE_LANE_KEYS.map((laneKey) => {
    const existing = byKey.get(laneKey);
    if (existing) return existing;
    return {
      laneKey,
      primaryDiscordId: "",
      secondaryDiscordId: null,
      notes: null,
      updatedAt: "",
      updatedByDiscordId: null,
    };
  });
}
