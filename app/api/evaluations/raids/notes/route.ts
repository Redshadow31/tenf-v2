import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { evaluationRepository } from '@/lib/repositories';
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
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
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

    // Récupérer toutes les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Construire l'objet notes depuis raidNotes
    const notes: Record<string, { note?: string; manualPoints?: number; lastUpdated?: string; updatedBy?: string }> = {};
    let lastUpdated: string | undefined = undefined;
    
    evaluations.forEach(eval => {
      if (eval.raidNotes && Array.isArray(eval.raidNotes)) {
        eval.raidNotes.forEach((raidNote: any) => {
          if (raidNote.twitchLogin) {
            notes[raidNote.twitchLogin.toLowerCase()] = {
              note: raidNote.note,
              manualPoints: raidNote.manualPoints,
              lastUpdated: raidNote.lastUpdated,
              updatedBy: raidNote.updatedBy,
            };
            
            // Garder la date de mise à jour la plus récente
            if (raidNote.lastUpdated && (!lastUpdated || raidNote.lastUpdated > lastUpdated)) {
              lastUpdated = raidNote.lastUpdated;
            }
          }
        });
      }
    });
    
    return NextResponse.json({
      month: monthKey,
      notes,
      lastUpdated,
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
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
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
    let validatedManualPoints: number | undefined = undefined;
    if (manualPoints !== undefined && manualPoints !== null) {
      const pointsNum = Number(manualPoints);
      if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 5) {
        return NextResponse.json({ error: "Les points manuels doivent être entre 0 et 5" }, { status: 400 });
      }
      validatedManualPoints = pointsNum;
    }

    const monthKey = getMonthKey(year, monthNum);
    const monthDate = `${month}-01`;

    // Récupérer l'évaluation existante ou en créer une nouvelle
    let evaluation = await evaluationRepository.findByMemberAndMonth(twitchLogin, month);
    
    // Préparer les raidNotes
    const now = new Date().toISOString();
    let raidNotes: Array<{
      twitchLogin: string;
      note?: string;
      manualPoints?: number;
      lastUpdated: string;
      updatedBy: string;
    }> = [];
    
    if (evaluation && evaluation.raidNotes && Array.isArray(evaluation.raidNotes)) {
      // Copier les notes existantes
      raidNotes = [...evaluation.raidNotes];
      
      // Trouver ou créer l'entrée pour ce membre
      const existingIndex = raidNotes.findIndex((n: any) => n.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase());
      
      if (existingIndex >= 0) {
        // Mettre à jour l'entrée existante
        raidNotes[existingIndex] = {
          twitchLogin: twitchLogin.toLowerCase(),
          note: note || undefined,
          manualPoints: validatedManualPoints,
          lastUpdated: now,
          updatedBy: admin.id,
        };
      } else {
        // Ajouter une nouvelle entrée
        raidNotes.push({
          twitchLogin: twitchLogin.toLowerCase(),
          note: note || undefined,
          manualPoints: validatedManualPoints,
          lastUpdated: now,
          updatedBy: admin.id,
        });
      }
    } else {
      // Créer une nouvelle liste de notes
      raidNotes = [{
        twitchLogin: twitchLogin.toLowerCase(),
        note: note || undefined,
        manualPoints: validatedManualPoints,
        lastUpdated: now,
        updatedBy: admin.id,
      }];
    }

    // Mettre à jour ou créer l'évaluation
    await evaluationRepository.upsert({
      month: new Date(monthDate),
      twitchLogin: twitchLogin.toLowerCase(),
      raidNotes,
      updatedAt: new Date(),
    });

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

