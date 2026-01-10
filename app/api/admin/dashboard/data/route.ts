import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import {
  loadDashboardData,
  saveDashboardData,
  updateDashboardSection,
  DashboardData,
  MonthlyDataPoint,
  RankingMember,
  TopClip,
} from '@/lib/dashboardDataStorage';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les données du dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : read pour voir les données
    if (!hasPermission(admin.id, "read")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const data = await loadDashboardData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[API Dashboard Data] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour les données du dashboard
 * Body: { section: string, data: MonthlyDataPoint[] | RankingMember[] | TopClip[], ... }
 */
export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : write pour modifier les données
    if (!hasPermission(admin.id, "write")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { section, data, fullData } = body;

    if (fullData) {
      // Mise à jour complète des données
      const updatedData: DashboardData = {
        ...fullData,
        lastUpdated: new Date().toISOString(),
        updatedBy: admin.id,
      };
      await saveDashboardData(updatedData, admin.id);

      return NextResponse.json({
        success: true,
        message: "Données du dashboard mises à jour avec succès",
        data: updatedData,
      });
    } else if (section && data) {
      // Mise à jour d'une section spécifique
      const validSections: Array<keyof Pick<DashboardData, 'twitchActivity' | 'spotlightProgression' | 'vocalRanking' | 'textRanking' | 'topClips'>> = [
        'twitchActivity',
        'spotlightProgression',
        'vocalRanking',
        'textRanking',
        'topClips',
      ];

      if (!validSections.includes(section)) {
        return NextResponse.json(
          { error: `Section invalide. Sections valides: ${validSections.join(', ')}` },
          { status: 400 }
        );
      }

      await updateDashboardSection(section, data, admin.id);

      return NextResponse.json({
        success: true,
        message: `Section ${section} mise à jour avec succès`,
      });
    } else {
      return NextResponse.json(
        { error: "section et data, ou fullData sont requis" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API Dashboard Data] Erreur PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

