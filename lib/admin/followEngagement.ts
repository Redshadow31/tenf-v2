import { memberRepository } from "@/lib/repositories";
import {
  getLinkedTwitchAccountByDiscordId,
  getValidLinkedTwitchAccessToken,
  type LinkedTwitchAccountPublic,
} from "@/lib/twitchLinkedAccount";
import type { MemberData } from "@/lib/memberData";
import { supabaseAdmin } from "@/lib/db/supabase";

const MAX_ACTIVE_MEMBERS_PAGES = 100;
const ACTIVE_MEMBERS_PAGE_SIZE = 1000;
const MAX_TWITCH_PAGINATION_PAGES = 30;
const TWITCH_PAGE_SIZE = 100;
const FOLLOW_COMPUTE_CONCURRENCY = 4;
const TWITCH_LOGIN_REGEX = /^[a-zA-Z0-9_]{3,25}$/;
const SNAPSHOT_METADATA_WINDOW = 400;
const SNAPSHOT_MEMBERS_FALLBACK_LIMIT = 50000;

export type FollowCalculationState = "ok" | "not_linked" | "calculation_impossible";

export type FollowEngagementOverviewRow = {
  discordId: string | null;
  displayName: string;
  memberTwitchLogin: string;
  linkedTwitchLogin: string | null;
  linkedTwitchDisplayName: string | null;
  followedCount: number | null;
  totalActiveTenfChannels: number;
  followRate: number | null;
  lastCalculatedAt: string | null;
  state: FollowCalculationState;
  reason: string | null;
  snapshotId?: string;
  snapshotGeneratedAt?: string;
  isStaleFromPreviousSnapshot?: boolean;
  previousFollowRate?: number | null;
  deltaFollowRate?: number | null;
};

export type FollowEngagementOverviewResponse = {
  snapshotId: string | null;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  totalActiveTenfChannels: number;
  trackedMembersCount: number;
  rows: FollowEngagementOverviewRow[];
  previousSnapshotId?: string | null;
  previousGeneratedAt?: string | null;
};

export type FollowEngagementDetailChannel = {
  twitchLogin: string;
  twitchId: string | null;
  displayName: string;
  isOwnChannel: boolean;
};

export type FollowEngagementDetailResponse = {
  snapshotId: string;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  state: FollowCalculationState;
  reason: string | null;
  member: {
    discordId: string | null;
    displayName: string;
    memberTwitchLogin: string;
    linkedTwitchLogin: string | null;
    linkedTwitchDisplayName: string | null;
  };
  totals: {
    followedCount: number | null;
    totalActiveTenfChannels: number;
    followRate: number | null;
  };
  followedChannels: FollowEngagementDetailChannel[];
  notFollowedChannels: FollowEngagementDetailChannel[];
  lastCalculatedAt: string | null;
};

type SnapshotMeta = {
  id: string;
  generated_at: string;
  source_data_retrieved_at: string | null;
  total_active_tenf_channels: number;
  tracked_members_count: number;
};

type TenfChannel = {
  discordId: string | null;
  displayName: string;
  twitchLogin: string;
  twitchId: string | null;
};

type FollowedSets = {
  ids: Set<string>;
  logins: Set<string>;
};

type ComputedMemberSnapshot = {
  row: FollowEngagementOverviewRow;
  followedChannels: FollowEngagementDetailChannel[];
  notFollowedChannels: FollowEngagementDetailChannel[];
};

type SnapshotHistoryEntry = {
  row: any;
  snapshot: SnapshotMeta;
};

const SNAPSHOTS_TABLE = "follow_engagement_snapshots";
const SNAPSHOT_MEMBERS_TABLE = "follow_engagement_snapshot_members";
const SNAPSHOT_MEMBER_CHANNELS_TABLE = "follow_engagement_snapshot_member_channels";

function normalizeTwitchLogin(login: string | null | undefined): string | null {
  if (!login) return null;
  const normalized = String(login).trim().toLowerCase();
  if (!normalized) return null;
  return TWITCH_LOGIN_REGEX.test(normalized) ? normalized : null;
}

