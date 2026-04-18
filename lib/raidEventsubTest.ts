import { getBaseUrl } from '@/lib/config';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { getTwitchUserIdsByLogins } from '@/lib/twitchHelpers';
import {
  deleteEventSubSubscription,
  getEventSubSubscriptions,
  getTwitchOAuthToken,
  TwitchEventSubSubscription,
} from '@/lib/twitchEventSub';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const CONDITION_TYPE = 'to_broadcaster';
const GRACE_PERIOD_MINUTES = 15;
/** Fenêtre de grâce plus large pour le rôle « Nouveau » (membre souvent inactif côté site mais en live Twitch). */
const NOUVEAU_GRACE_PERIOD_MINUTES = 360;
const DROP_NO_RAID_WINDOW_MINUTES = 30;

function isNouveauMemberRole(role: string | null | undefined): boolean {
  return String(role || '').trim() === 'Nouveau';
}

type RaidTestRunStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
type RaidTestSubscriptionStatus = 'pending' | 'active' | 'revoked' | 'failed' | 'expired';

interface RaidTestRunRow {
  id: string;
  label: string;
  status: RaidTestRunStatus;
  started_at: string | null;
  ended_at: string | null;
}

interface EligibleMember {
  discordId: string | null;
  twitchLogin: string;
  twitchId: string;
  wasRecentlyLive: boolean;
  role: string | null;
}

interface SyncResult {
  enabled: boolean;
  runId: string | null;
  created: number;
  revoked: number;
  retained: number;
  liveMembers: number;
  eligibleMembers: number;
  message: string;
}

interface SyncDeclarationsResult {
  runId: string | null;
  synced: number;
  windowDays: number;
  message: string;
}

interface WatchlistMemberRow {
  discordId: string | null;
  twitchLogin: string;
  twitchId: string;
  isLiveNow: boolean;
  wasRecentlyLive: boolean;
  shouldBeTargeted: boolean;
  localSubscriptionStatus: string | null;
  localSubscriptionId: string | null;
  remoteSubscriptionId: string | null;
}

interface WatchlistSnapshot {
  enabled: boolean;
  runId: string | null;
  callbackUrl: string;
  members: WatchlistMemberRow[];
  dropsWithoutRaid: Array<{
    discordId: string | null;
    twitchLogin: string;
    twitchId: string;
    endedWithoutRaid: boolean;
    recentOutgoingRaids: number;
    lastOutgoingRaidAt: string | null;
  }>;
  summary: {
    eligibleMembers: number;
    liveNow: number;
    recentlyLive: number;
    targetedByPolicy: number;
    localSubscriptionsActiveOrPending: number;
    remoteSubscriptionsEnabled: number;
    dropsWithoutRaid: number;
  };
}

interface TwitchRaidEventPayload {
  from_broadcaster_user_id: string;
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  to_broadcaster_user_id: string;
  to_broadcaster_user_login: string;
  to_broadcaster_user_name: string;
  viewers?: number;
}

interface SaveRaidTestEventInput {
  event: TwitchRaidEventPayload;
  eventsubMessageId: string | null;
  eventsubTimestamp: string | null;
  rawPayload: unknown;
}

interface RaiderLiveContext {
  streamStartedAt: string | null;
  liveDurationMinutes: number | null;
}

interface MatchedMember {
  twitchLogin: string;
  twitchId?: string;
  isActive?: boolean;
}

