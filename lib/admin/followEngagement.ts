import { memberRepository } from "@/lib/repositories";
import {
  getLinkedTwitchAccountByDiscordId,
  getValidLinkedTwitchAccessToken,
  type LinkedTwitchAccountPublic,
} from "@/lib/twitchLinkedAccount";
import type { MemberData } from "@/lib/memberData";
import { supabaseAdmin } from "@/lib/db/supabase";

const MAX_ACTIVE_MEMBERS_PAGES = 10;
const ACTIVE_MEMBERS_PAGE_SIZE = 1000;
const MAX_TWITCH_PAGINATION_PAGES = 30;
const TWITCH_PAGE_SIZE = 100;
const FOLLOW_COMPUTE_CONCURRENCY = 4;
const TWITCH_LOGIN_REGEX = /^[a-zA-Z0-9_]{3,25}$/;

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
};

export type FollowEngagementOverviewResponse = {
  snapshotId: string | null;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  totalActiveTenfChannels: number;
  trackedMembersCount: number;
  rows: FollowEngagementOverviewRow[];
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
  if (member.profileValidationStatus !== "valide") return null;

  return {
    discordId: member.discordId || null,
    displayName: member.displayName || login,
    twitchLogin: login,
    twitchId: member.twitchId ? String(member.twitchId) : null,
  };
}

async function listActiveTenfChannels(): Promise<TenfChannel[]> {
  const channels: TenfChannel[] = [];

  for (let page = 0; page < MAX_ACTIVE_MEMBERS_PAGES; page++) {
    const offset = page * ACTIVE_MEMBERS_PAGE_SIZE;
    const chunk = await memberRepository.findActive(ACTIVE_MEMBERS_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;

    for (const member of chunk) {
      const channel = memberToTenfChannel(member);
      if (!channel) continue;
      channels.push(channel);
    }

    if (chunk.length < ACTIVE_MEMBERS_PAGE_SIZE) break;
  }

  return channels;
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
  const channels = await listActiveTenfChannels();

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
    trackedMembersCount: channels.length,
    rows,
  };
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
  const { data: snapshot, error: snapshotError } = await supabaseAdmin
    .from(SNAPSHOTS_TABLE)
    .select("id, generated_at, source_data_retrieved_at, total_active_tenf_channels, tracked_members_count")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) throw snapshotError;
  if (!snapshot?.id) return null;

  const { data: rows, error: rowsError } = await supabaseAdmin
    .from(SNAPSHOT_MEMBERS_TABLE)
    .select("*")
    .eq("snapshot_id", snapshot.id)
    .order("follow_rate", { ascending: false, nullsFirst: false });

  if (rowsError) throw rowsError;

  return {
    snapshotId: String(snapshot.id),
    generatedAt: String(snapshot.generated_at),
    sourceDataRetrievedAt: String(snapshot.source_data_retrieved_at || snapshot.generated_at),
    totalActiveTenfChannels: Number(snapshot.total_active_tenf_channels || 0),
    trackedMembersCount: Number(snapshot.tracked_members_count || 0),
    rows: (rows || []).map((row: any) => ({
      discordId: row.discord_id || null,
      displayName: String(row.display_name || ""),
      memberTwitchLogin: String(row.member_twitch_login || "").toLowerCase(),
      linkedTwitchLogin: row.linked_twitch_login ? String(row.linked_twitch_login).toLowerCase() : null,
      linkedTwitchDisplayName: row.linked_twitch_display_name || null,
      followedCount: typeof row.followed_count === "number" ? row.followed_count : null,
      totalActiveTenfChannels: Number(row.total_active_tenf_channels || 0),
      followRate:
        typeof row.follow_rate === "number"
          ? Number(row.follow_rate)
          : row.follow_rate !== null && row.follow_rate !== undefined
            ? Number(row.follow_rate)
            : null,
      lastCalculatedAt: row.last_checked_at || null,
      state: row.state as FollowCalculationState,
      reason: row.reason || null,
    })),
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
  discordId: string
): Promise<FollowEngagementDetailResponse | null> {
  const { data: snapshot, error: snapshotError } = await supabaseAdmin
    .from(SNAPSHOTS_TABLE)
    .select("id, generated_at, source_data_retrieved_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
