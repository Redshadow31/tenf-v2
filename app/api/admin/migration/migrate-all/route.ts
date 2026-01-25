import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes pour migrer tout

/**
 * Migre tous les types de données sélectionnés depuis Blobs vers Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { types } = body;

    if (!Array.isArray(types) || types.length === 0) {
      return NextResponse.json({ error: "Aucun type sélectionné" }, { status: 400 });
    }

    const results: any = {};
    const errors: string[] = [];

    // Migrer Events
    if (types.includes('events')) {
      try {
        const eventsResponse = await fetch(
          `${request.nextUrl.origin}/api/admin/migration/migrate-events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedEvents: [] }), // Migrer tout
          }
        );
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          if (eventsData.success && eventsData.summary) {
            results.events = {
              migrated: eventsData.summary.eventsMigrated || 0,
              skipped: eventsData.summary.eventsSkipped || 0,
              errors: 0,
            };
          } else {
            errors.push(`Events: ${eventsData.error || 'Erreur inconnue'}`);
            results.events = { migrated: 0, skipped: 0, errors: 1 };
          }
        } else {
          errors.push(`Events: Erreur HTTP ${eventsResponse.status}`);
          results.events = { migrated: 0, skipped: 0, errors: 1 };
        }
      } catch (error) {
        errors.push(`Events: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        results.events = { migrated: 0, skipped: 0, errors: 1 };
      }
    }

    // Migrer Evaluations
    if (types.includes('evaluations')) {
      try {
        const evaluationsResponse = await fetch(
          `${request.nextUrl.origin}/api/admin/migration/migrate-evaluations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedMonths: [] }), // Migrer tout
          }
        );
        if (evaluationsResponse.ok) {
          const evaluationsData = await evaluationsResponse.json();
          if (evaluationsData.success && evaluationsData.summary) {
            results.evaluations = {
              migrated: evaluationsData.summary.migrated || 0,
              skipped: evaluationsData.summary.skipped || 0,
              errors: evaluationsData.summary.errors || 0,
            };
          } else {
            errors.push(`Evaluations: ${evaluationsData.error || 'Erreur inconnue'}`);
            results.evaluations = { migrated: 0, skipped: 0, errors: 1 };
          }
        } else {
          errors.push(`Evaluations: Erreur HTTP ${evaluationsResponse.status}`);
          results.evaluations = { migrated: 0, skipped: 0, errors: 1 };
        }
      } catch (error) {
        errors.push(`Evaluations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        results.evaluations = { migrated: 0, skipped: 0, errors: 1 };
      }
    }

    // Migrer Follows
    if (types.includes('follows')) {
      try {
        const followsResponse = await fetch(
          `${request.nextUrl.origin}/api/admin/migration/migrate-follows`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedMonths: [] }), // Migrer tout
          }
        );
        if (followsResponse.ok) {
          const followsData = await followsResponse.json();
          if (followsData.success && followsData.summary) {
            results.follows = {
              migrated: followsData.summary.migrated || 0,
              skipped: followsData.summary.skipped || 0,
              errors: followsData.summary.errors || 0,
            };
          } else {
            errors.push(`Follows: ${followsData.error || 'Erreur inconnue'}`);
            results.follows = { migrated: 0, skipped: 0, errors: 1 };
          }
        } else {
          errors.push(`Follows: Erreur HTTP ${followsResponse.status}`);
          results.follows = { migrated: 0, skipped: 0, errors: 1 };
        }
      } catch (error) {
        errors.push(`Follows: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        results.follows = { migrated: 0, skipped: 0, errors: 1 };
      }
    }

    // Migrer Members
    if (types.includes('members')) {
      try {
        // Récupérer d'abord la liste des membres à migrer
        const checkResponse = await fetch(
          `${request.nextUrl.origin}/api/admin/migration/check-sync-members`,
          { cache: 'no-store' }
        );
        let selectedLogins: string[] = [];
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.success && checkData.data) {
            const merged = checkData.data.merged || checkData.data;
            selectedLogins = (merged.missingInSupabase || []).map((m: any) => m.twitchLogin.toLowerCase());
          }
        }

        const membersResponse = await fetch(
          `${request.nextUrl.origin}/api/admin/migration/migrate-members`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'merged',
              selectedLogins,
            }),
          }
        );
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          if (membersData.success && membersData.summary) {
            results.members = {
              migrated: membersData.summary.migrated || 0,
              skipped: membersData.summary.skipped || 0,
              errors: membersData.summary.errors || 0,
            };
          } else {
            errors.push(`Members: ${membersData.error || 'Erreur inconnue'}`);
            results.members = { migrated: 0, skipped: 0, errors: 1 };
          }
        } else {
          errors.push(`Members: Erreur HTTP ${membersResponse.status}`);
          results.members = { migrated: 0, skipped: 0, errors: 1 };
        }
      } catch (error) {
        errors.push(`Members: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        results.members = { migrated: 0, skipped: 0, errors: 1 };
      }
    }

    const totalMigrated = Object.values(results).reduce((sum: number, r: any) => sum + (r.migrated || 0), 0);
    const totalErrors = Object.values(results).reduce((sum: number, r: any) => sum + (r.errors || 0), 0);

    return NextResponse.json({
      success: errors.length === 0 || totalMigrated > 0,
      message: errors.length === 0
        ? `Migration réussie : ${totalMigrated} élément(s) migré(s)`
        : `Migration partielle : ${totalMigrated} élément(s) migré(s), ${totalErrors} erreur(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Migrate All] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