interface EnsureActiveRunResult {
  run: RaidTestRunRow;
  created: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isTestEnabled(): boolean {
  return String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true';
}

function isAutoRunEnabled(): boolean {
  const raw = String(process.env.RAID_EVENTSUB_TEST_AUTO_RUN || '').trim().toLowerCase();
  if (!raw) {
    return true;
  }
  return raw !== 'false' && raw !== '0' && raw !== 'no';
}

function getTestEventsubSecret(): string | null {
  return process.env.TWITCH_EVENTSUB_TEST_SECRET || process.env.TWITCH_EVENTSUB_SECRET || null;
}

function getTestWebhookUrl(): string {
  return `${getBaseUrl()}/api/twitch/eventsub/test`;
}

function buildDedupeKey(fromId: string, toId: string, at: Date): string {
  const minuteBucket = new Date(at);
  minuteBucket.setSeconds(0, 0);
  return `${fromId}:${toId}:${minuteBucket.toISOString()}`;
}

function normalizeLogin(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

async function findRaidTrackedSupabaseMemberByEventIdentity(input: {
  twitchId: string;
  twitchLogin: string;
}): Promise<MatchedMember | null> {
  const normalizedLogin = normalizeLogin(input.twitchLogin);

  if (input.twitchId) {
    const { data: byId, error: byIdError } = await supabaseAdmin
      .from('members')
      .select('twitch_login,twitch_id,is_active')
      .eq('is_archived', false)
      .eq('twitch_id', input.twitchId)
      .limit(1);
    if (byIdError) {
      throw new Error(`[raidEventsubTest] Recherche membre Supabase par twitch_id impossible: ${byIdError.message}`);
    }
    const member = byId?.[0] as any;
    if (member?.twitch_login) {
      return {
        twitchLogin: String(member.twitch_login),
        twitchId: member.twitch_id ? String(member.twitch_id) : undefined,
        isActive: member.is_active === true,
      };
    }
  }

  if (normalizedLogin) {
    const { data: byLogin, error: byLoginError } = await supabaseAdmin
      .from('members')
      .select('twitch_login,twitch_id,is_active')
      .eq('is_archived', false)
      .eq('twitch_login', normalizedLogin)
      .limit(1);
    if (byLoginError) {
      throw new Error(
        `[raidEventsubTest] Recherche membre Supabase par twitch_login impossible: ${byLoginError.message}`
      );
    }
    const member = byLogin?.[0] as any;
    if (member?.twitch_login) {
      return {
        twitchLogin: String(member.twitch_login),
        twitchId: member.twitch_id ? String(member.twitch_id) : undefined,
        isActive: member.is_active === true,
      };
    }
  }

  return null;
}

async function getExistingActiveLocalSubscriptionId(
  runId: string,
  monitoredTwitchId: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('raid_test_subscriptions')
    .select('id')
    .eq('run_id', runId)
    .eq('monitored_twitch_id', monitoredTwitchId)
    .eq('condition_type', CONDITION_TYPE)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible de lire les subscriptions locales: ${error.message}`);
  }

  return data?.[0]?.id || null;
}

async function markLocalSubscriptionStatus(
  runId: string,
  monitoredTwitchId: string,
  monitoredTwitchLogin: string,
  payload: {
    twitchSubscriptionId?: string | null;
    status: RaidTestSubscriptionStatus;
    revokeReason?: string | null;
    metadata?: Record<string, unknown>;
    monitoredDiscordId?: string | null;
  }
): Promise<void> {
  let existingId: string | null = null;

  // Priorite 1: si Twitch nous donne un subscription_id, l'utiliser pour retrouver la ligne.
  if (payload.twitchSubscriptionId) {
    const { data: bySubId, error: bySubIdError } = await supabaseAdmin
      .from('raid_test_subscriptions')
      .select('id')
      .eq('twitch_subscription_id', payload.twitchSubscriptionId)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (bySubIdError) {
      throw new Error(
        `[raidEventsubTest] Impossible de lire la subscription locale par twitch_subscription_id: ${bySubIdError.message}`
      );
    }
    existingId = bySubId?.[0]?.id || null;
  }

  // Priorite 2: fallback historique par run + monitored_twitch_id.
  if (!existingId) {
    existingId = await getExistingActiveLocalSubscriptionId(runId, monitoredTwitchId);
  }

  const timestamp = nowIso();
  const baseUpdate = {
    run_id: runId,
    monitored_twitch_id: monitoredTwitchId,
    monitored_twitch_login: monitoredTwitchLogin,
    condition_type: CONDITION_TYPE,
    twitch_subscription_id: payload.twitchSubscriptionId ?? null,
    status: payload.status,
    monitored_member_discord_id: payload.monitoredDiscordId ?? null,
    metadata: payload.metadata ?? {},
    updated_at: timestamp,
    last_seen_at: timestamp,
    ...(payload.status === 'active' ? { activated_at: timestamp } : {}),
    ...(payload.status === 'revoked'
      ? { revoked_at: timestamp, revoke_reason: payload.revokeReason || 'sync_cleanup' }
      : {}),
  };

  if (existingId) {
    const { error } = await supabaseAdmin
      .from('raid_test_subscriptions')
      .update(baseUpdate)
      .eq('id', existingId);
    if (error) {
      throw new Error(`[raidEventsubTest] Impossible de mettre a jour la subscription locale: ${error.message}`);
    }
    return;
  }

  const { error } = await supabaseAdmin
    .from('raid_test_subscriptions')
    .insert({
      run_id: runId,
      twitch_subscription_id: payload.twitchSubscriptionId ?? null,
      monitored_member_discord_id: payload.monitoredDiscordId ?? null,
      monitored_twitch_id: monitoredTwitchId,
      monitored_twitch_login: monitoredTwitchLogin,
      condition_type: CONDITION_TYPE,
      status: payload.status,
      metadata: payload.metadata ?? {},
      created_at: timestamp,
      updated_at: timestamp,
      last_seen_at: timestamp,
      ...(payload.status === 'active' ? { activated_at: timestamp } : {}),
      ...(payload.status === 'revoked'
        ? { revoked_at: timestamp, revoke_reason: payload.revokeReason || 'sync_cleanup' }
        : {}),
    });

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible d inserer la subscription locale: ${error.message}`);
  }
}

