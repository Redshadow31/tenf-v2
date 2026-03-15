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
  secondary_poles?: unknown;
  bio_short: string;
  display_order: number;
  is_visible: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  members?:
    | {
        id: string;
        twitch_login: string;
        display_name: string;
        discord_id?: string | null;
        discord_username?: string | null;
        twitch_status?: { profileImageUrl?: string } | null;
        role?: string | null;
        is_active?: boolean | null;
      }
    | Array<{
        id: string;
        twitch_login: string;
        display_name: string;
        discord_id?: string | null;
        discord_username?: string | null;
        twitch_status?: { profileImageUrl?: string } | null;
        role?: string | null;
        is_active?: boolean | null;
      }>
    | null;
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
  secondaryPoleKeys?: OrgChartPoleKey[];
  bioShort?: string;
  displayOrder?: number;
  isVisible?: boolean;
  isArchived?: boolean;
}

function normalizeSecondaryPoles(value: unknown, primaryPole: OrgChartPoleKey): OrgChartPoleKey[] {
  const source = Array.isArray(value) ? value : [];
  const unique = new Set<OrgChartPoleKey>();
  for (const item of source) {
    const key = String(item || "").trim() as OrgChartPoleKey;
    if (!key || key === primaryPole) continue;
    if (key.startsWith("POLE_")) unique.add(key);
  }
  return Array.from(unique);
}

function normalizeMember(raw: OrgChartDbRow["members"]) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  return raw;
}

function mapMemberRef(raw: OrgChartDbRow["members"]): OrgChartMemberRef {
  const member = normalizeMember(raw);
  const fallbackLogin = String(member?.twitch_login || "").toLowerCase();
  const avatar = member?.twitch_status?.profileImageUrl;
  return {
    id: String(member?.id || ""),
    twitchLogin: fallbackLogin,
    displayName: String(member?.display_name || fallbackLogin || "Membre"),
    discordId: member?.discord_id || undefined,
    discordUsername: member?.discord_username || undefined,
    avatarUrl: avatar || (fallbackLogin ? `https://unavatar.io/twitch/${encodeURIComponent(fallbackLogin)}` : undefined),
    role: member?.role || undefined,
    isActive: member?.is_active ?? undefined,
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
    secondaryPoleKeys: normalizeSecondaryPoles(row.secondary_poles, row.pole_key as OrgChartPoleKey),
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
  private readonly selectWithSecondary =
    "id, member_id, role_key, role_label, status_key, status_label, pole_key, pole_label, secondary_poles, bio_short, display_order, is_visible, is_archived, created_at, updated_at, members(id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active)";
  private readonly selectWithoutSecondary =
    "id, member_id, role_key, role_label, status_key, status_label, pole_key, pole_label, bio_short, display_order, is_visible, is_archived, created_at, updated_at, members(id, twitch_login, display_name, discord_id, discord_username, twitch_status, role, is_active)";

  private isSecondaryPolesMissing(error: unknown): boolean {
    const message = String((error as { message?: string })?.message || error || "").toLowerCase();
    return message.includes("secondary_poles") && (message.includes("column") || message.includes("does not exist"));
  }

  async listAll(includeArchived = true): Promise<OrgChartEntry[]> {
    const runQuery = async (selectClause: string) => {
      let query = supabaseAdmin
        .from(this.table)
        .select(selectClause)
        .order("display_order", { ascending: true })
        .order("updated_at", { ascending: false });

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }
      return query;
    };

    const first = await runQuery(this.selectWithSecondary);
    if (!first.error) {
      return (first.data || []).map((row) => mapEntry(row as unknown as OrgChartDbRow));
    }

    if (!this.isSecondaryPolesMissing(first.error)) {
      throw first.error;
    }

    const fallback = await runQuery(this.selectWithoutSecondary);
    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((row) => mapEntry(row as unknown as OrgChartDbRow));
  }

  async listPublic(): Promise<OrgChartEntry[]> {
    const withSecondary = await supabaseAdmin
      .from(this.table)
      .select(this.selectWithSecondary)
      .eq("is_visible", true)
      .eq("is_archived", false)
      .order("display_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (!withSecondary.error) {
      return (withSecondary.data || []).map((row) => mapEntry(row as unknown as OrgChartDbRow));
    }

    if (!this.isSecondaryPolesMissing(withSecondary.error)) {
      throw withSecondary.error;
    }

    const fallback = await supabaseAdmin
      .from(this.table)
      .select(this.selectWithoutSecondary)
      .eq("is_visible", true)
      .eq("is_archived", false)
      .order("display_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((row) => mapEntry(row as unknown as OrgChartDbRow));
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
      secondary_poles: normalizeSecondaryPoles(input.secondaryPoleKeys, input.poleKey),
      bio_short: (input.bioShort || "").trim(),
      display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
      is_visible: input.isVisible !== false,
      is_archived: input.isArchived === true,
      updated_at: new Date().toISOString(),
    };

    const withSecondary = await supabaseAdmin
      .from(this.table)
      .upsert(payload, { onConflict: "member_id" })
      .select(this.selectWithSecondary)
      .single();

    if (!withSecondary.error) {
      return mapEntry(withSecondary.data as unknown as OrgChartDbRow);
    }

    if (!this.isSecondaryPolesMissing(withSecondary.error)) {
      throw withSecondary.error;
    }

    const legacyPayload = { ...payload } as Record<string, unknown>;
    delete legacyPayload.secondary_poles;

    const fallback = await supabaseAdmin
      .from(this.table)
      .upsert(legacyPayload, { onConflict: "member_id" })
      .select(this.selectWithoutSecondary)
      .single();

    if (fallback.error) throw fallback.error;
    return mapEntry(fallback.data as unknown as OrgChartDbRow);
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
    return (data || []).map((row) => mapMemberRef(row as OrgChartDbRow["members"]));
  }
}

export const staffOrgChartRepository = new StaffOrgChartRepository();
