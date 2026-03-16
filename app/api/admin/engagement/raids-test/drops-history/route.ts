import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

type DropReasonKind = 'unknown_target' | 'raid_not_done' | 'different_target';

type RawRevokedRow = {
  id: string;
  monitored_member_discord_id: string | null;
  monitored_twitch_id: string;
  monitored_twitch_login: string;
  revoked_at: string | null;
  revoke_reason: string | null;
};

const RAID_NEAR_REVOKE_WINDOW_MINUTES = 90;

function toMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function monthKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

function detectNearbyOutgoingRaid(
  row: RawRevokedRow,
  eventsByFromId: Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>
): { found: boolean; targetLogin: string | null } {
  const revokedMs = toMs(row.revoked_at);
  if (!revokedMs) return { found: false, targetLogin: null };
  const events = eventsByFromId.get(String(row.monitored_twitch_id || '')) || [];
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

function classifyDrop(
  row: RawRevokedRow,
  hasKnownMember: boolean,
  eventsByFromId: Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>
): { kind: DropReasonKind; label: string } {
  if (!hasKnownMember || row.monitored_twitch_login.startsWith('unknown-')) {
    return { kind: 'unknown_target', label: 'Cible inconnue' };
  }
  const nearbyRaid = detectNearbyOutgoingRaid(row, eventsByFromId);
  if (nearbyRaid.found) {
    return {
      kind: 'different_target',
      label: nearbyRaid.targetLogin
        ? `Cible différente (raid vers ${nearbyRaid.targetLogin})`
        : 'Cible différente',
    };
  }
  return { kind: 'raid_not_done', label: 'Raid non fait' };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRunId = searchParams.get('runId');
    const selectedMonth = (searchParams.get('month') || '').trim();
    const daysRaw = Number.parseInt(searchParams.get('days') || '365', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(730, Math.max(30, daysRaw)) : 365;

    const activeRun = await getActiveRaidTestRun();
    const runId = requestedRunId || activeRun?.id || null;
    if (!runId) {
      return NextResponse.json({
        runId: null,
        days,
        selectedMonth: null,
        summary: { total: 0, raidNotDone: 0, differentTarget: 0, unknownTarget: 0 },
        months: [],
        entries: [],
      });
    }

    const fromIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: revokedRowsRaw, error: revokedError } = await supabaseAdmin
      .from('raid_test_subscriptions')
      .select('id,monitored_member_discord_id,monitored_twitch_id,monitored_twitch_login,revoked_at,revoke_reason')
      .eq('run_id', runId)
      .eq('status', 'revoked')
      .eq('revoke_reason', 'member_offline_or_not_targeted')
      .not('revoked_at', 'is', null)
      .gte('revoked_at', fromIso)
      .order('revoked_at', { ascending: false })
      .limit(10000);

    if (revokedError) {
      return NextResponse.json({ error: 'Impossible de lire l historique des baisses.' }, { status: 500 });
    }

    const revokedRows = (revokedRowsRaw || []) as RawRevokedRow[];
    if (revokedRows.length === 0) {
      return NextResponse.json({
        runId,
        days,
        selectedMonth: selectedMonth || null,
        summary: { total: 0, raidNotDone: 0, differentTarget: 0, unknownTarget: 0 },
        months: [],
        entries: [],
      });
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

    const twitchIds = Array.from(new Set(revokedRows.map((row) => String(row.monitored_twitch_id))));
    const revokedMsValues = revokedRows
      .map((row) => toMs(row.revoked_at))
      .filter((value): value is number => value !== null);
    const minRevokedMs = Math.min(...revokedMsValues);
    const maxRevokedMs = Math.max(...revokedMsValues);
    const eventsFromIso = new Date(minRevokedMs - RAID_NEAR_REVOKE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const eventsToIso = new Date(maxRevokedMs + 5 * 60 * 1000).toISOString();

    const { data: outgoingEvents, error: outgoingError } = await supabaseAdmin
      .from('raid_test_events')
      .select('from_broadcaster_user_id,to_broadcaster_user_login,event_at')
      .eq('run_id', runId)
      .in('from_broadcaster_user_id', twitchIds)
      .gte('event_at', eventsFromIso)
      .lte('event_at', eventsToIso)
      .order('event_at', { ascending: false })
      .limit(10000);

    if (outgoingError) {
      return NextResponse.json({ error: 'Impossible d analyser les raids sortants.' }, { status: 500 });
    }

    const eventsByFromId = new Map<string, Array<{ event_at: string; to_broadcaster_user_login: string }>>();
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

    const entries = revokedRows.map((row) => {
      const member =
        (row.monitored_member_discord_id ? memberByDiscordId.get(String(row.monitored_member_discord_id)) : null) ||
        memberByTwitchId.get(String(row.monitored_twitch_id || '')) ||
        memberByTwitchLogin.get(String(row.monitored_twitch_login || '').toLowerCase()) ||
        null;
      const hasKnownMember = !!member;
      const classification = classifyDrop(row, hasKnownMember, eventsByFromId);
      const preferredName = member ? String(member.siteUsername || member.displayName || member.twitchLogin || '').trim() : '';
      const memberName = preferredName || row.monitored_twitch_login || 'inconnu';
      const memberLogin = member?.twitchLogin || row.monitored_twitch_login || null;
      const revokedAt = String(row.revoked_at || '');
      return {
        id: row.id,
        month: monthKey(revokedAt),
        revokedAt,
        memberName,
        memberLogin,
        twitchId: row.monitored_twitch_id,
        hasKnownMember,
        reasonKind: classification.kind,
        reasonLabel: classification.label,
      };
    });

    const filteredEntries = selectedMonth ? entries.filter((entry) => entry.month === selectedMonth) : entries;

    const monthBuckets = new Map<
      string,
      { month: string; label: string; total: number; raidNotDone: number; differentTarget: number; unknownTarget: number }
    >();
    for (const entry of entries) {
      const key = entry.month;
      const existing = monthBuckets.get(key) || {
        month: key,
        label: monthLabel(key),
        total: 0,
        raidNotDone: 0,
        differentTarget: 0,
        unknownTarget: 0,
      };
      existing.total += 1;
      if (entry.reasonKind === 'raid_not_done') existing.raidNotDone += 1;
      if (entry.reasonKind === 'different_target') existing.differentTarget += 1;
      if (entry.reasonKind === 'unknown_target') existing.unknownTarget += 1;
      monthBuckets.set(key, existing);
    }

    const months = Array.from(monthBuckets.values()).sort((a, b) => b.month.localeCompare(a.month));
    const summary = {
      total: entries.length,
      raidNotDone: entries.filter((entry) => entry.reasonKind === 'raid_not_done').length,
      differentTarget: entries.filter((entry) => entry.reasonKind === 'different_target').length,
      unknownTarget: entries.filter((entry) => entry.reasonKind === 'unknown_target').length,
    };

    return NextResponse.json({
      runId,
      days,
      selectedMonth: selectedMonth || null,
      summary,
      months,
      entries: filteredEntries.slice(0, 500),
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/drops-history] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

