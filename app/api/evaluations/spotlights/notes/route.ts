import { NextRequest, NextResponse } from 'next/server';
import { loadSpotlightEvaluationData, updateSpotlightEvaluationNote } from '@/lib/spotlightEvaluationStorage';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { getMonthKey, getCurrentMonthKey } from '@/lib/evaluationStorage';

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
          monthKey = monthParam;
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const data = await loadSpotlightEvaluationData(monthKey);
    
    return NextResponse.json({
      month: monthKey,
      notes: data?.notes || {},
      lastUpdated: data?.lastUpdated,
    });
  } catch (error) {
    console.error('[API Spotlight Evaluation Notes] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour ou crée une note d'évaluation pour un membre
 * Body: { month: string, twitchLogin: string, note: string | undefined }
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
    const { month, twitchLogin, note } = body;

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

    const monthKey = month; // Utiliser directement le format YYYY-MM

    // Mettre à jour la note
    await updateSpotlightEvaluationNote(monthKey, twitchLogin, note, admin.id);

    return NextResponse.json({
      success: true,
      message: "Note mise à jour avec succès",
      note: note || null,
    });
  } catch (error) {
    console.error('[API Spotlight Evaluation Notes] Erreur PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


