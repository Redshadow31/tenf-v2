import { supabaseAdmin } from "@/lib/db/supabase";
import type { OrgChartEntry, OrgChartMemberRef, OrgChartPoleKey, OrgChartRoleKey, OrgChartStatusKey } from "@/lib/staff/orgChartTypes";
import { poleLabelFromKey, roleLabelFromKey, statusLabelFromKey } from "@/lib/staff/orgChartTypes";

type OrgChartDbRow = {
  id: string;
  member_id: string;
  role_key: string;
  role_label: string;
  status_key: string;
  status_label: string;
  pole_key: string;
  pole_label: string;
  bio_short: string;
  display_order: number;
  is_visible: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  members?: {
    id: string;
    twitch_login: string;
    display_name: string;
    discord_id?: string | null;
    discord_username?: string | null;
    twitch_status?: { profileImageUrl?: string } | null;
    role?: string | null;
    is_active?: boolean | null;
  } | null;
};

export interface OrgChartUpsertInput {
  id?: string;
  memberId: string;
  roleKey: OrgChartRoleKey;
  roleLabel?: string;
  statusKey: OrgChartStatusKey;
  statusLabel?: string;
  poleKey: OrgChartPoleKey;
  poleLabel?: string;
  bioShort?: string;
  displayOrder?: number;
  isVisible?: boolean;
  isArchived?: boolean;
}

function mapMemberRef(raw: OrgChartDbRow["members"]): OrgChartMemberRef {
  const fallbackLogin = String(raw?.twitch_login || "").toLowerCase();
  const avatar = raw?.twitch_status?.profileImageUrl;
  return {
    id: String(raw?.id || ""),
    twitchLogin: fallbackLogin,
    displayName: String(raw?.display_name || fallbackLogin || "Membre"),
    discordId: raw?.discord_id || undefined,
    discordUsername: raw?.discord_username || undefined,
    avatarUrl: avatar || (fallbackLogin ? `https://unavatar.io/twitch/${encodeURIComponent(fallbackLogin)}` : undefined),
    role: raw?.role || undefined,
    isActive: raw?.is_active ?? undefined,
  };
}

function mapEntry(row: OrgChartDbRow): OrgChartEntry {
  return {
    id: row.id,
    memberId: row.member_id,
    roleKey: row.role_key as OrgChartRoleKey,
    roleLabel: row.role_label,
    statusKey: row.status_key as OrgChartStatusKey,
    statusLabel: row.status_label,
    poleKey: row.pole_key as OrgChartPoleKey,
    poleLabel: row.pole_label,
    bioShort: row.bio_short || "",
    displayOrder: Number.isFinite(row.display_order) ? row.display_order : 0,
    isVisible: row.is_visible !== false,
    isArchived: row.is_archived === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    member: mapMemberRef(row.members),
  };
}

export class StaffOrgChartRepository {
  private readonly table = "staff_org_chart_entries";

  async listAll(includeArchived = true): Promise<OrgChartEntry[]> {
    let query = supabaseAdmin
      .from(this.table)
      .select(
        "id, member_id, role_key, role_label, status_key, status_label, pole_key, pole_label, bio_short, display_order, is_visible, is_archived, created_at, updated_at, members(id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active)"
      )
      .order("display_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data || []) as OrgChartDbRow[]).map(mapEntry);
  }

  async listPublic(): Promise<OrgChartEntry[]> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select(
        "id, member_id, role_key, role_label, status_key, status_label, pole_key, pole_label, bio_short, display_order, is_visible, is_archived, created_at, updated_at, members(id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active)"
      )
      .eq("is_visible", true)
      .eq("is_archived", false)
      .order("display_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return ((data || []) as OrgChartDbRow[]).map(mapEntry);
  }

  async upsert(input: OrgChartUpsertInput): Promise<OrgChartEntry> {
    const payload = {
      ...(input.id ? { id: input.id } : {}),
      member_id: input.memberId,
      role_key: input.roleKey,
      role_label: (input.roleLabel || roleLabelFromKey(input.roleKey)).trim(),
      status_key: input.statusKey,
      status_label: (input.statusLabel || statusLabelFromKey(input.statusKey)).trim(),
      pole_key: input.poleKey,
      pole_label: (input.poleLabel || poleLabelFromKey(input.poleKey)).trim(),
      bio_short: (input.bioShort || "").trim(),
      display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
      is_visible: input.isVisible !== false,
      is_archived: input.isArchived === true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .upsert(payload, { onConflict: "member_id" })
      .select(
        "id, member_id, role_key, role_label, status_key, status_label, pole_key, pole_label, bio_short, display_order, is_visible, is_archived, created_at, updated_at, members(id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active)"
      )
      .single();

    if (error) throw error;
    return mapEntry(data as OrgChartDbRow);
  }

  async remove(entryId: string): Promise<void> {
    const { error } = await supabaseAdmin.from(this.table).delete().eq("id", entryId);
    if (error) throw error;
  }

  async searchMembers(query: string, limit = 20): Promise<OrgChartMemberRef[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const { data, error } = await supabaseAdmin
      .from("members")
      .select("id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active")
      .or(`display_name.ilike.%${normalized}%,twitch_login.ilike.%${normalized}%,discord_username.ilike.%${normalized}%`)
      .order("display_name", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return ((data || []) as NonNullable<OrgChartDbRow["members"]>[]).map((row) => mapMemberRef(row));
  }
}

export const staffOrgChartRepository = new StaffOrgChartRepository();
