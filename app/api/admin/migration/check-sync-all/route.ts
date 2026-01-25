import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vérifie la synchronisation de tous les types de données entre Blobs et Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const results: any = {};

    // Vérifier Events
    try {
      const eventsResponse = await fetch(
        `${request.nextUrl.origin}/api/admin/migration/check-sync`,
        { cache: 'no-store' }
      );
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        if (eventsData.success && eventsData.data) {
          results.events = {
            inBlobs: eventsData.data.events?.inBlobs || 0,
            inSupabase: eventsData.data.events?.inSupabase || 0,
            missingInSupabase: eventsData.data.events?.missingInSupabase || [],
          };
        }
      }
    } catch (error) {
      console.error('[Check Sync All] Erreur Events:', error);
    }

    // Vérifier Evaluations
    try {
      const evaluationsResponse = await fetch(
        `${request.nextUrl.origin}/api/admin/migration/check-sync-evaluations`,
        { cache: 'no-store' }
      );
      if (evaluationsResponse.ok) {
        const evaluationsData = await evaluationsResponse.json();
        if (evaluationsData.success && evaluationsData.data) {
          results.evaluations = {
            inBlobs: evaluationsData.data.inBlobs || 0,
            inSupabase: evaluationsData.data.inSupabase || 0,
            missingInSupabase: evaluationsData.data.missingInSupabase || [],
          };
        }
      }
    } catch (error) {
      console.error('[Check Sync All] Erreur Evaluations:', error);
    }

    // Vérifier Follows
    try {
      const followsResponse = await fetch(
        `${request.nextUrl.origin}/api/admin/migration/check-sync-follows`,
        { cache: 'no-store' }
      );
      if (followsResponse.ok) {
        const followsData = await followsResponse.json();
        if (followsData.success && followsData.data) {
          results.follows = {
            inBlobs: followsData.data.inBlobs || 0,
            inSupabase: followsData.data.inSupabase || 0,
            missingInSupabase: followsData.data.missingInSupabase || [],
          };
        }
      }
    } catch (error) {
      console.error('[Check Sync All] Erreur Follows:', error);
    }

    // Vérifier Members
    try {
      const membersResponse = await fetch(
        `${request.nextUrl.origin}/api/admin/migration/check-sync-members`,
        { cache: 'no-store' }
      );
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        if (membersData.success && membersData.data) {
          // Utiliser les données merged par défaut
          const merged = membersData.data.merged || membersData.data;
          results.members = {
            totalInBlobs: merged.totalInBlobs || merged.inBlobs || 0,
            totalInSupabase: merged.totalInSupabase || merged.inSupabase || 0,
            missingInSupabase: merged.missingInSupabase || [],
          };
        }
      }
    } catch (error) {
      console.error('[Check Sync All] Erreur Members:', error);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[Check Sync All] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
