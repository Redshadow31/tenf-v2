import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

type RawSubscriptionRow = {
  id: string;
  run_id: string;
  twitch_subscription_id: string | null;
  monitored_member_discord_id: string | null;
  monitored_twitch_id: string;
  monitored_twitch_login: string;
  condition_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  last_seen_at: string | null;
  metadata?: Record<string, unknown> | null;
};

type DropReasonKind =
  | 'unknown_target'
  | 'raid_not_done'
  | 'different_target'
  | 'sync_cleanup'
  | 'other'
  | null;

const RAID_NEAR_REVOKE_WINDOW_MINUTES = 90;

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'En attente';
    case 'revoked':
      return 'Révoquée';
    case 'failed':
      return 'En erreur';
    case 'expired':
      return 'Expirée';
    default:
      return status || 'Inconnu';
  }
}

function getConditionLabel(conditionType: string): string {
  if (conditionType === 'to_broadcaster') return 'Vers la cible (to_broadcaster)';
  if (conditionType === 'from_broadcaster') return 'Depuis la source (from_broadcaster)';
  return conditionType || 'Inconnue';
}

function toMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function hasRaidNearRevoke(
  row: RawSubscriptionRow,
  eventsByFromId: Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>
): { found: boolean; targetLogin: string | null } {
  const revokedMs = toMs(row.revoked_at);
  if (!revokedMs) return { found: false, targetLogin: null };
  const events = eventsByFromId.get(String(row.monitored_twitch_id || '')) || [];
  if (events.length === 0) return { found: false, targetLogin: null };

  const windowMs = RAID_NEAR_REVOKE_WINDOW_MINUTES * 60 * 1000;
  for (const event of events) {
    const eventMs = toMs(event.event_at);
    if (!eventMs) continue;
    if (eventMs <= revokedMs && revokedMs - eventMs <= windowMs) {
      return { found: true, targetLogin: event.to_broadcaster_user_login || null };
    }
  }
  return { found: false, targetLogin: null };
}

