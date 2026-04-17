import { supabaseAdmin } from "@/lib/db/supabase";

export type StaffMissionAssignment = {
  id: string;
  assigneeDiscordId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  updatedByDiscordId: string | null;
};

function mapRow(row: Record<string, unknown>): StaffMissionAssignment {
  return {
    id: String(row.id),
    assigneeDiscordId: String(row.assignee_discord_id || ""),
    title: String(row.title || ""),
    description: row.description != null ? String(row.description) : null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    updatedByDiscordId: row.updated_by_discord_id != null ? String(row.updated_by_discord_id) : null,
  };
}

export async function listStaffMissionsForAssignee(assigneeDiscordId: string): Promise<StaffMissionAssignment[]> {
  const id = assigneeDiscordId.trim();
  if (!id) return [];

  const { data, error } = await supabaseAdmin
    .from("staff_mission_assignments")
    .select(
      "id, assignee_discord_id, title, description, sort_order, created_at, updated_at, updated_by_discord_id"
    )
    .eq("assignee_discord_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[staffMissionAssignments] list:", error.message);
    throw error;
  }

  return (data || []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createStaffMission(input: {
  assigneeDiscordId: string;
  title: string;
  description?: string | null;
  sortOrder?: number;
  updatedByDiscordId: string;
}): Promise<StaffMissionAssignment> {
  const row = {
    assignee_discord_id: input.assigneeDiscordId.trim(),
    title: input.title.trim().slice(0, 200),
    description: input.description?.trim() ? input.description.trim().slice(0, 2000) : null,
    sort_order: input.sortOrder ?? 0,
    updated_by_discord_id: input.updatedByDiscordId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from("staff_mission_assignments").insert(row).select().single();

  if (error) {
    console.error("[staffMissionAssignments] create:", error.message);
    throw error;
  }

  return mapRow(data as Record<string, unknown>);
}

export async function updateStaffMission(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    sortOrder?: number;
    updatedByDiscordId: string;
  }
): Promise<StaffMissionAssignment | null> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by_discord_id: patch.updatedByDiscordId,
  };
  if (patch.title !== undefined) updates.title = patch.title.trim().slice(0, 200);
  if (patch.description !== undefined) {
    updates.description = patch.description?.trim() ? String(patch.description).trim().slice(0, 2000) : null;
  }
  if (patch.sortOrder !== undefined) updates.sort_order = patch.sortOrder;

  const { data, error } = await supabaseAdmin
    .from("staff_mission_assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[staffMissionAssignments] update:", error.message);
    throw error;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteStaffMission(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("staff_mission_assignments").delete().eq("id", id);

  if (error) {
    console.error("[staffMissionAssignments] delete:", error.message);
    throw error;
  }
}
