import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

function normalizeLogin(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function buildPairDayKey(fromLogin: string, toLogin: string, dateIso: string): string {
  const day = new Date(dateIso).toISOString().slice(0, 10);
  return `${normalizeLogin(fromLogin)}->${normalizeLogin(toLogin)}@${day}`;
}

function envNumber(name: string, fallback: number): number {
  const raw = Number.parseFloat(String(process.env[name] ?? ''));
  return Number.isFinite(raw) ? raw : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRunId = searchParams.get('runId');
    const daysRaw = Number.parseInt(searchParams.get('days') || '14', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(120, Math.max(1, daysRaw)) : 14;

    const activeRun = await getActiveRaidTestRun();
    const runId = requestedRunId || activeRun?.id || null;

    const thresholds = {
      minCoveragePct: envNumber('RAID_TEST_GO_MIN_COVERAGE_PCT', 85),
      maxEventsOnlyRatePct: envNumber('RAID_TEST_GO_MAX_EVENTS_ONLY_RATE_PCT', 30),
      maxSubscriptionFailureRatePct: envNumber('RAID_TEST_GO_MAX_SUB_FAILURE_RATE_PCT', 20),
      maxEventErrorRatePct: envNumber('RAID_TEST_GO_MAX_EVENT_ERROR_RATE_PCT', 5),
      minDeclarationsCount: envNumber('RAID_TEST_GO_MIN_DECLARATIONS_COUNT', 10),
    };

    if (!runId) {
      return NextResponse.json({
        runId: null,
        days,
        thresholds,
        verdict: {
          readyForProd: false,
          blockers: ['Aucun run test actif.'],
          warnings: [],
        },
        metrics: {
          coveragePct: 0,
          eventsOnlyRatePct: 0,
          subscriptionFailureRatePct: 0,
          eventErrorRatePct: 0,
          declarationsCount: 0,
          eventsCount: 0,
        },
      });
    }

    const fromIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, declarationsRes, subscriptionsRes] = await Promise.all([
      supabaseAdmin
        .from('raid_test_events')
        .select('id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,processing_status')
        .eq('run_id', runId)
        .gte('event_at', fromIso)
        .limit(10000),
      supabaseAdmin
        .from('raid_test_declarations')
        .select('id,member_twitch_login,target_twitch_login,raid_at')
        .eq('run_id', runId)
        .gte('raid_at', fromIso)
        .limit(10000),
      supabaseAdmin
        .from('raid_test_subscriptions')
        .select('id,status,updated_at')
        .eq('run_id', runId)
        .gte('updated_at', fromIso)
        .limit(10000),
    ]);

    if (eventsRes.error || declarationsRes.error || subscriptionsRes.error) {
      return NextResponse.json({ error: 'Impossible de calculer les KPI readiness.' }, { status: 500 });
    }

    const allEvents = eventsRes.data || [];
    const matchedEvents = allEvents.filter((e: any) => e.processing_status === 'matched');
    const eventErrors = allEvents.filter((e: any) => e.processing_status === 'error');
    const declarations = declarationsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];

    const eventPairs = new Set(
      matchedEvents.map((event: any) =>
        buildPairDayKey(event.from_broadcaster_user_login, event.to_broadcaster_user_login, event.event_at)
      )
    );
    const declarationPairs = new Set(
      declarations.map((declaration: any) =>
        buildPairDayKey(declaration.member_twitch_login, declaration.target_twitch_login, declaration.raid_at)
      )
    );

    let declarationsMatched = 0;
    for (const key of declarationPairs) {
      if (eventPairs.has(key)) {
        declarationsMatched += 1;
      }
    }

    let eventsOnlyPairs = 0;
    for (const key of eventPairs) {
      if (!declarationPairs.has(key)) {
        eventsOnlyPairs += 1;
      }
    }

    const coveragePct =
      declarationPairs.size > 0 ? Math.round((declarationsMatched / declarationPairs.size) * 1000) / 10 : 0;
    const eventsOnlyRatePct =
      eventPairs.size > 0 ? Math.round((eventsOnlyPairs / eventPairs.size) * 1000) / 10 : 0;

    const failedSubscriptions = subscriptions.filter((s: any) => s.status === 'failed').length;
    const subscriptionFailureRatePct =
      subscriptions.length > 0 ? Math.round((failedSubscriptions / subscriptions.length) * 1000) / 10 : 0;

    const eventErrorRatePct =
      allEvents.length > 0 ? Math.round((eventErrors.length / allEvents.length) * 1000) / 10 : 0;

    const blockers: string[] = [];
    const warnings: string[] = [];

    if (declarationPairs.size < thresholds.minDeclarationsCount) {
      blockers.push(
        `Volume declarations insuffisant (${declarationPairs.size} < ${thresholds.minDeclarationsCount}).`
      );
    }
    if (coveragePct < thresholds.minCoveragePct) {
      blockers.push(`Couverture trop basse (${coveragePct}% < ${thresholds.minCoveragePct}%).`);
    }
    if (eventsOnlyRatePct > thresholds.maxEventsOnlyRatePct) {
      blockers.push(
        `Taux events sans declaration trop eleve (${eventsOnlyRatePct}% > ${thresholds.maxEventsOnlyRatePct}%).`
      );
    }
    if (subscriptionFailureRatePct > thresholds.maxSubscriptionFailureRatePct) {
      blockers.push(
        `Taux d echec subscriptions trop eleve (${subscriptionFailureRatePct}% > ${thresholds.maxSubscriptionFailureRatePct}%).`
      );
    }
    if (eventErrorRatePct > thresholds.maxEventErrorRatePct) {
      blockers.push(`Taux erreurs events trop eleve (${eventErrorRatePct}% > ${thresholds.maxEventErrorRatePct}%).`);
    }

    if (declarationPairs.size < thresholds.minDeclarationsCount * 2) {
      warnings.push('Echantillon encore faible, continuer la campagne de test.');
    }

    return NextResponse.json({
      runId,
      days,
      thresholds,
      verdict: {
        readyForProd: blockers.length === 0,
        blockers,
        warnings,
      },
      metrics: {
        coveragePct,
        eventsOnlyRatePct,
        subscriptionFailureRatePct,
        eventErrorRatePct,
        declarationsCount: declarationPairs.size,
        eventsCount: eventPairs.size,
      },
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/readiness] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

