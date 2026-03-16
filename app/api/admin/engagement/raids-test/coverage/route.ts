import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' || message.includes('does not exist') || message.includes('could not find the table');
}

function normalizeLogin(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function buildPairDayKey(fromLogin: string, toLogin: string, dateIso: string): string {
  const day = new Date(dateIso).toISOString().slice(0, 10);
  return `${normalizeLogin(fromLogin)}->${normalizeLogin(toLogin)}@${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRunId = searchParams.get('runId');
    const daysRaw = Number.parseInt(searchParams.get('days') || '7', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(60, Math.max(1, daysRaw)) : 7;

    const activeRun = await getActiveRaidTestRun();
    const runId = requestedRunId || activeRun?.id || null;

    if (!runId) {
      return NextResponse.json({
        runId: null,
        activeRun,
        days,
        summary: {
          declarationsSnapshotTotal: 0,
          testMatchedTotal: 0,
          matchedDeclarations: 0,
          unmatchedDeclarations: 0,
          eventsWithoutDeclaration: 0,
          matchedPairs: 0,
          declarationsCoveragePct: 0,
        },
        declarationStatusBreakdown: {
          processing: 0,
          toStudy: 0,
          validated: 0,
          rejected: 0,
        },
        matchedPairs: [],
        declarationsOnly: [],
        eventsOnly: [],
      });
    }

    const fromIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, declarationsRes] = await Promise.all([
      supabaseAdmin
        .from('raid_test_events')
        .select('id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,processing_status')
        .eq('run_id', runId)
        .eq('processing_status', 'matched')
        .gte('event_at', fromIso)
        .order('event_at', { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from('raid_test_declarations')
        .select('id,raid_declaration_id,member_twitch_login,target_twitch_login,raid_at,declaration_status')
        .eq('run_id', runId)
        .gte('raid_at', fromIso)
        .order('raid_at', { ascending: false })
        .limit(5000),
    ]);

    if (eventsRes.error && !isMissingRelationError(eventsRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire les evenements test' }, { status: 500 });
    }
    if (declarationsRes.error && !isMissingRelationError(declarationsRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire les declarations snapshot test' }, { status: 500 });
    }

    const events = eventsRes.data || [];
    const declarations = declarationsRes.data || [];

    const eventMap = new Map<string, any[]>();
    for (const event of events as any[]) {
      const key = buildPairDayKey(
        event.from_broadcaster_user_login,
        event.to_broadcaster_user_login,
        event.event_at
      );
      const list = eventMap.get(key) || [];
      list.push(event);
      eventMap.set(key, list);
    }

    const declarationMap = new Map<string, any[]>();
    for (const declaration of declarations as any[]) {
      const key = buildPairDayKey(
        declaration.member_twitch_login,
        declaration.target_twitch_login,
        declaration.raid_at
      );
      const list = declarationMap.get(key) || [];
      list.push(declaration);
      declarationMap.set(key, list);
    }

    const matchedPairs: Array<{
      key: string;
      declarationsCount: number;
      eventsCount: number;
      sampleDeclaration?: any;
      sampleEvent?: any;
    }> = [];
    const declarationsOnly: any[] = [];
    const eventsOnly: any[] = [];

    for (const [key, declarationRows] of declarationMap.entries()) {
      const eventRows = eventMap.get(key) || [];
      if (eventRows.length > 0) {
        matchedPairs.push({
          key,
          declarationsCount: declarationRows.length,
          eventsCount: eventRows.length,
          sampleDeclaration: declarationRows[0],
          sampleEvent: eventRows[0],
        });
      } else {
        declarationsOnly.push(...declarationRows);
      }
    }

    for (const [key, eventRows] of eventMap.entries()) {
      if (!declarationMap.has(key)) {
        eventsOnly.push(...eventRows);
      }
    }

    const declarationStatusBreakdown = {
      processing: declarations.filter((d: any) => d.declaration_status === 'processing').length,
      toStudy: declarations.filter((d: any) => d.declaration_status === 'to_study').length,
      validated: declarations.filter((d: any) => d.declaration_status === 'validated').length,
      rejected: declarations.filter((d: any) => d.declaration_status === 'rejected').length,
    };

    const matchedDeclarations = declarations.length - declarationsOnly.length;
    const coveragePct =
      declarations.length > 0 ? Math.round((matchedDeclarations / declarations.length) * 1000) / 10 : 0;

    return NextResponse.json({
      runId,
      activeRun,
      days,
      summary: {
        declarationsSnapshotTotal: declarations.length,
        testMatchedTotal: events.length,
        matchedDeclarations,
        unmatchedDeclarations: declarationsOnly.length,
        eventsWithoutDeclaration: eventsOnly.length,
        matchedPairs: matchedPairs.length,
        declarationsCoveragePct: coveragePct,
      },
      declarationStatusBreakdown,
      matchedPairs: matchedPairs.slice(0, 100),
      declarationsOnly: declarationsOnly.slice(0, 100),
      eventsOnly: eventsOnly.slice(0, 100),
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/coverage] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