async function fetchLiveTwitchIds(twitchIds: string[]): Promise<Set<string>> {
  const uniqueIds = Array.from(new Set(twitchIds.filter(Boolean)));
  const result = new Set<string>();
  if (uniqueIds.length === 0) {
    return result;
  }

  const accessToken = await getTwitchOAuthToken();
  const clientId = process.env.TWITCH_APP_CLIENT_ID;
  if (!clientId) {
    throw new Error('TWITCH_APP_CLIENT_ID manquant pour la detection des lives test.');
  }

  const BATCH_SIZE = 100;
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    const params = batch.map((id) => `user_id=${encodeURIComponent(id)}`).join('&');
    const response = await fetch(`${TWITCH_API_BASE}/streams?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`[raidEventsubTest] Erreur Twitch streams API: ${response.status} ${detail}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ user_id?: string; user_login?: string; started_at?: string }>;
    };
    for (const stream of data.data || []) {
      if (stream.user_id) {
        result.add(stream.user_id);
      }
    }
  }

  return result;
}

async function getRaiderLiveContext(input: {
  raiderTwitchId: string;
  eventAt: Date;
}): Promise<RaiderLiveContext> {
  const raiderTwitchId = String(input.raiderTwitchId || '').trim();
  if (!raiderTwitchId) {
    return { streamStartedAt: null, liveDurationMinutes: null };
  }

  try {
    const accessToken = await getTwitchOAuthToken();
    const clientId = process.env.TWITCH_APP_CLIENT_ID;
    if (!clientId) {
      return { streamStartedAt: null, liveDurationMinutes: null };
    }

    const response = await fetch(
      `${TWITCH_API_BASE}/streams?user_id=${encodeURIComponent(raiderTwitchId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': clientId,
        },
      }
    );

    if (!response.ok) {
      return { streamStartedAt: null, liveDurationMinutes: null };
    }

    const body = (await response.json()) as {
      data?: Array<{ started_at?: string | null }>;
    };
    const startedAtRaw = body.data?.[0]?.started_at || null;
    if (!startedAtRaw) {
      return { streamStartedAt: null, liveDurationMinutes: null };
    }

    const startedAtDate = new Date(startedAtRaw);
    if (Number.isNaN(startedAtDate.getTime())) {
      return { streamStartedAt: null, liveDurationMinutes: null };
    }

    const diffMs = input.eventAt.getTime() - startedAtDate.getTime();
    const liveDurationMinutes = Math.max(0, Math.floor(diffMs / 60_000));
    return {
      streamStartedAt: startedAtDate.toISOString(),
      liveDurationMinutes,
    };
  } catch {
    return { streamStartedAt: null, liveDurationMinutes: null };
  }
}

async function createToBroadcasterRaidSubscription(
  broadcasterId: string,
  callbackUrl: string,
  secret: string
): Promise<TwitchEventSubSubscription> {
  const accessToken = await getTwitchOAuthToken();
  const clientId = process.env.TWITCH_APP_CLIENT_ID;
  if (!clientId) {
    throw new Error('TWITCH_APP_CLIENT_ID manquant pour creer les subscriptions test.');
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'channel.raid',
      version: '1',
      condition: {
        to_broadcaster_user_id: broadcasterId,
      },
      transport: {
        method: 'webhook',
        callback: callbackUrl,
        secret,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`[raidEventsubTest] Erreur creation subscription test: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as { data?: TwitchEventSubSubscription[] };
  const created = data.data?.[0];
  if (!created?.id) {
    throw new Error('[raidEventsubTest] Twitch n a pas renvoye de subscription test valide.');
  }
  return created;
}

async function getEligibleMembersWithTwitchId(): Promise<EligibleMember[]> {
  // Périmètre EventSub raids-sub (candidats avant filtre live + grâce) :
  // - tous les membres non archivés, actifs ou inactifs côté communauté (is_active),
  // - hors is_archived (retirés du suivi type départ définitif / archivage staff).
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('discord_id,twitch_login,twitch_id,twitch_status,updated_at,role')
    .eq('is_archived', false)
    .not('twitch_login', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible de charger les membres eligibles depuis Supabase: ${error.message}`);
  }

  const rows = (data || []) as Array<{
    discord_id?: string | null;
    twitch_login?: string | null;
    twitch_id?: string | null;
    twitch_status?: { isLive?: boolean } | null;
    updated_at?: string | null;
    role?: string | null;
  }>;

  const missingIdLogins = rows
    .filter((row) => !row.twitch_id && !!row.twitch_login)
    .map((row) => String(row.twitch_login).toLowerCase().trim());

  let resolvedMap = new Map<string, string>();
  if (missingIdLogins.length > 0) {
    // Résolution directe via Helix pour éviter les écarts entre legacy et Supabase.
    resolvedMap = await getTwitchUserIdsByLogins(missingIdLogins);
  }

  return rows
    .map((row) => {
      const twitchLogin = String(row.twitch_login || '').toLowerCase().trim();
      if (!twitchLogin) return null;
      const fallbackResolved = resolvedMap.get(twitchLogin);
      const twitchId = String(row.twitch_id || fallbackResolved || '').trim();
      if (!twitchId) return null;
      const status = (row.twitch_status || {}) as { isLive?: boolean };
      const updatedAt = String(row.updated_at || '').trim();
      const roleRaw = row.role != null ? String(row.role) : null;
      const graceMinutes = isNouveauMemberRole(roleRaw) ? NOUVEAU_GRACE_PERIOD_MINUTES : GRACE_PERIOD_MINUTES;
      const graceLimit = Date.now() - graceMinutes * 60 * 1000;
      return {
        discordId: row.discord_id ? String(row.discord_id) : null,
        twitchLogin,
        twitchId,
        role: roleRaw,
        wasRecentlyLive:
          status?.isLive === true ||
          (status?.isLive === false && !!updatedAt && new Date(updatedAt).getTime() >= graceLimit),
      } as EligibleMember;
    })
    .filter((member): member is EligibleMember => member !== null);
}

export async function getActiveRaidTestRun(): Promise<RaidTestRunRow | null> {
  const { data, error } = await supabaseAdmin
    .from('raid_test_runs')
    .select('id,label,status,started_at,ended_at')
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible de charger le run actif: ${error.message}`);
  }

  return (data?.[0] as RaidTestRunRow | undefined) || null;
}

export async function startRaidTestRun(label: string, createdBy: string): Promise<RaidTestRunRow> {
  const activeRun = await getActiveRaidTestRun();
  if (activeRun) {
    return activeRun;
  }

  const now = nowIso();
  const { data, error } = await supabaseAdmin
    .from('raid_test_runs')
    .insert({
      label: label.trim() || `Run test ${now}`,
      status: 'running',
      started_at: now,
      created_by: createdBy,
      config: {
        source: 'eventsub_test_v2',
        createdBy,
      },
      notes: '',
      created_at: now,
      updated_at: now,
    })
    .select('id,label,status,started_at,ended_at')
    .single();

  if (error || !data) {
    throw new Error(`[raidEventsubTest] Impossible de creer le run test: ${error?.message || 'unknown'}`);
  }

  return data as RaidTestRunRow;
}

export async function stopRaidTestRun(runId: string, status: 'completed' | 'cancelled'): Promise<void> {
  const now = nowIso();
  const { error } = await supabaseAdmin
    .from('raid_test_runs')
    .update({
      status,
      ended_at: now,
      updated_at: now,
    })
    .eq('id', runId);

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible de stopper le run: ${error.message}`);
  }
}

async function ensureActiveRaidTestRun(createdBy: string): Promise<EnsureActiveRunResult | null> {
  const activeRun = await getActiveRaidTestRun();
  if (activeRun) {
    return { run: activeRun, created: false };
  }
  if (!isAutoRunEnabled()) {
    return null;
  }
  const run = await startRaidTestRun(`Run auto live ${new Date().toLocaleString('fr-FR')}`, createdBy);
  return { run, created: true };
}

export async function syncRaidTestEventSubSubscriptions(): Promise<SyncResult> {
  if (!isTestEnabled()) {
    return {
      enabled: false,
      runId: null,
      created: 0,
      revoked: 0,
      retained: 0,
      liveMembers: 0,
      eligibleMembers: 0,
      message: 'RAID_EVENTSUB_TEST_ENABLED est desactive.',
    };
  }

  const secret = getTestEventsubSecret();
  if (!secret) {
    throw new Error('TWITCH_EVENTSUB_TEST_SECRET (ou TWITCH_EVENTSUB_SECRET) manquant.');
  }

  const ensuredRun = await ensureActiveRaidTestRun('system:cron');
  if (!ensuredRun) {
    return {
      enabled: true,
      runId: null,
      created: 0,
      revoked: 0,
      retained: 0,
      liveMembers: 0,
      eligibleMembers: 0,
      message: 'Aucun run test actif et auto-run desactive (RAID_EVENTSUB_TEST_AUTO_RUN=false).',
    };
  }
  const activeRun = ensuredRun.run;

  const eligibleMembers = await getEligibleMembersWithTwitchId();
  const liveSet = await fetchLiveTwitchIds(eligibleMembers.map((m) => m.twitchId));
  const targetMembers = eligibleMembers.filter((m) => liveSet.has(m.twitchId) || m.wasRecentlyLive);

  const callbackUrl = getTestWebhookUrl();
  const accessToken = await getTwitchOAuthToken();
  const subscriptions = await getEventSubSubscriptions(accessToken);
  const testSubs = subscriptions.filter(
    (sub) =>
      sub.type === 'channel.raid' &&
      sub.status === 'enabled' &&
      sub.transport?.callback === callbackUrl &&
      !!sub.condition?.to_broadcaster_user_id
  );

  const existingByTargetId = new Map<string, TwitchEventSubSubscription>();
  for (const sub of testSubs) {
    const targetId = sub.condition.to_broadcaster_user_id as string;
    if (!existingByTargetId.has(targetId)) {
      existingByTargetId.set(targetId, sub);
    }
  }

  let created = 0;
  let revoked = 0;
  let retained = 0;
  const targetIds = new Set(targetMembers.map((m) => m.twitchId));

  for (const member of targetMembers) {
    const existing = existingByTargetId.get(member.twitchId);
    if (existing) {
      retained += 1;
      await markLocalSubscriptionStatus(activeRun.id, member.twitchId, member.twitchLogin, {
        twitchSubscriptionId: existing.id,
        status: 'active',
        monitoredDiscordId: member.discordId,
        metadata: {
          callback: callbackUrl,
          fromSync: true,
        },
      });
      continue;
    }

    try {
      const createdSub = await createToBroadcasterRaidSubscription(member.twitchId, callbackUrl, secret);
      created += 1;
      await markLocalSubscriptionStatus(activeRun.id, member.twitchId, member.twitchLogin, {
        twitchSubscriptionId: createdSub.id,
        status: 'active',
        monitoredDiscordId: member.discordId,
        metadata: {
          callback: callbackUrl,
          fromSync: true,
        },
      });
    } catch (error) {
      await markLocalSubscriptionStatus(activeRun.id, member.twitchId, member.twitchLogin, {
        status: 'failed',
        monitoredDiscordId: member.discordId,
        metadata: {
          callback: callbackUrl,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  for (const sub of testSubs) {
    const targetId = sub.condition.to_broadcaster_user_id as string;
    if (targetIds.has(targetId)) {
      continue;
    }
    try {
      await deleteEventSubSubscription(accessToken, sub.id);
      revoked += 1;
      await markLocalSubscriptionStatus(activeRun.id, targetId, `unknown-${targetId}`, {
        twitchSubscriptionId: sub.id,
        status: 'revoked',
        revokeReason: 'member_offline_or_not_targeted',
        metadata: {
          callback: callbackUrl,
          fromSync: true,
        },
      });
    } catch (error) {
      await markLocalSubscriptionStatus(activeRun.id, targetId, `unknown-${targetId}`, {
        twitchSubscriptionId: sub.id,
        status: 'failed',
        metadata: {
          callback: callbackUrl,
          action: 'revoke',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return {
    enabled: true,
    runId: activeRun.id,
    created,
    revoked,
    retained,
    liveMembers: liveSet.size,
    eligibleMembers: eligibleMembers.length,
    message: ensuredRun.created
      ? 'Sync EventSub test terminee (run auto cree).'
      : 'Sync EventSub test terminee.',
  };
}

export async function saveRaidTestEvent(input: SaveRaidTestEventInput): Promise<{
  stored: boolean;
  duplicate: boolean;
  runId: string | null;
}> {
  const ensuredRun = await ensureActiveRaidTestRun('system:eventsub');
  if (!ensuredRun) {
    return { stored: false, duplicate: false, runId: null };
  }
  const run = ensuredRun.run;

  // Source de vérité: Supabase members (non archivés, actif ou inactif), puis fallback legacy pour compatibilité.
  let fromMember: MatchedMember | null = await findRaidTrackedSupabaseMemberByEventIdentity({
    twitchId: input.event.from_broadcaster_user_id,
    twitchLogin: input.event.from_broadcaster_user_login,
  });
  let toMember: MatchedMember | null = await findRaidTrackedSupabaseMemberByEventIdentity({
    twitchId: input.event.to_broadcaster_user_id,
    twitchLogin: input.event.to_broadcaster_user_login,
  });

  if (!fromMember || !toMember) {
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    if (!fromMember) {
      const fallbackFrom = allMembers.find(
        (m) =>
          m.isArchived !== true &&
          ((!!m.twitchId && m.twitchId === input.event.from_broadcaster_user_id) ||
            m.twitchLogin?.toLowerCase() === input.event.from_broadcaster_user_login.toLowerCase())
      );
      if (fallbackFrom) {
        fromMember = {
          twitchLogin: fallbackFrom.twitchLogin,
          twitchId: fallbackFrom.twitchId,
          isActive: fallbackFrom.isActive,
        };
      }
    }

    if (!toMember) {
      const fallbackTo = allMembers.find(
        (m) =>
          m.isArchived !== true &&
          ((!!m.twitchId && m.twitchId === input.event.to_broadcaster_user_id) ||
            m.twitchLogin?.toLowerCase() === input.event.to_broadcaster_user_login.toLowerCase())
      );
      if (fallbackTo) {
        toMember = {
          twitchLogin: fallbackTo.twitchLogin,
          twitchId: fallbackTo.twitchId,
          isActive: fallbackTo.isActive,
        };
      }
    }
  }

  const eventDate = input.eventsubTimestamp ? new Date(input.eventsubTimestamp) : new Date();
  const validEventDate = Number.isNaN(eventDate.getTime()) ? new Date() : eventDate;
  const raiderLiveContext = await getRaiderLiveContext({
    raiderTwitchId: input.event.from_broadcaster_user_id,
    eventAt: validEventDate,
  });
  const dedupeKey = buildDedupeKey(
    input.event.from_broadcaster_user_id,
    input.event.to_broadcaster_user_id,
    validEventDate
  );

  const processingStatus = fromMember && toMember ? 'matched' : 'ignored';
  const diagnosticReason =
    processingStatus === 'ignored'
      ? `fromMember=${!!fromMember};toMember=${!!toMember};source=supabase_first`
      : null;

  const insertPayload: Record<string, unknown> = {
    run_id: run.id,
    eventsub_message_id: input.eventsubMessageId,
    dedupe_key: dedupeKey,
    from_broadcaster_user_id: input.event.from_broadcaster_user_id,
    from_broadcaster_user_login: input.event.from_broadcaster_user_login,
    from_broadcaster_user_name: input.event.from_broadcaster_user_name,
    to_broadcaster_user_id: input.event.to_broadcaster_user_id,
    to_broadcaster_user_login: input.event.to_broadcaster_user_login,
    to_broadcaster_user_name: input.event.to_broadcaster_user_name,
    viewers: input.event.viewers || 0,
    raider_stream_started_at: raiderLiveContext.streamStartedAt,
    raider_live_duration_minutes: raiderLiveContext.liveDurationMinutes,
    event_at: validEventDate.toISOString(),
    received_at: nowIso(),
    match_from_member: !!fromMember,
    match_to_member: !!toMember,
    processing_status: processingStatus,
    error_reason: diagnosticReason,
    raw_payload: input.rawPayload,
    created_at: nowIso(),
  };

  let { error } = await supabaseAdmin.from('raid_test_events').insert(insertPayload);

  const errorMessage = String((error as any)?.message || '');
  const missingLiveColumns =
    !!error &&
    (errorMessage.includes('raider_stream_started_at') || errorMessage.includes('raider_live_duration_minutes'));
  if (missingLiveColumns) {
    delete insertPayload.raider_stream_started_at;
    delete insertPayload.raider_live_duration_minutes;
    const retry = await supabaseAdmin.from('raid_test_events').insert(insertPayload);
    error = retry.error;
  }

  if (error) {
    if (error.code === '23505') {
      return { stored: false, duplicate: true, runId: run.id };
    }
    throw new Error(`[raidEventsubTest] Impossible d enregistrer l evenement test: ${error.message}`);
  }

  return { stored: true, duplicate: false, runId: run.id };
}

export async function syncRaidTestDeclarationsSnapshot(options?: {
  runId?: string;
  days?: number;
}): Promise<SyncDeclarationsResult> {
  const runId = options?.runId || (await getActiveRaidTestRun())?.id || null;
  const daysRaw = options?.days ?? 30;
  const windowDays = Number.isFinite(daysRaw) ? Math.min(120, Math.max(1, Math.floor(daysRaw))) : 30;

  if (!runId) {
    return {
      runId: null,
      synced: 0,
      windowDays,
      message: 'Aucun run test actif pour synchroniser les declarations.',
    };
  }

  const minDateIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('raid_declarations')
    .select(
      'id,member_discord_id,member_twitch_login,member_display_name,target_twitch_login,raid_at,status,is_approximate,note'
    )
    .gte('raid_at', minDateIso)
    .order('raid_at', { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(`[raidEventsubTest] Impossible de lire raid_declarations: ${error.message}`);
  }

  const { error: deleteError } = await supabaseAdmin.from('raid_test_declarations').delete().eq('run_id', runId);
  if (deleteError) {
    throw new Error(`[raidEventsubTest] Impossible de nettoyer raid_test_declarations: ${deleteError.message}`);
  }

  const rows = (data || []).map((item: any) => ({
    run_id: runId,
    raid_declaration_id: item.id,
    member_discord_id: item.member_discord_id,
    member_twitch_login: normalizeLogin(item.member_twitch_login),
    member_display_name: item.member_display_name,
    target_twitch_login: normalizeLogin(item.target_twitch_login),
    raid_at: item.raid_at,
    declaration_status: item.status,
    imported_at: nowIso(),
    metadata: {
      source: 'raid_declarations',
      isApproximate: !!item.is_approximate,
      note: item.note || '',
    },
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabaseAdmin.from('raid_test_declarations').insert(batch);
    if (insertError) {
      throw new Error(`[raidEventsubTest] Impossible d inserer snapshot declarations: ${insertError.message}`);
    }
  }

  return {
    runId,
    synced: rows.length,
    windowDays,
    message: 'Snapshot declarations synchronise dans le dataset test.',
  };
}

export async function getRaidTestWatchlistSnapshot(): Promise<WatchlistSnapshot> {
  const callbackUrl = getTestWebhookUrl();
  const enabled = isTestEnabled();
  const activeRun = await getActiveRaidTestRun();

  const eligibleMembers = await getEligibleMembersWithTwitchId();
  const liveSet = enabled ? await fetchLiveTwitchIds(eligibleMembers.map((m) => m.twitchId)) : new Set<string>();

  const targetedByPolicyIds = new Set<string>();
  for (const member of eligibleMembers) {
    if (liveSet.has(member.twitchId) || member.wasRecentlyLive) {
      targetedByPolicyIds.add(member.twitchId);
    }
  }

  const localSubs = activeRun
    ? await supabaseAdmin
        .from('raid_test_subscriptions')
        .select('id,monitored_twitch_id,status,twitch_subscription_id,updated_at')
        .eq('run_id', activeRun.id)
        .order('updated_at', { ascending: false })
        .limit(5000)
    : { data: [], error: null as any };

  if (localSubs.error) {
    throw new Error(`[raidEventsubTest] Impossible de lire les subscriptions locales pour watchlist: ${localSubs.error.message}`);
  }

  const localByTwitchId = new Map<string, { id: string; status: string; twitch_subscription_id: string | null }>();
  for (const sub of localSubs.data || []) {
    const key = String((sub as any).monitored_twitch_id || '');
    if (!key || localByTwitchId.has(key)) continue;
    localByTwitchId.set(key, {
      id: String((sub as any).id),
      status: String((sub as any).status || ''),
      twitch_subscription_id: (sub as any).twitch_subscription_id || null,
    });
  }

  let remoteByTargetId = new Map<string, string>();
  if (enabled) {
    const accessToken = await getTwitchOAuthToken();
    const subscriptions = await getEventSubSubscriptions(accessToken);
    const remoteTestSubs = subscriptions.filter(
      (sub) =>
        sub.type === 'channel.raid' &&
        sub.status === 'enabled' &&
        sub.transport?.callback === callbackUrl &&
        !!sub.condition?.to_broadcaster_user_id
    );
    remoteByTargetId = new Map<string, string>();
    for (const sub of remoteTestSubs) {
      const targetId = String(sub.condition.to_broadcaster_user_id || '');
      if (targetId && !remoteByTargetId.has(targetId)) {
        remoteByTargetId.set(targetId, sub.id);
      }
    }
  }

  const members: WatchlistMemberRow[] = eligibleMembers
    .map((member) => {
      const local = localByTwitchId.get(member.twitchId);
      return {
        discordId: member.discordId,
        twitchLogin: member.twitchLogin,
        twitchId: member.twitchId,
        isLiveNow: liveSet.has(member.twitchId),
        wasRecentlyLive: member.wasRecentlyLive,
        shouldBeTargeted: targetedByPolicyIds.has(member.twitchId),
        localSubscriptionStatus: local?.status || null,
        localSubscriptionId: local?.id || null,
        remoteSubscriptionId: remoteByTargetId.get(member.twitchId) || null,
      };
    })
    .sort((a, b) => {
      const aRank = Number(a.shouldBeTargeted) * 2 + Number(a.isLiveNow);
      const bRank = Number(b.shouldBeTargeted) * 2 + Number(b.isLiveNow);
      if (aRank !== bRank) return bRank - aRank;
      return a.twitchLogin.localeCompare(b.twitchLogin);
    });

  const localSubscriptionsActiveOrPending = (localSubs.data || []).filter((sub: any) =>
    ['active', 'pending'].includes(String(sub.status || ''))
  ).length;

  const dropsCandidates = members.filter((member) => member.wasRecentlyLive && !member.isLiveNow);
  const dropsByTwitchId = new Map<
    string,
    { recentOutgoingRaids: number; lastOutgoingRaidAt: string | null }
  >();

  if (activeRun && dropsCandidates.length > 0) {
    const minEventAtIso = new Date(Date.now() - DROP_NO_RAID_WINDOW_MINUTES * 60 * 1000).toISOString();
    const fromIds = dropsCandidates.map((m) => m.twitchId);
    const { data: dropEvents, error: dropEventsError } = await supabaseAdmin
      .from('raid_test_events')
      .select('from_broadcaster_user_id,event_at')
      .eq('run_id', activeRun.id)
      .in('from_broadcaster_user_id', fromIds)
      .gte('event_at', minEventAtIso)
      .order('event_at', { ascending: false })
      .limit(5000);

    if (dropEventsError) {
      throw new Error(
        `[raidEventsubTest] Impossible de lire les events sortants recents pour la section baisse: ${dropEventsError.message}`
      );
    }

    for (const event of dropEvents || []) {
      const twitchId = String((event as any).from_broadcaster_user_id || '');
      if (!twitchId) continue;
      const existing = dropsByTwitchId.get(twitchId);
      if (!existing) {
        dropsByTwitchId.set(twitchId, {
          recentOutgoingRaids: 1,
          lastOutgoingRaidAt: String((event as any).event_at || '') || null,
        });
      } else {
        existing.recentOutgoingRaids += 1;
      }
    }
  }

  const dropsWithoutRaid = dropsCandidates
    .map((member) => {
      const stats = dropsByTwitchId.get(member.twitchId);
      const recentOutgoingRaids = stats?.recentOutgoingRaids || 0;
      return {
        discordId: member.discordId,
        twitchLogin: member.twitchLogin,
        twitchId: member.twitchId,
        endedWithoutRaid: recentOutgoingRaids === 0,
        recentOutgoingRaids,
        lastOutgoingRaidAt: stats?.lastOutgoingRaidAt || null,
      };
    })
    .filter((item) => item.endedWithoutRaid)
    .sort((a, b) => a.twitchLogin.localeCompare(b.twitchLogin));

  return {
    enabled,
    runId: activeRun?.id || null,
    callbackUrl,
    members,
    dropsWithoutRaid,
    summary: {
      eligibleMembers: eligibleMembers.length,
      liveNow: members.filter((m) => m.isLiveNow).length,
      recentlyLive: members.filter((m) => m.wasRecentlyLive).length,
      targetedByPolicy: members.filter((m) => m.shouldBeTargeted).length,
      localSubscriptionsActiveOrPending,
      remoteSubscriptionsEnabled: remoteByTargetId.size,
      dropsWithoutRaid: dropsWithoutRaid.length,
    },
  };
}