function memberToTenfChannel(member: MemberData): TenfChannel | null {
  const login = normalizeTwitchLogin(member.twitchLogin);
  if (!member.isActive || !login) return null;

  return {
    discordId: member.discordId || null,
    displayName: member.displayName || login,
    twitchLogin: login,
    twitchId: member.twitchId ? String(member.twitchId) : null,
  };
}

async function listActiveTenfChannels(): Promise<{
  channels: TenfChannel[];
  activeMembersCount: number;
}> {
  const channels: TenfChannel[] = [];
  let activeMembersCount = 0;

  for (let page = 0; page < MAX_ACTIVE_MEMBERS_PAGES; page++) {
    const offset = page * ACTIVE_MEMBERS_PAGE_SIZE;
    const chunk = await memberRepository.findActive(ACTIVE_MEMBERS_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    activeMembersCount += chunk.length;

    for (const member of chunk) {
      const channel = memberToTenfChannel(member);
      if (!channel) continue;
      channels.push(channel);
    }

    if (chunk.length < ACTIVE_MEMBERS_PAGE_SIZE) break;
  }

  return { channels, activeMembersCount };
}

async function fetchAllFollowedChannels(
  accessToken: string,
  twitchUserId: string
): Promise<FollowedSets> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID non configure");
  }

  const ids = new Set<string>();
  const logins = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < MAX_TWITCH_PAGINATION_PAGES; page++) {
    const url = new URL("https://api.twitch.tv/helix/channels/followed");
    url.searchParams.set("user_id", twitchUserId);
    url.searchParams.set("first", String(TWITCH_PAGE_SIZE));
    if (cursor) url.searchParams.set("after", cursor);

    const response = await fetch(url.toString(), {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Twitch API channels/followed HTTP ${response.status} ${details}`);
    }

    const body = (await response.json()) as {
      data?: Array<{
        broadcaster_id?: string;
        broadcaster_login?: string;
      }>;
      pagination?: { cursor?: string };
    };

    const followed = Array.isArray(body.data) ? body.data : [];
    for (const channel of followed) {
      if (channel.broadcaster_id) ids.add(String(channel.broadcaster_id));
      const normalized = normalizeTwitchLogin(channel.broadcaster_login);
      if (normalized) logins.add(normalized);
    }

    const nextCursor = body.pagination?.cursor;
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return { ids, logins };
}

function channelIsFollowedByMember(
  channel: TenfChannel,
  linked: LinkedTwitchAccountPublic,
  followedSets: FollowedSets
): boolean {
  const ownById = Boolean(channel.twitchId && linked.twitchUserId && channel.twitchId === linked.twitchUserId);
  const ownByLogin =
    Boolean(linked.twitchLogin) &&
    channel.twitchLogin === normalizeTwitchLogin(linked.twitchLogin);
  if (ownById || ownByLogin) return true;

  if (channel.twitchId && followedSets.ids.has(channel.twitchId)) return true;
  return followedSets.logins.has(channel.twitchLogin);
}

async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runOne(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runOne());
  await Promise.all(runners);
  return results;
}

async function computeMemberOverviewRow(
  member: TenfChannel,
  allChannels: TenfChannel[],
  generatedAtIso: string
): Promise<ComputedMemberSnapshot> {
  if (!member.discordId) {
    const row: FollowEngagementOverviewRow = {
      discordId: null,
      displayName: member.displayName,
      memberTwitchLogin: member.twitchLogin,
      linkedTwitchLogin: null,
      linkedTwitchDisplayName: null,
      followedCount: null,
      totalActiveTenfChannels: allChannels.length,
      followRate: null,
      lastCalculatedAt: null,
      state: "calculation_impossible",
      reason: "missing_discord_id",
    };
    return { row, followedChannels: [], notFollowedChannels: [] };
  }

  const linked = await getLinkedTwitchAccountByDiscordId(member.discordId);
  if (!linked) {
    const row: FollowEngagementOverviewRow = {
      discordId: member.discordId,
      displayName: member.displayName,
      memberTwitchLogin: member.twitchLogin,
      linkedTwitchLogin: null,
      linkedTwitchDisplayName: null,
      followedCount: null,
      totalActiveTenfChannels: allChannels.length,
      followRate: null,
      lastCalculatedAt: null,
      state: "not_linked",
      reason: "no_linked_twitch_account",
    };
    return { row, followedChannels: [], notFollowedChannels: [] };
  }

  const validToken = await getValidLinkedTwitchAccessToken(member.discordId);
  if (!validToken?.accessToken) {
    const row: FollowEngagementOverviewRow = {
      discordId: member.discordId,
      displayName: member.displayName,
      memberTwitchLogin: member.twitchLogin,
      linkedTwitchLogin: linked.twitchLogin,
      linkedTwitchDisplayName: linked.twitchDisplayName,
      followedCount: null,
      totalActiveTenfChannels: allChannels.length,
      followRate: null,
      lastCalculatedAt: null,
      state: "calculation_impossible",
      reason: "token_unavailable",
    };
    return { row, followedChannels: [], notFollowedChannels: [] };
  }

  try {
    const followedSets = await fetchAllFollowedChannels(
      validToken.accessToken,
      validToken.twitchUserId
    );

    let followedCount = 0;
    const followedChannels: FollowEngagementDetailChannel[] = [];
    const notFollowedChannels: FollowEngagementDetailChannel[] = [];
    for (const channel of allChannels) {
      const isOwnChannel =
        (Boolean(channel.twitchId && linked.twitchUserId) &&
          channel.twitchId === linked.twitchUserId) ||
        channel.twitchLogin === normalizeTwitchLogin(linked.twitchLogin);
      const item: FollowEngagementDetailChannel = {
        twitchLogin: channel.twitchLogin,
        twitchId: channel.twitchId,
        displayName: channel.displayName,
        isOwnChannel,
      };
      if (channelIsFollowedByMember(channel, linked, followedSets)) {
        followedCount++;
        followedChannels.push(item);
      } else {
        notFollowedChannels.push(item);
      }
    }

    const followRate =
      allChannels.length > 0
        ? Number(((followedCount / allChannels.length) * 100).toFixed(1))
        : 0;

    const row: FollowEngagementOverviewRow = {
      discordId: member.discordId,
      displayName: member.displayName,
      memberTwitchLogin: member.twitchLogin,
      linkedTwitchLogin: linked.twitchLogin,
      linkedTwitchDisplayName: linked.twitchDisplayName,
      followedCount,
      totalActiveTenfChannels: allChannels.length,
      followRate,
      lastCalculatedAt: generatedAtIso,
      state: "ok",
      reason: null,
    };
    return { row, followedChannels, notFollowedChannels };
  } catch (_error) {
    const row: FollowEngagementOverviewRow = {
      discordId: member.discordId,
      displayName: member.displayName,
      memberTwitchLogin: member.twitchLogin,
      linkedTwitchLogin: linked.twitchLogin,
      linkedTwitchDisplayName: linked.twitchDisplayName,
      followedCount: null,
      totalActiveTenfChannels: allChannels.length,
      followRate: null,
      lastCalculatedAt: null,
      state: "calculation_impossible",
      reason: "twitch_api_error",
    };
    return { row, followedChannels: [], notFollowedChannels: [] };
  }
}

async function computeSnapshotPayload(): Promise<{
  generatedAt: string;
  sourceDataRetrievedAt: string;
  totalActiveTenfChannels: number;
  trackedMembersCount: number;
  rows: ComputedMemberSnapshot[];
}> {
  const generatedAtIso = new Date().toISOString();
  const { channels, activeMembersCount } = await listActiveTenfChannels();

  const rows = await withConcurrency(
    channels,
    FOLLOW_COMPUTE_CONCURRENCY,
    async (member) => computeMemberOverviewRow(member, channels, generatedAtIso)
  );

  rows.sort((a, b) => {
    const aRate = a.row.followRate ?? -1;
    const bRate = b.row.followRate ?? -1;
    if (bRate !== aRate) return bRate - aRate;
    return a.row.displayName.localeCompare(b.row.displayName, "fr");
  });

  return {
    generatedAt: generatedAtIso,
    sourceDataRetrievedAt: generatedAtIso,
    totalActiveTenfChannels: channels.length,
    trackedMembersCount: activeMembersCount,
    rows,
  };
}

async function getLatestCalculatedRowsForLogins(
  logins: string[]
): Promise<Map<string, { row: any; snapshotId: string }>> {
  const latestByLogin = new Map<string, { row: any; snapshotId: string }>();
  if (!Array.isArray(logins) || logins.length === 0) {
    return latestByLogin;
  }

  const normalizedUniqueLogins = Array.from(
    new Set(logins.map((login) => normalizeTwitchLogin(login)).filter(Boolean) as string[])
  );
  if (normalizedUniqueLogins.length === 0) {
    return latestByLogin;
  }

  const CHUNK_SIZE = 200;
  const PAGE_SIZE = 1000;
  const MAX_PAGES_PER_CHUNK = Math.max(1, Math.floor(SNAPSHOT_MEMBERS_FALLBACK_LIMIT / PAGE_SIZE));

  for (let i = 0; i < normalizedUniqueLogins.length; i += CHUNK_SIZE) {
    const chunk = normalizedUniqueLogins.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;

    for (let page = 0; page < MAX_PAGES_PER_CHUNK; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabaseAdmin
        .from(SNAPSHOT_MEMBERS_TABLE)
        .select(
          "snapshot_id, discord_id, display_name, member_twitch_login, linked_twitch_login, linked_twitch_display_name, followed_count, total_active_tenf_channels, follow_rate, state, reason, last_checked_at, created_at"
        )
        .in("member_twitch_login", chunk)
        .eq("state", "ok")
        .not("follow_rate", "is", null)
        .not("followed_count", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        break;
      }

      for (const row of data) {
        const login = normalizeTwitchLogin(row.member_twitch_login);
        if (!login || latestByLogin.has(login)) continue;
        latestByLogin.set(login, {
          row,
          snapshotId: String(row.snapshot_id || ""),
        });
      }

      if (chunk.every((login) => latestByLogin.has(login))) {
        break;
      }
      if (data.length < PAGE_SIZE) {
        break;
      }
    }
  }

  return latestByLogin;
}

export async function createFollowEngagementSnapshot(
  generatedByDiscordId: string | null
): Promise<FollowEngagementOverviewResponse> {
  const computed = await computeSnapshotPayload();

  const { data: snapshotRow, error: snapshotError } = await supabaseAdmin
    .from(SNAPSHOTS_TABLE)
    .insert({
      generated_at: computed.generatedAt,
      source_data_retrieved_at: computed.sourceDataRetrievedAt,
      total_active_tenf_channels: computed.totalActiveTenfChannels,
      tracked_members_count: computed.trackedMembersCount,
      generated_by_discord_id: generatedByDiscordId,
      status: "completed",
    })
    .select("id")
    .single();

  if (snapshotError || !snapshotRow?.id) {
    throw snapshotError || new Error("Impossible de creer le snapshot follow");
  }

  const membersInsert = computed.rows.map((entry) => ({
    snapshot_id: snapshotRow.id,
    discord_id: entry.row.discordId,
    display_name: entry.row.displayName,
    member_twitch_login: entry.row.memberTwitchLogin,
    linked_twitch_login: entry.row.linkedTwitchLogin,
    linked_twitch_display_name: entry.row.linkedTwitchDisplayName,
    followed_count: entry.row.followedCount,
    total_active_tenf_channels: entry.row.totalActiveTenfChannels,
    follow_rate: entry.row.followRate,
    state: entry.row.state,
    reason: entry.row.reason,
    last_checked_at: entry.row.lastCalculatedAt,
  }));

  const { data: insertedMembers, error: membersError } = await supabaseAdmin
    .from(SNAPSHOT_MEMBERS_TABLE)
    .insert(membersInsert)
    .select("id, member_twitch_login");

  if (membersError) throw membersError;

  const memberIdByLogin = new Map<string, string>();
  for (const row of insertedMembers || []) {
    if (row.id && row.member_twitch_login) {
      memberIdByLogin.set(String(row.member_twitch_login).toLowerCase(), String(row.id));
    }
  }

  const channelsInsert: Array<{
    snapshot_member_id: string;
    twitch_login: string;
    twitch_id: string | null;
    display_name: string;
    is_followed: boolean;
    is_own_channel: boolean;
  }> = [];

  for (const entry of computed.rows) {
    const snapshotMemberId = memberIdByLogin.get(entry.row.memberTwitchLogin.toLowerCase());
    if (!snapshotMemberId) continue;

    for (const channel of entry.followedChannels) {
      channelsInsert.push({
        snapshot_member_id: snapshotMemberId,
        twitch_login: channel.twitchLogin,
        twitch_id: channel.twitchId,
        display_name: channel.displayName,
        is_followed: true,
        is_own_channel: channel.isOwnChannel,
      });
    }
    for (const channel of entry.notFollowedChannels) {
      channelsInsert.push({
        snapshot_member_id: snapshotMemberId,
        twitch_login: channel.twitchLogin,
        twitch_id: channel.twitchId,
        display_name: channel.displayName,
        is_followed: false,
        is_own_channel: channel.isOwnChannel,
      });
    }
  }

  if (channelsInsert.length > 0) {
    const { error: channelsError } = await supabaseAdmin
      .from(SNAPSHOT_MEMBER_CHANNELS_TABLE)
      .insert(channelsInsert);
    if (channelsError) throw channelsError;
  }

  return {
    snapshotId: snapshotRow.id,
    generatedAt: computed.generatedAt,
    sourceDataRetrievedAt: computed.sourceDataRetrievedAt,
    totalActiveTenfChannels: computed.totalActiveTenfChannels,
    trackedMembersCount: computed.trackedMembersCount,
    rows: computed.rows.map((entry) => entry.row),
  };
}

export async function getLatestFollowEngagementOverview(): Promise<FollowEngagementOverviewResponse | null> {
  const { data: snapshots, error: snapshotError } = await supabaseAdmin
    .from(SNAPSHOTS_TABLE)
    .select("id, generated_at, source_data_retrieved_at, total_active_tenf_channels, tracked_members_count")
    .order("generated_at", { ascending: false })
    .limit(SNAPSHOT_METADATA_WINDOW);

  if (snapshotError) throw snapshotError;
  const latestSnapshot = snapshots?.[0] as SnapshotMeta | undefined;
  const previousSnapshot = snapshots?.[1] as SnapshotMeta | undefined;
  if (!latestSnapshot?.id) return null;

  let activeMembersCount = Number(latestSnapshot.tracked_members_count || 0);
  const activeChannelByLogin = new Map<string, TenfChannel>();
  try {
    const activeData = await listActiveTenfChannels();
    activeMembersCount = activeData.activeMembersCount;
    for (const channel of activeData.channels) {
      if (!activeChannelByLogin.has(channel.twitchLogin)) {
        activeChannelByLogin.set(channel.twitchLogin, channel);
      }
    }
  } catch (error) {
    console.warn("[Follow Overview] Echec scan membres actifs, fallback snapshots uniquement:", error);
  }

  const snapshotIds = (snapshots || []).map((snapshot: any) => String(snapshot.id)).filter(Boolean);
  const { data: snapshotRows, error: rowsError } = await supabaseAdmin
    .from(SNAPSHOT_MEMBERS_TABLE)
    .select("*")
    .in("snapshot_id", snapshotIds)
    .order("follow_rate", { ascending: false, nullsFirst: false });

  if (rowsError) throw rowsError;

  const snapshotMetaById = new Map<string, SnapshotMeta>();
  for (const snapshot of snapshots || []) {
    snapshotMetaById.set(String((snapshot as any).id), snapshot as SnapshotMeta);
  }

  const rowsBySnapshotId = new Map<string, any[]>();
  for (const row of snapshotRows || []) {
    const snapshotId = String(row.snapshot_id || "");
    if (!snapshotId) continue;
    const list = rowsBySnapshotId.get(snapshotId) || [];
    list.push(row);
    rowsBySnapshotId.set(snapshotId, list);
  }

  const historyByLogin = new Map<string, SnapshotHistoryEntry[]>();
  for (const snapshot of snapshots || []) {
    const snapshotId = String((snapshot as any).id);
    const rowsForSnapshot = rowsBySnapshotId.get(snapshotId) || [];
    for (const row of rowsForSnapshot) {
      const login = String(row.member_twitch_login || "").toLowerCase();
      if (!login) continue;
      const history = historyByLogin.get(login) || [];
      history.push({ row, snapshot: snapshot as SnapshotMeta });
      historyByLogin.set(login, history);
    }
  }

  const targetLogins = new Set<string>();
  if (activeChannelByLogin.size > 0) {
    for (const login of activeChannelByLogin.keys()) targetLogins.add(login);
  } else {
    for (const login of historyByLogin.keys()) targetLogins.add(login);
  }

  const fallbackCandidateLogins: string[] = [];
  const hasUsableCalculatedValue = (row: any): boolean =>
    row?.state === "ok" &&
    row?.follow_rate !== null &&
    row?.follow_rate !== undefined &&
    row?.followed_count !== null &&
    row?.followed_count !== undefined;

  for (const login of targetLogins) {
    const history = historyByLogin.get(login) || [];
    const latestEntry = history[0] || null;
    if (!latestEntry || !hasUsableCalculatedValue(latestEntry.row)) {
      fallbackCandidateLogins.push(login);
    }
  }

  let latestCalculatedByLogin = new Map<string, { row: any; snapshotId: string }>();
  if (fallbackCandidateLogins.length > 0) {
    try {
      latestCalculatedByLogin = await getLatestCalculatedRowsForLogins(fallbackCandidateLogins);
    } catch (error) {
      console.warn("[Follow Overview] Echec lecture historique calcule, fallback partiel:", error);
    }
  }

  const missingSnapshotIds = Array.from(
    new Set(
      Array.from(latestCalculatedByLogin.values())
        .map((entry) => entry.snapshotId)
        .filter((snapshotId) => snapshotId && !snapshotMetaById.has(snapshotId))
    )
  );
  if (missingSnapshotIds.length > 0) {
    for (let i = 0; i < missingSnapshotIds.length; i += 200) {
      const chunk = missingSnapshotIds.slice(i, i + 200);
      const { data: chunkSnapshots, error: chunkSnapshotsError } = await supabaseAdmin
        .from(SNAPSHOTS_TABLE)
        .select("id, generated_at, source_data_retrieved_at, total_active_tenf_channels, tracked_members_count")
        .in("id", chunk);
      if (chunkSnapshotsError) throw chunkSnapshotsError;
      for (const snapshot of chunkSnapshots || []) {
        snapshotMetaById.set(String((snapshot as any).id), snapshot as SnapshotMeta);
      }
    }
  }

  const toRate = (value: any): number | null => {
    if (typeof value === "number") return Number(value);
    if (value !== null && value !== undefined) return Number(value);
    return null;
  };

  const mergedRows: FollowEngagementOverviewRow[] = [];
  for (const login of targetLogins) {
    const history = historyByLogin.get(login) || [];
    const latestEntry = history[0] || null;
    const activeChannel = activeChannelByLogin.get(login) || null;

    const latestCalculatedEntry = history.find((entry) => hasUsableCalculatedValue(entry.row)) || null;
    const latestCalculatedGlobal = latestCalculatedByLogin.get(login);
    const latestCalculatedGlobalSnapshot = latestCalculatedGlobal?.snapshotId
      ? snapshotMetaById.get(latestCalculatedGlobal.snapshotId)
      : undefined;
    const latestCalculatedGlobalEntry =
      latestCalculatedGlobal && latestCalculatedGlobalSnapshot
        ? { row: latestCalculatedGlobal.row, snapshot: latestCalculatedGlobalSnapshot }
        : null;
    const latestCalculatedAnyEntry = latestCalculatedEntry || latestCalculatedGlobalEntry;

    const shouldFallbackToLatestCalculated = latestEntry?.row?.state === "not_linked" && Boolean(latestCalculatedAnyEntry);
    const shouldFallbackForUnusableLatest =
      (!latestEntry || !hasUsableCalculatedValue(latestEntry.row)) && Boolean(latestCalculatedAnyEntry);

    let sourceEntry: SnapshotHistoryEntry | null = null;
    if (latestEntry) {
      sourceEntry =
        shouldFallbackToLatestCalculated || shouldFallbackForUnusableLatest
        ? (latestCalculatedAnyEntry as { row: any; snapshot: SnapshotMeta })
        : latestEntry;
    } else if (latestCalculatedAnyEntry) {
      sourceEntry = latestCalculatedAnyEntry as { row: any; snapshot: SnapshotMeta };
    }

    if (!sourceEntry) {
      if (!activeChannel) continue;
      mergedRows.push({
        discordId: activeChannel.discordId,
        displayName: activeChannel.displayName,
        memberTwitchLogin: activeChannel.twitchLogin,
        linkedTwitchLogin: null,
        linkedTwitchDisplayName: null,
        followedCount: null,
        totalActiveTenfChannels: Number(latestSnapshot.total_active_tenf_channels || 0),
        followRate: null,
        lastCalculatedAt: null,
        state: "calculation_impossible",
        reason: "missing_snapshot_row",
        snapshotId: String(latestSnapshot.id),
        snapshotGeneratedAt: String(latestSnapshot.generated_at),
        isStaleFromPreviousSnapshot: false,
        previousFollowRate: null,
        deltaFollowRate: null,
      });
      continue;
    }

    const source = sourceEntry.row;
    const sourceSnapshot = sourceEntry.snapshot;
    const previousRate = toRate(history[1]?.row?.follow_rate);
    const currentRate = toRate(source.follow_rate);
    const isStaleFromHistory = String(sourceSnapshot.id) !== String(latestSnapshot.id);

    mergedRows.push({
      discordId: source.discord_id || activeChannel?.discordId || null,
      displayName: String(source.display_name || activeChannel?.displayName || login),
      memberTwitchLogin: String(source.member_twitch_login || login).toLowerCase(),
      linkedTwitchLogin: source.linked_twitch_login ? String(source.linked_twitch_login).toLowerCase() : null,
      linkedTwitchDisplayName: source.linked_twitch_display_name || null,
      followedCount: typeof source.followed_count === "number" ? source.followed_count : null,
      totalActiveTenfChannels: Number(source.total_active_tenf_channels || 0),
      followRate: currentRate,
      lastCalculatedAt: source.last_checked_at || null,
      state: source.state as FollowCalculationState,
      reason: source.reason || null,
      snapshotId: String(sourceSnapshot.id),
      snapshotGeneratedAt: String(sourceSnapshot.generated_at),
      isStaleFromPreviousSnapshot: isStaleFromHistory,
      previousFollowRate: previousRate ?? null,
      deltaFollowRate:
        currentRate !== null && previousRate !== null ? Number((currentRate - previousRate).toFixed(1)) : null,
    });
  }

  mergedRows.sort((a, b) => {
    const aRate = a.followRate ?? -1;
    const bRate = b.followRate ?? -1;
    if (bRate !== aRate) return bRate - aRate;
    return a.displayName.localeCompare(b.displayName, "fr");
  });

  return {
    snapshotId: String(latestSnapshot.id),
    generatedAt: String(latestSnapshot.generated_at),
    sourceDataRetrievedAt: String(latestSnapshot.source_data_retrieved_at || latestSnapshot.generated_at),
    totalActiveTenfChannels: Number(latestSnapshot.total_active_tenf_channels || 0),
    trackedMembersCount: activeMembersCount,
    rows: mergedRows,
    previousSnapshotId: previousSnapshot ? String(previousSnapshot.id) : null,
    previousGeneratedAt: previousSnapshot ? String(previousSnapshot.generated_at) : null,
  };
}

export async function buildFollowEngagementOverview(): Promise<FollowEngagementOverviewResponse> {
  const latest = await getLatestFollowEngagementOverview();
  if (latest) return latest;

  const computed = await computeSnapshotPayload();
  return {
    snapshotId: null,
    generatedAt: computed.generatedAt,
    sourceDataRetrievedAt: computed.sourceDataRetrievedAt,
    totalActiveTenfChannels: computed.totalActiveTenfChannels,
    trackedMembersCount: computed.trackedMembersCount,
    rows: computed.rows.map((entry) => entry.row),
  };
}

export async function buildFollowEngagementMemberDetail(
  discordId: string,
  snapshotId?: string | null
): Promise<FollowEngagementDetailResponse | null> {
  const snapshotQuery = supabaseAdmin
    .from(SNAPSHOTS_TABLE)
    .select("id, generated_at, source_data_retrieved_at");

  const { data: snapshot, error: snapshotError } = snapshotId
    ? await snapshotQuery.eq("id", snapshotId).maybeSingle()
    : await snapshotQuery.order("generated_at", { ascending: false }).limit(1).maybeSingle();

  if (snapshotError) throw snapshotError;
  if (!snapshot?.id) return null;

  const { data: memberRow, error: memberError } = await supabaseAdmin
    .from(SNAPSHOT_MEMBERS_TABLE)
    .select("*")
    .eq("snapshot_id", snapshot.id)
    .eq("discord_id", discordId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!memberRow) return null;

  const { data: channelsRows, error: channelsError } = await supabaseAdmin
    .from(SNAPSHOT_MEMBER_CHANNELS_TABLE)
    .select("twitch_login, twitch_id, display_name, is_followed, is_own_channel")
    .eq("snapshot_member_id", memberRow.id)
    .order("display_name", { ascending: true });

  if (channelsError) throw channelsError;

  const followedChannels: FollowEngagementDetailChannel[] = [];
  const notFollowedChannels: FollowEngagementDetailChannel[] = [];
  for (const channel of channelsRows || []) {
    const item: FollowEngagementDetailChannel = {
      twitchLogin: String(channel.twitch_login || "").toLowerCase(),
      twitchId: channel.twitch_id ? String(channel.twitch_id) : null,
      displayName: String(channel.display_name || channel.twitch_login || ""),
      isOwnChannel: Boolean(channel.is_own_channel),
    };
    if (channel.is_followed) followedChannels.push(item);
    else notFollowedChannels.push(item);
  }

  return {
    snapshotId: String(snapshot.id),
    generatedAt: String(snapshot.generated_at),
    sourceDataRetrievedAt: String(snapshot.source_data_retrieved_at || snapshot.generated_at),
    state: memberRow.state as FollowCalculationState,
    reason: memberRow.reason || null,
    member: {
      discordId: memberRow.discord_id || null,
      displayName: String(memberRow.display_name || ""),
      memberTwitchLogin: String(memberRow.member_twitch_login || "").toLowerCase(),
      linkedTwitchLogin: memberRow.linked_twitch_login
        ? String(memberRow.linked_twitch_login).toLowerCase()
        : null,
      linkedTwitchDisplayName: memberRow.linked_twitch_display_name || null,
    },
    totals: {
      followedCount:
        typeof memberRow.followed_count === "number" ? memberRow.followed_count : null,
      totalActiveTenfChannels: Number(memberRow.total_active_tenf_channels || 0),
      followRate:
        typeof memberRow.follow_rate === "number"
          ? Number(memberRow.follow_rate)
          : memberRow.follow_rate !== null && memberRow.follow_rate !== undefined
            ? Number(memberRow.follow_rate)
            : null,
    },
    followedChannels,
    notFollowedChannels,
    lastCalculatedAt: memberRow.last_checked_at || null,
  };
}