function getReasonDetails(
  row: RawSubscriptionRow,
  hasKnownMember: boolean,
  eventsByFromId: Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>
): { reasonKind: DropReasonKind; reasonLabel: string | null } {
  if (!row.revoke_reason) return { reasonKind: null, reasonLabel: null };
  if (row.revoke_reason === 'member_offline_or_not_targeted') {
    if (!hasKnownMember || row.monitored_twitch_login.startsWith('unknown-')) {
      return {
        reasonKind: 'unknown_target',
        reasonLabel: 'Cible inconnue (non reliée à une fiche membre).',
      };
    }

    const nearbyRaid = hasRaidNearRevoke(row, eventsByFromId);
    if (nearbyRaid.found) {
      return {
        reasonKind: 'different_target',
        reasonLabel: nearbyRaid.targetLogin
          ? `Cible différente (raid détecté vers ${nearbyRaid.targetLogin}).`
          : 'Cible différente (raid détecté vers une autre cible).',
      };
    }
    return {
      reasonKind: 'raid_not_done',
      reasonLabel: 'Raid non fait (live terminé sans raid détecté).',
    };
  }
  if (row.revoke_reason === 'sync_cleanup') {
    return {
      reasonKind: 'sync_cleanup',
      reasonLabel: 'Nettoyage automatique de synchronisation.',
    };
  }
  return { reasonKind: 'other', reasonLabel: row.revoke_reason };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const requestedRunId = searchParams.get('runId');
    const limitRaw = Number.parseInt(searchParams.get('limit') || '200', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(10, limitRaw)) : 200;

    const activeRun = await getActiveRaidTestRun();
    const runId = requestedRunId || activeRun?.id;
    if (!runId) {
      return NextResponse.json({ runId: null, subscriptions: [], total: 0, activeRun: null });
    }

    let query = supabaseAdmin
      .from('raid_test_subscriptions')
      .select(
        'id,run_id,twitch_subscription_id,monitored_member_discord_id,monitored_twitch_id,monitored_twitch_login,condition_type,status,created_at,updated_at,activated_at,revoked_at,revoke_reason,last_seen_at,metadata',
        { count: 'exact' }
      )
      .eq('run_id', runId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: 'Impossible de lire les subscriptions test' }, { status: 500 });
    }

    await loadMemberDataFromStorage();
    const members = getAllMemberData();
    const memberByDiscordId = new Map<string, (typeof members)[number]>();
    const memberByTwitchId = new Map<string, (typeof members)[number]>();
    const memberByTwitchLogin = new Map<string, (typeof members)[number]>();
    for (const member of members) {
      if (member.discordId) memberByDiscordId.set(String(member.discordId), member);
      if (member.twitchId) memberByTwitchId.set(String(member.twitchId), member);
      if (member.twitchLogin) memberByTwitchLogin.set(String(member.twitchLogin).toLowerCase(), member);
    }

    const rows = (data || []) as RawSubscriptionRow[];
    const rowsForReasonAnalysis = rows.filter(
      (row) => row.revoke_reason === 'member_offline_or_not_targeted' && !!row.revoked_at && !!row.monitored_twitch_id
    );
    const eventsByFromId = new Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>();
    if (rowsForReasonAnalysis.length > 0) {
      const twitchIds = Array.from(new Set(rowsForReasonAnalysis.map((row) => String(row.monitored_twitch_id))));
      const revokedTimes = rowsForReasonAnalysis
        .map((row) => toMs(row.revoked_at))
        .filter((value): value is number => value !== null);
      const minRevokedMs = Math.min(...revokedTimes);
      const maxRevokedMs = Math.max(...revokedTimes);
      const fromIso = new Date(minRevokedMs - RAID_NEAR_REVOKE_WINDOW_MINUTES * 60 * 1000).toISOString();
      const toIso = new Date(maxRevokedMs + 5 * 60 * 1000).toISOString();

      const { data: outgoingEvents, error: outgoingError } = await supabaseAdmin
        .from('raid_test_events')
        .select('from_broadcaster_user_id,to_broadcaster_user_login,event_at')
        .eq('run_id', runId)
        .in('from_broadcaster_user_id', twitchIds)
        .gte('event_at', fromIso)
        .lte('event_at', toIso)
        .order('event_at', { ascending: false })
        .limit(5000);

      if (outgoingError) {
        return NextResponse.json({ error: 'Impossible d analyser les motifs de révocation' }, { status: 500 });
      }

      for (const event of outgoingEvents || []) {
        const fromId = String((event as any).from_broadcaster_user_id || '');
        if (!fromId) continue;
        const list = eventsByFromId.get(fromId) || [];
        list.push({
          event_at: String((event as any).event_at || ''),
          to_broadcaster_user_login: String((event as any).to_broadcaster_user_login || ''),
        });
        eventsByFromId.set(fromId, list);
      }
    }

    const enriched = rows.map((typedRow) => {
      const member =
        (typedRow.monitored_member_discord_id
          ? memberByDiscordId.get(String(typedRow.monitored_member_discord_id))
          : null) ||
        memberByTwitchId.get(String(typedRow.monitored_twitch_id || '')) ||
        memberByTwitchLogin.get(String(typedRow.monitored_twitch_login || '').toLowerCase()) ||
        null;

      const preferredName = member
        ? String(member.siteUsername || member.displayName || member.twitchLogin || '').trim()
        : '';
      const memberName = preferredName || typedRow.monitored_twitch_login || 'inconnu';
      const memberLogin = member?.twitchLogin || typedRow.monitored_twitch_login || null;
      const hasKnownMember = !!member;
      const reason = getReasonDetails(typedRow, hasKnownMember, eventsByFromId);

      return {
        ...typedRow,
        memberName,
        memberLogin,
        hasKnownMember,
        statusLabel: getStatusLabel(typedRow.status),
        conditionLabel: getConditionLabel(typedRow.condition_type),
        reasonKind: reason?.reasonKind || null,
        reasonLabel: reason?.reasonLabel || null,
      };
    });

    return NextResponse.json({
      runId,
      activeRun,
      statusFilter: status,
      total: count || 0,
      subscriptions: enriched,
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/subscriptions] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

