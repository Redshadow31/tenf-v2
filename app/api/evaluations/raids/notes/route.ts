import { NextRequest, NextResponse } from 'next/server';
import { loadRaidEvaluationData, updateRaidEvaluationNote, getRaidEvaluationNote } from '@/lib/raidEvaluationStorage';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { getMonthKey, getCurrentMonthKey } from '@/lib/raidStorage';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les notes d'évaluation pour un mois
 * Query params: ?month=YYYY-MM
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

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Déterminer le monthKey
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const data = await loadRaidEvaluationData(monthKey);
    
    return NextResponse.json({
      month: monthKey,
      notes: data?.notes || {},
      lastUpdated: data?.lastUpdated,
    });
  } catch (error) {
    console.error('[API Raid Evaluation Notes] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour ou crée une note d'évaluation pour un membre
 * Body: { month: string, twitchLogin: string, note: string | undefined, manualPoints: number | undefined }
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

    const body = await request.json();
    const { month, twitchLogin, note, manualPoints } = body;

    if (!month || !twitchLogin) {
      return NextResponse.json(
        { error: "month et twitchLogin sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
    }

    const year = parseInt(monthMatch[1]);
    const monthNum = parseInt(monthMatch[2]);
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
    }

    // Valider manualPoints si fourni (doit être entre 0 et 5)
    if (manualPoints !== undefined && manualPoints !== null) {
      const pointsNum = Number(manualPoints);
      if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 5) {
        return NextResponse.json({ error: "Les points manuels doivent être entre 0 et 5" }, { status: 400 });
      }
    }

    const monthKey = getMonthKey(year, monthNum);

    // Mettre à jour la note et les points manuels
    await updateRaidEvaluationNote(monthKey, twitchLogin, note, manualPoints, admin.id);

    return NextResponse.json({
      success: true,
      message: "Note et points mis à jour avec succès",
      note: note || null,
      manualPoints: manualPoints !== undefined && manualPoints !== null ? Number(manualPoints) : null,
    });
  } catch (error) {
    console.error('[API Raid Evaluation Notes] Erreur PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

